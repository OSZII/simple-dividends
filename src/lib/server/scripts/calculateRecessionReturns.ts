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
            isNull(stocks.totalRecessionReturn)
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
                name: stocks.name
            })
            .from(stocks)
            .where(and(
                isNull(stocks.totalRecessionReturn)
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
                            totalRecessionReturn: -9999,
                            recessionDividendPerformance: 'no_data',
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
                // Update stock with recession performance data
                await db
                    .update(stocks)
                    .set({
                        totalRecessionReturn: analysis.totalReturn, // Round to 2 decimal places
                        recessionDividendPerformance: analysis.dividendStatus,
                    })
                    .where(eq(stocks.id, stock.id));

                updatedCount++;
                log(`✓ ${stock.symbol}: start=${startPrice}, end=${endPrice}, return=${analysis.totalReturn.toFixed(2)}%, dividends=${analysis.dividendStatus}`);
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

function analyzeRecession(dividendHistory: any[], startPrice: number, endPrice: number) {
    // 1. Calculate Total Return
    // Since price is 'adjclose' (adjusted close), it already includes dividends.
    // So Total Return = ((End Price - Start Price) / Start Price) * 100
    const totalReturn = ((endPrice - startPrice) / startPrice) * 100;

    // 2. Analyze Dividend Performance
    let dividendStatus: string = 'no_data';
    const yearly: Record<string, number> = {};

    if (dividendHistory.length > 0) {
        // Sort chronologically just in case
        const sortedHistory = [...dividendHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Group by year for other stats (optional)
        sortedHistory.forEach(div => {
            const year = div.date.split('-')[0];
            yearly[year] = (yearly[year] || 0) + parseFloat(div.amount);
        });

        // Check for cuts
        let hasCut = false;
        let amounts = sortedHistory.map(d => parseFloat(d.amount));

        // Check strictly: if any dividend is lower than the previous one, it's a cut
        for (let i = 1; i < amounts.length; i++) {
            if (amounts[i] < amounts[i - 1]) {
                hasCut = true;
                break;
            }
        }

        const initialAmount = amounts[0];
        const finalAmount = amounts[amounts.length - 1];

        if (hasCut) {
            dividendStatus = 'cut';
        } else if (finalAmount > initialAmount) {
            dividendStatus = 'increased';
        } else if (Math.abs(finalAmount - initialAmount) < 0.0001) {
            dividendStatus = 'maintained';
        } else {
            // Should be covered by cut or maintained, but fallback
            dividendStatus = 'maintained';
        }
    }

    return {
        totalReturn,
        dividendStatus
    };
}

export { calculateRecessionReturns };
