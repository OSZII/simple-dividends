import { db } from '../db';
import { stocks, dividends } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

const log = (msg: string) => console.log(`[CALCULATE-DIVIDEND-METRICS] ${msg}`);
const logError = (msg: string, error?: unknown) => {
    console.error(`[CALCULATE-DIVIDEND-METRICS] ERROR: ${msg}`);
    if (error instanceof Error) {
        console.error(`[CALCULATE-DIVIDEND-METRICS] ${error.message}`);
    }
};

export async function calculateDividendMetrics() {
    log('Starting dividend metrics calculation...');

    try {
        // Get all symbols with dividends
        const symbolsWithDividends = await db
            .selectDistinct({ symbol: dividends.symbol })
            .from(dividends);

        log(`Found ${symbolsWithDividends.length} symbols with dividend history`);

        let successCount = 0;
        let failCount = 0;

        for (const { symbol } of symbolsWithDividends) {
            try {
                // Get all dividends for this symbol, ordered by date
                const divs = await db
                    .select({ date: dividends.date, amount: dividends.amount })
                    .from(dividends)
                    .where(eq(dividends.symbol, symbol))
                    .orderBy(desc(dividends.date));

                if (divs.length === 0) continue;

                // Group by year and calculate annual totals
                const annualTotals = new Map<number, number>();
                const paymentMonths = new Set<number>();

                for (const div of divs) {
                    const date = new Date(div.date);
                    const year = date.getFullYear();
                    const month = date.getMonth();

                    annualTotals.set(year, (annualTotals.get(year) || 0) + parseFloat(div.amount));
                    paymentMonths.add(month);
                }

                const years = Array.from(annualTotals.keys()).sort((a, b) => b - a);

                // Calculate dividend growth rates
                let dividendGrowth1Year: number | null = null;
                let dividendGrowth5Year: number | null = null;
                let dividendGrowth10Year: number | null = null;

                if (years.length >= 2) {
                    const current = annualTotals.get(years[0]) || 0;
                    const prev = annualTotals.get(years[1]) || 0;
                    if (prev > 0) {
                        dividendGrowth1Year = (current - prev) / prev;
                    }
                }

                if (years.length >= 6) {
                    const current = annualTotals.get(years[0]) || 0;
                    const fiveYearsAgo = annualTotals.get(years[5]) || 0;
                    if (fiveYearsAgo > 0) {
                        dividendGrowth5Year = Math.pow(current / fiveYearsAgo, 1 / 5) - 1;
                    }
                }

                if (years.length >= 11) {
                    const current = annualTotals.get(years[0]) || 0;
                    const tenYearsAgo = annualTotals.get(years[10]) || 0;
                    if (tenYearsAgo > 0) {
                        dividendGrowth10Year = Math.pow(current / tenYearsAgo, 1 / 10) - 1;
                    }
                }

                // Calculate dividend streaks
                let dividendGrowthStreak = 0;
                let uninterruptedDividendStreak = 0;
                let latestDividendRaiseDate: number | null = null;

                for (let i = 0; i < years.length - 1; i++) {
                    const thisYear = annualTotals.get(years[i]) || 0;
                    const lastYear = annualTotals.get(years[i + 1]) || 0;

                    if (thisYear > lastYear) {
                        if (dividendGrowthStreak === i) {
                            dividendGrowthStreak++;
                            if (i === 0) {
                                // Find the first dividend of the current year for raise date
                                const firstDivThisYear = divs.find(d =>
                                    new Date(d.date).getFullYear() === years[0]
                                );
                                if (firstDivThisYear) {
                                    latestDividendRaiseDate = new Date(firstDivThisYear.date).getTime();
                                }
                            }
                        }
                    }

                    if (thisYear >= lastYear * 0.99) { // Allow 1% tolerance for rounding
                        if (uninterruptedDividendStreak === i) {
                            uninterruptedDividendStreak++;
                        }
                    } else {
                        break; // Streak broken
                    }
                }

                // Infer payment frequency
                const monthsArray = Array.from(paymentMonths);
                let paymentFrequency: 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | null = null;

                if (monthsArray.length >= 10) paymentFrequency = 'monthly';
                else if (monthsArray.length >= 3) paymentFrequency = 'quarterly';
                else if (monthsArray.length >= 2) paymentFrequency = 'semi_annual';
                else if (monthsArray.length >= 1) paymentFrequency = 'annual';

                // Extract payment schedule months
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const paymentScheduleMonths = monthsArray
                    .sort((a, b) => a - b)
                    .map(m => monthNames[m])
                    .join(', ');

                // Update the stocks table
                await db.update(stocks)
                    .set({
                        dividendGrowth1Year,
                        dividendGrowth5Year,
                        dividendGrowth10Year,
                        dividendGrowthStreak,
                        uninterruptedDividendStreak,
                        latestDividendRaiseDate,
                        paymentFrequency,
                        paymentScheduleMonths,
                    })
                    .where(eq(stocks.symbol, symbol));

                log(`Updated ${symbol}: streak=${dividendGrowthStreak}, growth1y=${dividendGrowth1Year?.toFixed(2)}`);
                successCount++;

            } catch (error) {
                logError(`Error processing ${symbol}`, error);
                failCount++;
            }
        }

        log(`Dividend metrics calculation complete: ${successCount} succeeded, ${failCount} failed`);

    } catch (error) {
        logError('Fatal error during calculation', error);
        throw error;
    }
}
