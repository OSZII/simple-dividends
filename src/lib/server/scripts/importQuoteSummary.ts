import { db } from '../db';
import { stocks, stockHistory, dividends as dividendsTable, countries as countriesTable, sectors as sectorsTable, dividendCalendar } from '../db/schema';
import { eq, and, gte, lte, isNotNull, isNull, count, asc, or, desc } from 'drizzle-orm';
import YahooFinance from 'yahoo-finance2';
import { delay } from './util';

const DELAY = 7000;

async function importQuoteSummary() {

    const log = (message: string) => console.log(`[IMPORT-QUOTE-SUMMARY] ${message}`);
    const logError = (message: string, error?: unknown) => {
        console.error(`[IMPORT-QUOTE-SUMMARY] ERROR: ${message}`);
        if (error instanceof Error) {
            console.error(`[IMPORT-QUOTE-SUMMARY] ${error.message}`);
        }
    };

    try {
        const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
        const stocksToImport = await db
            .select({ symbol: stocks.symbol }).from(stocks)
            .where(
                or(
                    isNull(stocks.beta),
                    isNull(stocks.sector),
                )
            )

        log(`Found ${stocksToImport.length} stocks to import`);

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < stocksToImport.length; i++) {
            const stockData = stocksToImport[i];
            let startTime = performance.now();

            try {
                log(`Processing ${i + 1}/${stocksToImport.length}: ${stockData.symbol}`);

                let quoteSummary;
                try {
                    quoteSummary = await yahooFinance.quoteSummary(stockData.symbol, {
                        modules: ['assetProfile', 'summaryDetail', 'financialData', 'defaultKeyStatistics', 'calendarEvents']
                    });
                } catch (apiError) {
                    logError(`Failed to fetch quote summary for ${stockData.symbol}`, apiError);
                    failCount++;
                    continue;
                }

                let sector = quoteSummary.assetProfile?.sectorKey ?? null;

                let beta = quoteSummary.summaryDetail?.beta;
                let freeCashflow = quoteSummary.financialData?.freeCashflow;
                let ebitda = quoteSummary.financialData?.ebitda;
                let totalCash = quoteSummary.financialData?.totalCash;
                let totalDebt = quoteSummary.financialData?.totalDebt;
                let recommendation = quoteSummary.financialData?.recommendationKey;
                let numberOfAnalystOpinions = quoteSummary.financialData?.numberOfAnalystOpinions;
                let debtToEquity = quoteSummary.financialData?.debtToEquity;
                let netDebtToEbitda = null;
                if (totalDebt && totalCash && ebitda) {
                    netDebtToEbitda = (totalDebt - totalCash) / ebitda;
                }
                let netDebtToCapital = null;
                let totalEquity = null;
                let totalCapital = null;
                if (totalDebt && debtToEquity) {
                    totalEquity = totalDebt / (debtToEquity / 100);
                    totalCapital = totalDebt + totalEquity;
                    netDebtToCapital = totalDebt / totalCapital;
                }
                let payoutRatio = quoteSummary.summaryDetail?.payoutRatio;

                // NEW: From summaryDetail
                let dividendYield5YearAverage = quoteSummary.summaryDetail?.fiveYearAvgDividendYield ?? null;
                let priceToSalesTrailing12Months = quoteSummary.summaryDetail?.priceToSalesTrailing12Months ?? null;

                // NEW: From financialData
                let profitMargins = quoteSummary.financialData?.profitMargins ?? null;
                let grossMargins = quoteSummary.financialData?.grossMargins ?? null;
                let operatingMargins = quoteSummary.financialData?.operatingMargins ?? null;
                let earningsGrowth = quoteSummary.financialData?.earningsGrowth ?? null;
                let totalRevenue = quoteSummary.financialData?.totalRevenue ?? null;

                // NEW: From defaultKeyStatistics
                let earningsQuarterlyGrowth = quoteSummary.defaultKeyStatistics?.earningsQuarterlyGrowth ?? null;
                let netIncomeToCommon = quoteSummary.defaultKeyStatistics?.netIncomeToCommon ?? null;

                // NEW: From calendarEvents
                let exDividendDateRaw = quoteSummary.calendarEvents?.exDividendDate ?? null;
                let exDividendDate: null | Date | string = exDividendDateRaw ? new Date(exDividendDateRaw) : null;
                if (exDividendDate !== null) {
                    const dateString = exDividendDate.toISOString().split('T')[0];

                    exDividendDate = dateString;

                    log(`Inserting ex-dividend date for ${stockData.symbol}: ${dateString}`);
                    await db.insert(dividendCalendar).values({
                        symbol: stockData.symbol,
                        date: dateString,
                    }).onConflictDoNothing();
                }

                // NEW: Calculate ROIC
                let returnOnInvestedCapital: number | null = null;
                if (totalRevenue && operatingMargins && totalDebt && debtToEquity && netIncomeToCommon) {
                    // Calculate operating income
                    const operatingIncome = totalRevenue * operatingMargins;

                    // Calculate effective tax rate (guard against division by zero)
                    let effectiveTaxRate = 0.21; // Default to 21% US corporate rate
                    if (operatingIncome > 0) {
                        effectiveTaxRate = 1 - (netIncomeToCommon / operatingIncome);
                        // Clamp to reasonable range (0-50%)
                        effectiveTaxRate = Math.max(0, Math.min(0.5, effectiveTaxRate));
                    }

                    // Calculate NOPAT
                    const nopat = operatingIncome * (1 - effectiveTaxRate);

                    // Calculate invested capital
                    const totalEquityCalc = totalDebt / (debtToEquity / 100);
                    const investedCapital = totalEquityCalc + totalDebt - (totalCash ?? 0);

                    // Calculate ROIC (guard against division by zero)
                    if (investedCapital > 0) {
                        returnOnInvestedCapital = nopat / investedCapital;
                    }
                }

                try {
                    await db.update(stocks)
                        .set({
                            sector,
                            beta,
                            freeCashflow,
                            ebitda,
                            totalCash,
                            totalDebt,
                            netDebtToEbitda,
                            recommendation,
                            numberOfAnalystOpinions,
                            debtToEquity,
                            netDebtToCapital,
                            payoutRatio,
                            // NEW FIELDS:
                            dividendYield5YearAverage,
                            priceToSalesTrailing12Months,
                            profitMargins,
                            grossMargins,
                            operatingMargins,
                            earningsGrowth,
                            earningsQuarterlyGrowth,
                            returnOnInvestedCapital,
                            exDividendDate,
                        })
                        .where(eq(stocks.symbol, stockData.symbol));
                    successCount++;
                } catch (updateError) {
                    logError(`Failed to update stock ${stockData.symbol}`, updateError);
                    failCount++;
                }

            } catch (stockError) {
                logError(`Unexpected error processing ${stockData.symbol}`, stockError);
                failCount++;
            } finally {
                let endTime = performance.now();
                let timeInMiliSeconds = endTime - startTime;
                if (DELAY - timeInMiliSeconds > 0) {
                    await delay(DELAY - timeInMiliSeconds);
                }
            }
        }

        log(`Import complete: ${successCount} succeeded, ${failCount} failed`);

    } catch (error) {
        logError('Fatal error during import', error);
        throw error;
    }

}

export { importQuoteSummary };
