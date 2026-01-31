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
    console.log('Starting stocks update...');

    // Build lookup maps for sectors and countries
    const sectorRows = await db.select().from(sectors);
    const countryRows = await db.select().from(countries);

    const sectorMap = new Map<string, number>();
    sectorRows.forEach((s) => sectorMap.set(s.name, s.id));

    const countryMap = new Map<string, number>();
    countryRows.forEach((c) => countryMap.set(c.name, c.id));

    // Get all existing symbols from the database
    const symbolsRows = await db.select({ id: stocks.id, symbol: stocks.symbol })
        .from(stocks);
    const symbolsArray = symbolsRows.map((s) => s.symbol);

    console.log(`Found ${symbolsArray.length} stocks to update`);

    // Group symbols into batches of 200 for Yahoo Finance API
    const groupedSymbols = symbolsArray.reduce((acc, symbol) => {
        const lastGroup = acc[acc.length - 1];
        if (lastGroup && lastGroup.length < 200) {
            lastGroup.push(symbol);
        } else {
            acc.push([symbol]);
        }
        return acc;
    }, [] as string[][]);

    // Process each batch
    for (let i = 0; i < groupedSymbols.length; i++) {
        const symbolsBatch = groupedSymbols[i];
        console.log(`Processing batch ${i + 1}/${groupedSymbols.length} (${symbolsBatch.length} symbols)...`);

        let stockData;
        try {
            stockData = await yahooFinance.quote(symbolsBatch);
        } catch (error: any) {
            console.error(`Error fetching quotes for batch ${i + 1}:`, error.message);
            if (error.result) {
                console.log(`Partial results available, using ${error.result.length} valid quotes`);
                stockData = error.result;
            } else {
                console.log(`Skipping batch ${i + 1} due to validation error`);
                continue;
            }
        }

        // Update each stock individually
        for (const stockInfo of stockData) {
            if (!stockInfo.symbol) {
                console.warn(`Skipping entry: no symbol found`);
                continue;
            }

            try {
                const sectorId = stockInfo.sectorKey ? sectorMap.get(stockInfo.sectorKey) ?? null : null;
                const countryId = stockInfo.country ? countryMap.get(stockInfo.country) ?? null : null;

                const updateData: typeof stocks.$inferInsert = mapToStockInsert(stockInfo, sectorId, countryId);

                // Update the stock by symbol
                await db
                    .update(stocks)
                    .set(updateData)
                    .where(eq(stocks.symbol, stockInfo.symbol));

                console.log(`✓ Updated ${stockInfo.symbol}`);
            } catch (error) {
                console.error(`Error updating stock ${stockInfo.symbol}:`, error);
            }
        }

        console.log(`Batch ${i + 1}/${groupedSymbols.length} completed`);
    }

    console.log('All stocks updated successfully!');
    return;
}

export { importStocks };
