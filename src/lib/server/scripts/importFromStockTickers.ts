import { db } from '../db';
import { stocks, sectors, countries } from '../db/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { join } from 'path';
import { mapToStockInsert } from '../db/util';
import { isNull } from 'drizzle-orm';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

async function importStocks() {
    console.log('Starting stocks import...');



    // Build lookup maps for sectors and countries
    const sectorRows = await db.select().from(sectors);
    const countryRows = await db.select().from(countries);

    const sectorMap = new Map<string, number>();
    sectorRows.forEach((s) => sectorMap.set(s.name, s.id));

    const countryMap = new Map<string, number>();
    countryRows.forEach((c) => countryMap.set(c.name, c.id));

    const symbolsRows = await db.select({ id: stocks.id, symbol: stocks.symbol })
        .from(stocks)
    const symbolsArray = symbolsRows.map((s) => s.symbol);


    // process.exit(0);
    // const symbols = fs.readFileSync(path.join(dataDir, "uniqueStockSymbolList.json")) as unknown as string;

    // group by 200 symbols
    const groupedSymbols = symbolsArray.reduce((acc, symbol) => {
        const lastGroup = acc[acc.length - 1];
        if (lastGroup && lastGroup.length < 200) {
            lastGroup.push(symbol);
        } else {
            acc.push([symbol]);
        }
        return acc;
    }, [] as string[][]);


    groupedSymbols.forEach(async (symbolsArray: string[]) => {
        let stockData;
        try {
            stockData = await yahooFinance.quote(symbolsArray);
        } catch (error: any) {
            console.error(`Error fetching quotes for batch:`, error.message);
            if (error.result) {
                console.log(`Partial results available, using ${error.result.length} valid quotes`);
                stockData = error.result;
            } else {
                console.log(`Skipping entire batch due to validation error`);
                return;
            }
        }

        let companyInfoArray: typeof stocks.$inferInsert[] = [];
        stockData.forEach((stockInfo: any) => {
            if (!stockInfo.symbol) {
                console.warn(`Skipping entry: no symbol found`);
                return;
            }

            const sectorId = stockInfo.sectorKey ? sectorMap.get(stockInfo.sectorKey) ?? null : null;
            const countryId = stockInfo.country ? countryMap.get(stockInfo.country) ?? null : null;

            const stockData: typeof stocks.$inferInsert = mapToStockInsert(stockInfo, sectorId, countryId);

            //     symbol: stockInfo.symbol,
            //     shortName: stockInfo.shortName ?? null,
            //     longName: stockInfo.longName ?? null,

            //     // Relations
            //     sectorId: stockInfo.sectorKey ? sectorMap.get(stockInfo.sectorKey) ?? null : null,
            //     countryId: stockInfo.country ? countryMap.get(stockInfo.country) ?? null : null,
            //     exchange: stockInfo.exchange ?? null,

            //     // Company Info
            //     fullTimeEmployees: stockInfo.fullTimeEmployees ?? null,
            //     marketCap: stockInfo.marketCap ?? null,

            //     // Dividend Data
            //     dividendRate: stockInfo.dividendRate ?? null,
            //     dividendYield: stockInfo.dividendYield ?? null,
            //     exDividendDate: stockInfo.exDividendDate ? new Date(stockInfo.exDividendDate).getTime() : null,
            //     dividendDate: stockInfo.dividendDate ? new Date(stockInfo.dividendDate).getTime() : null,
            //     payoutRatio: stockInfo.payoutRatio ?? null,
            //     fiveYearAvgDividendYield: stockInfo.fiveYearAvgDividendYield ?? null,
            //     trailingAnnualDividendRate: stockInfo.trailingAnnualDividendRate ?? null,
            //     trailingAnnualDividendYield: stockInfo.trailingAnnualDividendYield ?? null,

            //     // Dividend Growth & Streaks - not available in JSON, leave null
            //     dividendGrowth1Year: null,
            //     dividendGrowth5Year: null,
            //     dividendGrowth10Year: null,
            //     dividendGrowthStreak: null,
            //     uninterruptedDividendStreak: null,
            //     latestDividendRaiseDate: null,

            //     // Payment Info - not available in JSON, leave null
            //     paymentFrequency: null,
            //     paymentScheduleMonths: null,

            //     // Yield Analysis - not available in JSON
            //     yieldRelativeToHistory: null,

            //     // Recession Performance - not available in JSON
            //     recessionDividendPerformance: null,
            //     recessionReturn: null,

            //     // Valuation
            //     trailingPE: stockInfo.trailingPE ?? null,
            //     forwardPE: stockInfo.forwardPE ?? null,
            //     priceToBook: stockInfo.priceToBook ?? null,
            //     priceToSalesTrailing12Months: stockInfo.priceToSalesTrailing12Months ?? null,
            //     peRelativeToHistory: null,
            //     valuationStatus: null,

            //     // Price Data
            //     currentPrice: stockInfo.currentPrice ?? stockInfo.regularMarketPrice ?? null,
            //     previousClose: stockInfo.previousClose ?? null,
            //     fiftyTwoWeekHigh: stockInfo.fiftyTwoWeekHigh ?? null,
            //     fiftyTwoWeekLow: stockInfo.fiftyTwoWeekLow ?? null,
            //     fiftyDayAverage: stockInfo.fiftyDayAverage ?? null,
            //     twoHundredDayAverage: stockInfo.twoHundredDayAverage ?? null,
            //     beta: stockInfo.beta ?? null,

            //     // Earnings
            //     trailingEps: stockInfo.trailingEps ?? stockInfo.epsTrailingTwelveMonths ?? null,
            //     forwardEps: stockInfo.forwardEps ?? stockInfo.epsForward ?? null,
            //     earningsQuarterlyGrowth: stockInfo.earningsQuarterlyGrowth ?? null,
            //     earningsGrowth: stockInfo.earningsGrowth ?? null,
            //     earningsTimestamp: stockInfo.earningsTimestamp ? new Date(stockInfo.earningsTimestamp).getTime() : null,

            //     // Financial Health
            //     profitMargins: stockInfo.profitMargins ?? null,
            //     grossMargins: stockInfo.grossMargins ?? null,
            //     operatingMargins: stockInfo.operatingMargins ?? null,
            //     freeCashflow: stockInfo.freeCashflow ?? null,
            //     operatingCashflow: stockInfo.operatingCashflow ?? null,
            //     returnOnAssets: stockInfo.returnOnAssets ?? null,
            //     returnOnEquity: stockInfo.returnOnEquity ?? null,
            //     returnOnInvestedCapital: null, // Not available in JSON

            //     // Debt Metrics
            //     debtToEquity: stockInfo.debtToEquity ?? null,
            //     currentRatio: stockInfo.currentRatio ?? null,
            //     quickRatio: stockInfo.quickRatio ?? null,
            //     netDebtToCapital: null, // Not available in JSON
            //     netDebtToEbitda: null, // Not available in JSON
            //     creditRating: null, // Not available in JSON

            //     // Analyst Data
            //     recommendationKey: stockInfo.recommendationKey ?? null,
            //     recommendationMean: stockInfo.recommendationMean ?? null,
            //     targetMeanPrice: stockInfo.targetMeanPrice ?? null,
            //     targetMedianPrice: stockInfo.targetMedianPrice ?? null,
            //     numberOfAnalystOpinions: stockInfo.numberOfAnalystOpinions ?? null
            // };

            companyInfoArray.push(stockData);

        })

        try {
            console.log("updating 200 stocks...");
            await db
                .update(stocks)
                .set(companyInfoArray)
                .onConflictDoNothing();
            console.log('200 stocks updated successfully!');
        } catch (error) {
            console.error('Error importing stocks:', error);
            process.exit(1);
        }
    })

    return;
}

export { importStocks };
