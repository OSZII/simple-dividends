import type { stocks } from "./schema";

export function mapToStockInsert(stockInfo: any): typeof stocks.$inferInsert {
    // Start with only the required field
    let object: typeof stocks.$inferInsert = {
        symbol: stockInfo.symbol,
    };

    // Helper to conditionally add a field only if it has a valid value
    const addIfValid = (key: keyof typeof stocks.$inferInsert, value: any) => {
        if (value) {
            (object as any)[key] = value;
        }
    };

    // Basic Info
    addIfValid('name', stockInfo.shortName);
    addIfValid('currency', stockInfo.currency);
    addIfValid('marketCap', stockInfo.marketCap);

    // Dividend Data
    addIfValid('dividendYield', stockInfo.dividendYield);
    if (stockInfo.exDividendDate) {
        addIfValid('exDividendDate', new Date(stockInfo.exDividendDate).getTime());
    }
    if (stockInfo.dividendDate) {
        addIfValid('dividendDate', new Date(stockInfo.dividendDate).getTime());
    }
    addIfValid('payoutRatio', stockInfo.payoutRatio);

    // Parse analyst rating from string like "2.0 - Buy"
    if (stockInfo.averageAnalystRating) {
        const match = stockInfo.averageAnalystRating.match(/^([\d.]+)/);
        if (match) {
            addIfValid('analystRating', parseFloat(match[1]));
        }
    }

    // Dividend Growth & Streaks
    addIfValid('dividendGrowth1Year', stockInfo.dividendGrowth1Year);
    addIfValid('dividendGrowth5Year', stockInfo.dividendGrowth5Year);
    addIfValid('dividendGrowth10Year', stockInfo.dividendGrowth10Year);
    addIfValid('dividendGrowthStreak', stockInfo.dividendGrowthStreak);
    addIfValid('uninterruptedDividendStreak', stockInfo.uninterruptedDividendStreak);
    addIfValid('latestDividendRaiseDate', stockInfo.latestDividendRaiseDate);

    // Valuation
    addIfValid('priceToBook', stockInfo.priceToBook);
    addIfValid('priceToSalesTrailing12Months', stockInfo.priceToSalesTrailing12Months);
    addIfValid('peRelativeToHistory', stockInfo.peRelativeToHistory);

    // Price Data
    const price = stockInfo.currentPrice ?? stockInfo.regularMarketPrice;
    addIfValid('price', price);
    // Use regularMarketPreviousClose from quote API
    const previousClose = stockInfo.regularMarketPreviousClose ?? stockInfo.previousClose;
    addIfValid('previousClose', previousClose);
    addIfValid('fiftyTwoWeekHigh', stockInfo.fiftyTwoWeekHigh);
    addIfValid('fiftyTwoWeekLow', stockInfo.fiftyTwoWeekLow);

    // Volume
    addIfValid('volume90d', stockInfo.averageDailyVolume3Month);
    addIfValid('volume', stockInfo.regularMarketVolume);

    // Earnings
    const trailingEps = stockInfo.trailingEps ?? stockInfo.epsTrailingTwelveMonths;
    addIfValid('trailingEps', trailingEps);
    const forwardEps = stockInfo.forwardEps ?? stockInfo.epsForward;
    addIfValid('forwardEps', forwardEps);
    addIfValid('earningsQuarterlyGrowth', stockInfo.earningsQuarterlyGrowth);
    addIfValid('earningsGrowth', stockInfo.earningsGrowth);
    if (stockInfo.earningsTimestamp) {
        addIfValid('earningsTimestamp', new Date(stockInfo.earningsTimestamp).getTime());
    }

    // Financial Health
    addIfValid('profitMargins', stockInfo.profitMargins);
    addIfValid('grossMargins', stockInfo.grossMargins);
    addIfValid('operatingMargins', stockInfo.operatingMargins);
    addIfValid('freeCashflow', stockInfo.freeCashflow);
    addIfValid('returnOnInvestedCapital', stockInfo.returnOnInvestedCapital);

    // Debt Metrics
    addIfValid('debtToEquity', stockInfo.debtToEquity);
    addIfValid('netDebtToCapital', stockInfo.netDebtToCapital);
    addIfValid('netDebtToEbitda', stockInfo.netDebtToEbitda);
    addIfValid('creditRating', stockInfo.creditRating);

    // Analyst Data
    addIfValid('numberOfAnalystOpinions', stockInfo.numberOfAnalystOpinions);

    return object;
}