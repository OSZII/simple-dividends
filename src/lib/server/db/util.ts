import type { stocks } from "./schema";

export function mapToStockInsert(stockInfo: any, sector: any = null, country: any = null): typeof stocks.$inferInsert {
    let object: typeof stocks.$inferInsert = {
        symbol: stockInfo.symbol,
        shortName: stockInfo.shortName ?? null,
        longName: stockInfo.longName ?? null,

        // Relations
        sectorId: sector,
        countryId: country,
        exchange: stockInfo.exchange ?? null,

        // Company Info
        fullTimeEmployees: stockInfo.fullTimeEmployees ?? null,
        marketCap: stockInfo.marketCap ?? null,

        // Dividend Data
        dividendRate: stockInfo.dividendRate ?? null,
        dividendYield: stockInfo.dividendYield ?? null,
        exDividendDate: stockInfo.exDividendDate ? new Date(stockInfo.exDividendDate).getTime() : null,
        dividendDate: stockInfo.dividendDate ? new Date(stockInfo.dividendDate).getTime() : null,
        payoutRatio: stockInfo.payoutRatio ?? null,
        fiveYearAvgDividendYield: stockInfo.fiveYearAvgDividendYield ?? null,
        trailingAnnualDividendRate: stockInfo.trailingAnnualDividendRate ?? null,
        trailingAnnualDividendYield: stockInfo.trailingAnnualDividendYield ?? null,

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
        trailingPE: stockInfo.trailingPE ?? null,
        forwardPE: stockInfo.forwardPE ?? null,
        priceToBook: stockInfo.priceToBook ?? null,
        priceToSalesTrailing12Months: stockInfo.priceToSalesTrailing12Months ?? null,
        peRelativeToHistory: null,
        valuationStatus: null,

        // Price Data
        currentPrice: stockInfo.currentPrice ?? stockInfo.regularMarketPrice ?? null,
        previousClose: stockInfo.previousClose ?? null,
        fiftyTwoWeekHigh: stockInfo.fiftyTwoWeekHigh ?? null,
        fiftyTwoWeekLow: stockInfo.fiftyTwoWeekLow ?? null,
        fiftyDayAverage: stockInfo.fiftyDayAverage ?? null,
        twoHundredDayAverage: stockInfo.twoHundredDayAverage ?? null,
        beta: stockInfo.beta ?? null,

        // Earnings
        trailingEps: stockInfo.trailingEps ?? stockInfo.epsTrailingTwelveMonths ?? null,
        forwardEps: stockInfo.forwardEps ?? stockInfo.epsForward ?? null,
        earningsQuarterlyGrowth: stockInfo.earningsQuarterlyGrowth ?? null,
        earningsGrowth: stockInfo.earningsGrowth ?? null,
        earningsTimestamp: stockInfo.earningsTimestamp ? new Date(stockInfo.earningsTimestamp).getTime() : null,

        // Financial Health
        profitMargins: stockInfo.profitMargins ?? null,
        grossMargins: stockInfo.grossMargins ?? null,
        operatingMargins: stockInfo.operatingMargins ?? null,
        freeCashflow: stockInfo.freeCashflow ?? null,
        operatingCashflow: stockInfo.operatingCashflow ?? null,
        returnOnAssets: stockInfo.returnOnAssets ?? null,
        returnOnEquity: stockInfo.returnOnEquity ?? null,
        returnOnInvestedCapital: null, // Not available in JSON

        // Debt Metrics
        debtToEquity: stockInfo.debtToEquity ?? null,
        currentRatio: stockInfo.currentRatio ?? null,
        quickRatio: stockInfo.quickRatio ?? null,
        netDebtToCapital: null, // Not available in JSON
        netDebtToEbitda: null, // Not available in JSON
        creditRating: null, // Not available in JSON

        // Analyst Data
        recommendationKey: stockInfo.recommendationKey ?? null,
        recommendationMean: stockInfo.recommendationMean ?? null,
        targetMeanPrice: stockInfo.targetMeanPrice ?? null,
        targetMedianPrice: stockInfo.targetMedianPrice ?? null,
        numberOfAnalystOpinions: stockInfo.numberOfAnalystOpinions ?? null
    };

    if (stockInfo.id) {
        (object as any).id = stockInfo.id;
    }

    return object;
}