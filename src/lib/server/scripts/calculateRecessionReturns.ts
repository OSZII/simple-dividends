import { db } from '../db';
import { stocks, stockHistory, dividends as dividendsTable } from '../db/schema';
import { eq, and, gte, lte, isNotNull, isNull, count, asc } from 'drizzle-orm';

// Recession period according to National Bureau of Economic Research (NBER) 2007 Dec - 2009 June
// to see the full picture use jan 2007 - dec 2009
const RECESSION_START = '2007-01-01';
const RECESSION_END = '2009-12-31';

// Configuration
const BATCH_SIZE = 100;

async function calculateRecessionReturns(silent: boolean = false) {
    const log = (msg: string) => {
        if (!silent) console.log(`[CALCULATE-RECESSION-RETURNS] ${msg}`);
    };

    log('Starting recession returns calculation...');

    // Get total count of stocks with shortName and volume
    const stockCountResult = await db
        .select({ count: count() })
        .from(stocks)
        .where(and(
            isNotNull(stocks.shortName),
            isNotNull(stocks.volume),
            isNull(stocks.recessionReturn)
        ));

    const totalStockCount = stockCountResult[0].count;
    log(`Found ${totalStockCount} stocks with shortName and volume`);
    log(`Processing in batches of ${BATCH_SIZE}`);

    let processedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let batchNumber = 0;

    // Process stocks in batches
    while (true) {
        // Load a batch of stocks that have shortName and volume
        const stocksBatch = await db
            .select({
                id: stocks.id,
                symbol: stocks.symbol,
                shortName: stocks.shortName
            })
            .from(stocks)
            .where(and(
                isNotNull(stocks.shortName),
                isNotNull(stocks.volume),
                isNull(stocks.recessionReturn)
            ))
            .limit(BATCH_SIZE);

        // Exit if no more stocks
        if (stocksBatch.length === 0) {
            break;
        }

        batchNumber++;
        log(`--- Processing batch ${batchNumber} (${stocksBatch.length} stocks) ---`);

        // Process each stock in the batch
        for (const stock of stocksBatch) {
            try {
                // Fetch stock price history for recession period
                const priceHistory = await db
                    .select({
                        date: stockHistory.date,
                        price: stockHistory.price
                    })
                    .from(stockHistory)
                    .where(
                        and(
                            eq(stockHistory.symbol, stock.symbol),
                            gte(stockHistory.date, RECESSION_START),
                            lte(stockHistory.date, RECESSION_END)
                        )
                    )
                    .orderBy(asc(stockHistory.date));

                // Skip if no historical data for the recession period
                if (priceHistory.length < 2) {
                    log(`⏭ Skipping ${stock.symbol}: insufficient price data for recession period`);
                    // insert negative value so that it is skipped in the future
                    await db
                        .update(stocks)
                        .set({
                            recessionReturn: -9999,
                        })
                        .where(eq(stocks.id, stock.id));
                    skippedCount++;
                    processedCount++;
                    continue;
                }

                // Get start and end prices
                const startPrice = parseFloat(priceHistory[0].price);
                const endPrice = parseFloat(priceHistory[priceHistory.length - 1].price);

                // Fetch dividend history for the recession period
                const dividendHistory = await db
                    .select({
                        date: dividendsTable.date,
                        amount: dividendsTable.amount
                    })
                    .from(dividendsTable)
                    .where(
                        and(
                            eq(dividendsTable.symbol, stock.symbol),
                            gte(dividendsTable.date, RECESSION_START),
                            lte(dividendsTable.date, RECESSION_END)
                        )
                    )
                    .orderBy(asc(dividendsTable.date));


                const analysis = analyzeRecession(dividendHistory, startPrice, endPrice);

                // Determine dividend performance category
                let dividendPerformance: string;
                if (dividendHistory.length > 0) {
                    dividendPerformance = analysis.dividendStatus;
                } else {
                    dividendPerformance = 'no_dividend';
                }

                let recessionReturn = analysis.totalReturn;

                // Update stock with recession performance data
                await db
                    .update(stocks)
                    .set({
                        recessionReturn, // Round to 2 decimal places
                        recessionDividendPerformance: dividendPerformance,
                        annualTotalDividends: analysis.annualTotals
                    })
                    .where(eq(stocks.id, stock.id));

                log(`✓ ${stock.symbol}: start price=${startPrice}, end price=${endPrice}, return=${recessionReturn}%, dividends=${dividendPerformance}`);
            } catch (error) {
                log(`❌ Error processing ${stock.symbol}: ${error}`);
            }

            processedCount++;
        }
    }

    log('=== Calculation Complete ===');
    log(`Total stocks: ${totalStockCount}`);
    log(`Processed: ${processedCount}`);
    log(`Updated: ${updatedCount}`);
    log(`Skipped (insufficient data): ${skippedCount}`);

    return {
        totalStocks: totalStockCount,
        processed: processedCount,
        updated: updatedCount,
        skipped: skippedCount
    };
}

function analyzeRecession(history: any[], startPrice: number, endPrice: number) {
    // Group by year
    const yearly = history.reduce((acc, div) => {
        const year = div.date.split('-')[0];
        acc[year] = (acc[year] || 0) + parseFloat(div.amount);
        return acc;
    }, {} as Record<string, number>);

    // Get all dividend amounts chronologically
    const amounts = history.map(d => parseFloat(d.amount));

    // Find the baseline (first non-zero regular dividend)
    const baselineRate = amounts.find(a => a > 0) || 0;

    // Check if any dividend was lower than baseline (indicating a cut)
    // We look at subsequent non-zero dividends to see if there was a cut
    let wasCut = false;
    let lowestRate = baselineRate;

    for (let i = 1; i < amounts.length; i++) {
        if (amounts[i] === 0) {
            // Zero dividend is definitely a cut
            wasCut = true;
            lowestRate = 0;
            break;
        }
    }

    // Final dividend rate
    const finalRate = amounts[amounts.length - 1];

    // Calculate rate growth from baseline to final
    const rateGrowth = ((finalRate - baselineRate) / baselineRate) * 100;

    // Calculate annual cash growth (2007 vs 2009)
    const cashGrowth = ((yearly['2009'] - yearly['2007']) / yearly['2007']) * 100;

    // Determine dividend status
    let dividendStatus: string;

    if (wasCut) {
        dividendStatus = "cut";
    } else if (finalRate > baselineRate) {
        dividendStatus = "increased";
    } else if (Math.abs(finalRate - baselineRate) < 0.0001) {
        dividendStatus = "maintained";
    } else {
        dividendStatus = "cut";
    }

    // Total Return (Price change + all dividends / start price)
    const allDivsSum = Object.values(yearly).reduce((a: any, b: any) => a + b, 0) as unknown as number;
    const totalReturn = (((endPrice - startPrice) + allDivsSum) / startPrice) * 100;

    return {
        annualTotals: yearly,
        dividendRateGrowth: rateGrowth.toFixed(2) + "%",
        annualCashGrowth: cashGrowth.toFixed(2) + "%",
        totalReturn: totalReturn,
        dividendStatus: dividendStatus,
        baselineDividendRate: baselineRate,
        finalDividendRate: finalRate
    };
}

export { calculateRecessionReturns };
