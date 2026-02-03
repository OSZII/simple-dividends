import { db } from '../db';
import { stocks, stockHistory, dividends as dividendsTable, countries as countriesTable, sectors as sectorsTable } from '../db/schema';
import { eq, and, gte, lte, isNotNull, isNull, count, asc, or, desc } from 'drizzle-orm';
import YahooFinance from 'yahoo-finance2';
import { delay } from './util';
import { dev } from '$app/environment';

const DELAY = 2000;

async function importQuoteSummary() {

    const log = (message: string) => console.log(`[IMPORT-QUOTE-SUMMARY] ${message}`);
    const logError = (message: string, error?: unknown) => {
        console.error(`[IMPORT-QUOTE-SUMMARY] ERROR: ${message}`);
        if (error instanceof Error) {
            console.error(`[IMPORT-QUOTE-SUMMARY] ${error.message}`);
        }
    };

    try {
        let countries = await db.select().from(countriesTable);
        let sectors = await db.select().from(sectorsTable);

        console.log(countries);
        console.log(sectors);
        const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
        const stocksToImport = await db
            .select({ symbol: stocks.symbol }).from(stocks)
            .where(
                or(
                    isNull(stocks.countryId),
                    isNull(stocks.sectorId),
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
                        modules: ['assetProfile']
                    });
                } catch (apiError) {
                    logError(`Failed to fetch quote summary for ${stockData.symbol}`, apiError);
                    failCount++;
                    continue;
                }

                let country = quoteSummary.assetProfile?.country ?? null;
                let sector = quoteSummary.assetProfile?.sectorKey ?? null;

                // id 1 are the default entries for not available
                let countryId: number | null = null;
                // if country is defined use id or add to database
                if (country) {
                    countryId = countries.find(c => c.name === country)?.id ?? null;
                    if (!countryId) {
                        try {
                            let insertedCountry = await db.insert(countriesTable).values({ name: country }).returning();
                            countryId = insertedCountry[0].id;
                            countries.push({ id: insertedCountry[0].id, name: insertedCountry[0].name });
                        } catch (dbError) {
                            logError(`Failed to insert country "${country}" for ${stockData.symbol}`, dbError);
                            countryId = 1; // fallback to default
                        }
                    }
                } else {
                    // if no country defined value 1
                    countryId = 1;
                }

                // id 1 are the default entries for not available
                let sectorId: number | null = null;
                // if sector is defined use id or add to database
                if (sector) {
                    sectorId = sectors.find(s => s.name === sector)?.id ?? null;
                    if (!sectorId) {
                        try {
                            let insertedSector = await db.insert(sectorsTable).values({ name: sector }).returning();
                            sectorId = insertedSector[0].id;
                            sectors.push({ id: insertedSector[0].id, name: insertedSector[0].name });
                        } catch (dbError) {
                            logError(`Failed to insert sector "${sector}" for ${stockData.symbol}`, dbError);
                            sectorId = 1; // fallback to default
                        }
                    }
                } else {
                    // if no sector defined value 1
                    sectorId = 1;
                }

                try {
                    await db.update(stocks)
                        .set({
                            countryId,
                            sectorId
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
