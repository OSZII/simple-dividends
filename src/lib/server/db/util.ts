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
    addIfValid('shortName', stockInfo.shortName);
    addIfValid('longName', stockInfo.longName);
    addIfValid('exchange', stockInfo.exchange);
    addIfValid('currency', stockInfo.currency);
    addIfValid('marketCap', stockInfo.marketCap);

    // Dividend Data
    addIfValid('dividendRate', stockInfo.dividendRate);
    addIfValid('dividendYield', stockInfo.dividendYield);
    if (stockInfo.exDividendDate) {
        addIfValid('exDividendDate', new Date(stockInfo.exDividendDate).getTime());
    }
    if (stockInfo.dividendDate) {
        addIfValid('dividendDate', new Date(stockInfo.dividendDate).getTime());
    }
    addIfValid('payoutRatio', stockInfo.payoutRatio);
    addIfValid('fiveYearAvgDividendYield', stockInfo.fiveYearAvgDividendYield);
    addIfValid('trailingAnnualDividendRate', stockInfo.trailingAnnualDividendRate);
    addIfValid('trailingAnnualDividendYield', stockInfo.trailingAnnualDividendYield);

    addIfValid('analystRating', stockInfo.averageAnalystRating);

    // Dividend Growth & Streaks
    addIfValid('dividendGrowth1Year', stockInfo.dividendGrowth1Year);
    addIfValid('dividendGrowth5Year', stockInfo.dividendGrowth5Year);
    addIfValid('dividendGrowth10Year', stockInfo.dividendGrowth10Year);
    addIfValid('dividendGrowthStreak', stockInfo.dividendGrowthStreak);
    addIfValid('uninterruptedDividendStreak', stockInfo.uninterruptedDividendStreak);
    addIfValid('latestDividendRaiseDate', stockInfo.latestDividendRaiseDate);

    // Yield Analysis
    addIfValid('yieldRelativeToHistory', stockInfo.yieldRelativeToHistory);

    // Valuation
    addIfValid('trailingPE', stockInfo.trailingPE);
    addIfValid('forwardPE', stockInfo.forwardPE);
    addIfValid('priceToBook', stockInfo.priceToBook);
    addIfValid('priceToSalesTrailing12Months', stockInfo.priceToSalesTrailing12Months);
    addIfValid('peRelativeToHistory', stockInfo.peRelativeToHistory);
    addIfValid('valuationStatus', stockInfo.valuationStatus);

    // Price Data
    const price = stockInfo.currentPrice ?? stockInfo.regularMarketPrice;
    addIfValid('price', price);
    addIfValid('previousClose', stockInfo.previousClose);
    addIfValid('fiftyTwoWeekHigh', stockInfo.fiftyTwoWeekHigh);
    addIfValid('fiftyTwoWeekLow', stockInfo.fiftyTwoWeekLow);
    addIfValid('fiftyDayAverage', stockInfo.fiftyDayAverage);
    addIfValid('twoHundredDayAverage', stockInfo.twoHundredDayAverage);

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
    addIfValid('operatingCashflow', stockInfo.operatingCashflow);
    addIfValid('returnOnAssets', stockInfo.returnOnAssets);
    addIfValid('returnOnEquity', stockInfo.returnOnEquity);
    addIfValid('returnOnInvestedCapital', stockInfo.returnOnInvestedCapital);

    // Debt Metrics
    addIfValid('debtToEquity', stockInfo.debtToEquity);
    addIfValid('currentRatio', stockInfo.currentRatio);
    addIfValid('quickRatio', stockInfo.quickRatio);
    addIfValid('netDebtToCapital', stockInfo.netDebtToCapital);
    addIfValid('netDebtToEbitda', stockInfo.netDebtToEbitda);
    addIfValid('creditRating', stockInfo.creditRating);

    // Analyst Data
    addIfValid('recommendationKey', stockInfo.recommendationKey);
    addIfValid('recommendationMean', stockInfo.recommendationMean);
    addIfValid('targetMeanPrice', stockInfo.targetMeanPrice);
    addIfValid('targetMedianPrice', stockInfo.targetMedianPrice);
    addIfValid('numberOfAnalystOpinions', stockInfo.numberOfAnalystOpinions);

    return object;
}