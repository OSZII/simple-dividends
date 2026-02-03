import { db } from '../db';
import { stocks, sectors, countries, stockHistory, dividends as dividendsTable, splits as splitsTable } from '../db/schema';
import { count, desc, eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { join } from 'path';
import { mapToStockInsert } from '../db/util';
import { isNull } from 'drizzle-orm';
import YahooFinance from 'yahoo-finance2';
import { delay } from './util';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
// Check if a date is older than 1 week
function isOlderThanOneWeek(dateString: string): boolean {
    const date = new Date(dateString);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return date < oneWeekAgo;
}

async function importStockHistory() {
    console.log('[IMPORT-HISTORY]Starting history update...');

    // Configuration
    const BATCH_SIZE = 50; // Load stocks in batches of 50
    const DELAY_MS = 4000; // 4 seconds between requests to avoid rate limiting

    // get count of stocks in db
    const stockCount = await db.select({ count: count() })
        .from(stocks)

    let totalStockCount = stockCount[0].count;

    console.log(`[IMPORT-HISTORY]Found ${totalStockCount} stocks to check history`);
    console.log(`[IMPORT-HISTORY]Processing in batches of ${BATCH_SIZE} with ${DELAY_MS}ms delay between requests`);
    console.log(`[IMPORT-HISTORY]Estimated time: ~${Math.ceil((totalStockCount * DELAY_MS) / 1000 / 60 / 60)} hours`);

    let processedCount = 0;
    let skippedCount = 0;
    let offset = 0;

    // Process stocks in batches
    while (true) {
        // Load a batch of stocks
        const stocksBatch = await db.select()
            .from(stocks)
            .limit(BATCH_SIZE)
            .offset(offset);

        // Exit if no more stocks
        if (stocksBatch.length === 0) {
            break;
        }

        console.log(`\n[IMPORT-HISTORY]--- Loading batch ${Math.floor(offset / BATCH_SIZE) + 1} (${stocksBatch.length} stocks) ---`);

        // Process each stock in the batch
        for (let i = 0; i < stocksBatch.length; i++) {
            const stock = stocksBatch[i];
            const globalIndex = offset + i + 1;

            try {
                // Get the last history date for this stock
                const lastHistoryDate = await db
                    .select()
                    .from(stockHistory)
                    .where(eq(stockHistory.symbol, stock.symbol))
                    .orderBy(desc(stockHistory.date))
                    .limit(1);

                // Check if we should skip this stock (data is less than 1 week old)
                if (lastHistoryDate.length > 0) {
                    const lastDate = lastHistoryDate[0].date;
                    if (!isOlderThanOneWeek(lastDate)) {
                        console.log(`[IMPORT-HISTORY]⏭ Skipping ${globalIndex}/${totalStockCount}: ${stock.symbol} (last data from ${lastDate} is less than 1 week old)`);
                        skippedCount++;
                        continue;
                    }
                }

                console.log(`[IMPORT-HISTORY] Processing ${globalIndex}/${totalStockCount}: ${stock.symbol}`);

                // Determine start date
                let startDate = "1900-01-01";
                if (lastHistoryDate.length > 0) {
                    startDate = lastHistoryDate[0].date;
                }

                console.log(`[IMPORT-HISTORY] Fetching history from ${startDate}...`);

                // Get history via charts function
                const history = await yahooFinance.chart(stock.symbol, { period1: startDate });

                let prices = history.quotes;
                let dividends = history.events?.dividends ?? [];
                let splits = history.events?.splits ?? [];

                const INSERT_BATCH_SIZE = 10000;

                // Prepare price data for batch insert
                const priceValues = prices
                    .map(price => {
                        const priceValue = price.adjclose ?? price.close;
                        if (priceValue === null || priceValue === undefined) {
                            return null;
                        }
                        return {
                            symbol: stock.symbol,
                            date: price.date instanceof Date ? price.date.toISOString().split('T')[0] : price.date,
                            price: priceValue.toString(),
                            volume: price.volume ?? 0,
                        };
                    })
                    .filter((v): v is NonNullable<typeof v> => v !== null);

                // Insert prices in batches
                for (let j = 0; j < priceValues.length; j += INSERT_BATCH_SIZE) {
                    const batch = priceValues.slice(j, j + INSERT_BATCH_SIZE);
                    try {
                        await db.insert(stockHistory).values(batch).onConflictDoNothing();
                    } catch (error) {
                        console.error(`[IMPORT-HISTORY] Error inserting price batch for ${stock.symbol}:`, error);
                    }
                }

                // Prepare dividend data for batch insert
                const dividendValues = dividends.map(dividend => ({
                    symbol: stock.symbol,
                    date: dividend.date instanceof Date ? dividend.date.toISOString().split('T')[0] : dividend.date,
                    amount: dividend.amount.toString(),
                }));

                // Insert dividends in batches
                for (let j = 0; j < dividendValues.length; j += INSERT_BATCH_SIZE) {
                    const batch = dividendValues.slice(j, j + INSERT_BATCH_SIZE);
                    try {
                        await db.insert(dividendsTable).values(batch).onConflictDoNothing();
                    } catch (error) {
                        console.error(`[IMPORT-HISTORY] Error inserting dividend batch for ${stock.symbol}:`, error);
                    }
                }

                // Prepare split data for batch insert
                const splitValues = splits.map(split => ({
                    symbol: stock.symbol,
                    date: split.date instanceof Date ? split.date.toISOString().split('T')[0] : split.date,
                    numerator: split.numerator,
                    denominator: split.denominator,
                }));

                // Insert splits in batches
                for (let j = 0; j < splitValues.length; j += INSERT_BATCH_SIZE) {
                    const batch = splitValues.slice(j, j + INSERT_BATCH_SIZE);
                    try {
                        await db.insert(splitsTable).values(batch).onConflictDoNothing();
                    } catch (error) {
                        console.error(`[IMPORT-HISTORY] Error inserting split batch for ${stock.symbol}:`, error);
                    }
                }

                console.log(`[IMPORT-HISTORY]✓ Completed ${stock.symbol}: ${prices.length} prices, ${dividends.length} dividends, ${splits.length} splits`);
                processedCount++;

                // Wait 4 seconds before next request to avoid rate limiting
                if (i < stocksBatch.length - 1 || offset + BATCH_SIZE < totalStockCount) {
                    console.log(`[IMPORT-HISTORY] Waiting ${DELAY_MS}ms before next request...`);
                    await delay(DELAY_MS);
                }
            } catch (error) {
                console.error(`[IMPORT-HISTORY]❌ Error processing stock ${stock.symbol}:`, error);
                // Continue to next stock after delay
                await delay(DELAY_MS);
                continue;
            }
        }

        offset += BATCH_SIZE;
    }

    console.log('\n[IMPORT-HISTORY] === Import Complete ===');
    console.log(`[IMPORT-HISTORY]Total stocks: ${totalStockCount}`);
    console.log(`[IMPORT-HISTORY]Processed: ${processedCount}`);
    console.log(`[IMPORT-HISTORY]Skipped (data < 1 week old): ${skippedCount}`);
    return;
}

export { importStockHistory };
