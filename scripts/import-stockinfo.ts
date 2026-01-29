import { db } from './db';
import { stocks, sectors, countries } from '../src/lib/server/db/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

async function importStocks() {
    console.log('Starting stocks import...');

    const companyDataPath = path.resolve(process.cwd(), 'data/companyData');

    // Build lookup maps for sectors and countries
    const sectorRows = await db.select().from(sectors);
    const countryRows = await db.select().from(countries);

    const sectorMap = new Map<string, number>();
    sectorRows.forEach((s) => sectorMap.set(s.name, s.id));

    const countryMap = new Map<string, number>();
    countryRows.forEach((c) => countryMap.set(c.name, c.id));

    const files = fs.readdirSync(companyDataPath);

    const companyInfoArray: (typeof stocks.$inferInsert)[] = [];

    files.forEach((file) => {
        if (file === '.DS_Store') {
            return;
        }

        const filePath = `${companyDataPath}/${file}/info.json`;
        if (!fs.existsSync(filePath)) {
            console.warn(`Skipping ${file}: info.json not found`);
            return;
        }

        const companyInfoRaw = fs.readFileSync(filePath) as unknown as string;
        const info = JSON.parse(companyInfoRaw);

        if (!info.symbol) {
            console.warn(`Skipping ${file}: no symbol found`);
            return;
        }

        // Map JSON fields to schema
        const stockData: typeof stocks.$inferInsert = {
            symbol: info.symbol,
            shortName: info.shortName ?? null,
            longName: info.longName ?? null,

            // Relations
            sectorId: info.sectorKey ? sectorMap.get(info.sectorKey) ?? null : null,
            countryId: info.country ? countryMap.get(info.country) ?? null : null,
            exchange: info.exchange ?? null,

            // Company Info
            fullTimeEmployees: info.fullTimeEmployees ?? null,
            marketCap: info.marketCap ?? null,

            // Dividend Data
            dividendRate: info.dividendRate ?? null,
            dividendYield: info.dividendYield ?? null,
            exDividendDate: info.exDividendDate ?? null,
            dividendDate: info.dividendDate ?? null,
            payoutRatio: info.payoutRatio ?? null,
            fiveYearAvgDividendYield: info.fiveYearAvgDividendYield ?? null,
            trailingAnnualDividendRate: info.trailingAnnualDividendRate ?? null,
            trailingAnnualDividendYield: info.trailingAnnualDividendYield ?? null,

            // Dividend Growth & Streaks - not available in JSON, leave null
            dividendGrowth1Year: null,
            dividendGrowth5Year: null,
            dividendGrowth10Year: null,
            dividendGrowthStreak: null,
            uninterruptedDividendStreak: null,
            latestDividendRaiseDate: null,

            // Payment Info - not available in JSON, leave null
            paymentFrequency: null,
            paymentScheduleMonths: null,

            // Yield Analysis - not available in JSON
            yieldRelativeToHistory: null,

            // Recession Performance - not available in JSON
            recessionDividendPerformance: null,
            recessionReturn: null,

            // Valuation
            trailingPE: info.trailingPE ?? null,
            forwardPE: info.forwardPE ?? null,
            priceToBook: info.priceToBook ?? null,
            priceToSalesTrailing12Months: info.priceToSalesTrailing12Months ?? null,
            peRelativeToHistory: null,
            valuationStatus: null,

            // Price Data
            currentPrice: info.currentPrice ?? info.regularMarketPrice ?? null,
            previousClose: info.previousClose ?? null,
            fiftyTwoWeekHigh: info.fiftyTwoWeekHigh ?? null,
            fiftyTwoWeekLow: info.fiftyTwoWeekLow ?? null,
            fiftyDayAverage: info.fiftyDayAverage ?? null,
            twoHundredDayAverage: info.twoHundredDayAverage ?? null,
            beta: info.beta ?? null,

            // Earnings
            trailingEps: info.trailingEps ?? info.epsTrailingTwelveMonths ?? null,
            forwardEps: info.forwardEps ?? info.epsForward ?? null,
            earningsQuarterlyGrowth: info.earningsQuarterlyGrowth ?? null,
            earningsGrowth: info.earningsGrowth ?? null,
            earningsTimestamp: info.earningsTimestamp ?? null,

            // Financial Health
            profitMargins: info.profitMargins ?? null,
            grossMargins: info.grossMargins ?? null,
            operatingMargins: info.operatingMargins ?? null,
            freeCashflow: info.freeCashflow ?? null,
            operatingCashflow: info.operatingCashflow ?? null,
            returnOnAssets: info.returnOnAssets ?? null,
            returnOnEquity: info.returnOnEquity ?? null,
            returnOnInvestedCapital: null, // Not available in JSON

            // Debt Metrics
            debtToEquity: info.debtToEquity ?? null,
            currentRatio: info.currentRatio ?? null,
            quickRatio: info.quickRatio ?? null,
            netDebtToCapital: null, // Not available in JSON
            netDebtToEbitda: null, // Not available in JSON
            creditRating: null, // Not available in JSON

            // Analyst Data
            recommendationKey: info.recommendationKey ?? null,
            recommendationMean: info.recommendationMean ?? null,
            targetMeanPrice: info.targetMeanPrice ?? null,
            targetMedianPrice: info.targetMedianPrice ?? null,
            numberOfAnalystOpinions: info.numberOfAnalystOpinions ?? null
        };

        companyInfoArray.push(stockData);
    });

    console.log(`Processed ${companyInfoArray.length} stocks`);

    try {
        // Insert in batches to avoid query size limits
        const BATCH_SIZE = 100;
        for (let i = 0; i < companyInfoArray.length; i += BATCH_SIZE) {
            const batch = companyInfoArray.slice(i, i + BATCH_SIZE);
            await db.insert(stocks).values(batch).onConflictDoNothing();
            console.log(`Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(companyInfoArray.length / BATCH_SIZE)}`);
        }

        console.log('Stocks import completed successfully!');
    } catch (error) {
        console.error('Error importing stocks:', error);
        process.exit(1);
    }

    process.exit(0);
}

importStocks();
