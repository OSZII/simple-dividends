import type { InferSelectModel } from 'drizzle-orm';
import type { stocks, sectors, countries } from '../src/lib/server/db/schema';

type Stock = InferSelectModel<typeof stocks>;
type Sector = InferSelectModel<typeof sectors>;
type Country = InferSelectModel<typeof countries>;

interface StockWithRelations extends Stock {
    sector?: Sector | null;
    country?: Country | null;
}

/**
 * Generates a prompt for an LLM to evaluate dividend safety score.
 * The LLM should return a score from 1-5:
 *   - 0-20: Very Unsafe (High risk of dividend cut, payout likely unsustainable)
 *   - 21-40: Unsafe (Elevated risk, concerning metrics)
 *   - 41-60: Borderline (Could go either way, mixed signals)
 *   - 61-80: Safe (Low risk of cut, healthy fundamentals)
 *   - 81-100: Very Safe (Extremely unlikely to cut, fortress balance sheet)
 */
export function generateDividendSafetyPrompt(stock: StockWithRelations): string {
    return JSON.stringify({
        system: getDividendSafetySystemPrompt(),
        user: getDividendSafetyUserPrompt(stock)
    });
}

/**
 * Formats stock data into a readable string for the LLM prompt
 */
function formatStockData(stock: StockWithRelations): string {
    const sections: string[] = [];

    // Company Overview
    sections.push(`## Company Overview
    - Symbol: ${stock.symbol}
    - Name: ${stock.longName || stock.shortName || 'N/A'}
    - Sector: ${stock.sector?.name || 'Unknown'}
    - Country: ${stock.country?.name || 'Unknown'}
    - Exchange: ${stock.exchange || 'N/A'}
    - Market Cap: ${formatLargeNumber(stock.marketCap)}
    - Employees: ${stock.fullTimeEmployees?.toLocaleString() || 'N/A'}`);

    // Dividend Data
    sections.push(`## Dividend Data
    - Current Dividend Rate: $${stock.dividendRate?.toFixed(2) || 'N/A'}
    - Current Dividend Yield: ${formatPercent(stock.dividendYield)}
    - 5-Year Avg Dividend Yield: ${formatPercent(stock.fiveYearAvgDividendYield)}
    - Trailing Annual Dividend Rate: $${stock.trailingAnnualDividendRate?.toFixed(2) || 'N/A'}
    - Trailing Annual Dividend Yield: ${formatPercent(stock.trailingAnnualDividendYield)}
    - Payout Ratio: ${formatPercent(stock.payoutRatio)}
    - Payment Frequency: ${stock.paymentFrequency || 'Unknown'}`);

    // Dividend History & Growth
    sections.push(`## Dividend History & Growth
    - Dividend Growth Streak: ${stock.dividendGrowthStreak !== null ? `${stock.dividendGrowthStreak} years` : 'N/A'}
    - Uninterrupted Dividend Streak: ${stock.uninterruptedDividendStreak !== null ? `${stock.uninterruptedDividendStreak} years` : 'N/A'}
    - 1-Year Dividend Growth: ${formatPercent(stock.dividendGrowth1Year)}
    - 5-Year Dividend Growth: ${formatPercent(stock.dividendGrowth5Year)}
    - 10-Year Dividend Growth: ${formatPercent(stock.dividendGrowth10Year)}
    - Yield vs Historical Avg: ${stock.yieldRelativeToHistory !== null ? `${(stock.yieldRelativeToHistory * 100).toFixed(1)}% of historical avg` : 'N/A'}`);

    // Earnings & Profitability
    sections.push(`## Earnings & Profitability
    - Trailing EPS: $${stock.trailingEps?.toFixed(2) || 'N/A'}
    - Forward EPS: $${stock.forwardEps?.toFixed(2) || 'N/A'}
    - Earnings Growth: ${formatPercent(stock.earningsGrowth)}
    - Quarterly Earnings Growth: ${formatPercent(stock.earningsQuarterlyGrowth)}
    - Profit Margins: ${formatPercent(stock.profitMargins)}
    - Gross Margins: ${formatPercent(stock.grossMargins)}
    - Operating Margins: ${formatPercent(stock.operatingMargins)}
    - Return on Equity: ${formatPercent(stock.returnOnEquity)}
    - Return on Assets: ${formatPercent(stock.returnOnAssets)}
    - ROIC: ${formatPercent(stock.returnOnInvestedCapital)}`);

    // Cash Flow
    sections.push(`## Cash Flow
    - Free Cash Flow: ${formatLargeNumber(stock.freeCashflow)}
    - Operating Cash Flow: ${formatLargeNumber(stock.operatingCashflow)}`);

    // Balance Sheet & Debt
    sections.push(`## Balance Sheet & Debt
    - Debt-to-Equity: ${stock.debtToEquity?.toFixed(2) || 'N/A'}
    - Current Ratio: ${stock.currentRatio?.toFixed(2) || 'N/A'}
    - Quick Ratio: ${stock.quickRatio?.toFixed(2) || 'N/A'}
    - Net Debt to Capital: ${formatPercent(stock.netDebtToCapital)}
    - Net Debt to EBITDA: ${stock.netDebtToEbitda?.toFixed(2) || 'N/A'}
    - Credit Rating: ${stock.creditRating || 'N/A'}`);

    // Valuation
    sections.push(`## Valuation
    - Trailing P/E: ${stock.trailingPE?.toFixed(2) || 'N/A'}
    - Forward P/E: ${stock.forwardPE?.toFixed(2) || 'N/A'}
    - Price/Book: ${stock.priceToBook?.toFixed(2) || 'N/A'}
    - Price/Sales: ${stock.priceToSalesTrailing12Months?.toFixed(2) || 'N/A'}
    - Valuation Status: ${stock.valuationStatus || 'N/A'}`);

    // Price & Volatility
    sections.push(`## Price & Volatility
    - Current Price: $${stock.currentPrice?.toFixed(2) || 'N/A'}
    - 52-Week High: $${stock.fiftyTwoWeekHigh?.toFixed(2) || 'N/A'}
    - 52-Week Low: $${stock.fiftyTwoWeekLow?.toFixed(2) || 'N/A'}
    - Beta: ${stock.beta?.toFixed(2) || 'N/A'}`);

    // Recession Performance
    if (stock.recessionDividendPerformance || stock.recessionReturn !== null) {
        sections.push(`## Recession Performance (2007-2009)
        - Dividend During Recession: ${stock.recessionDividendPerformance || 'N/A'}
        - Total Return During Recession: ${formatPercent(stock.recessionReturn)}`);
    }

    // Analyst Sentiment
    sections.push(`## Analyst Sentiment
    - Recommendation: ${stock.recommendationKey || 'N/A'}
    - Recommendation Score: ${stock.recommendationMean?.toFixed(2) || 'N/A'} (1=Strong Buy, 5=Strong Sell)
    - Target Price (Mean): $${stock.targetMeanPrice?.toFixed(2) || 'N/A'}
    - Target Price (Median): $${stock.targetMedianPrice?.toFixed(2) || 'N/A'}
    - Number of Analysts: ${stock.numberOfAnalystOpinions || 'N/A'}`);

    return sections.join('\n\n');
}

/**
 * Format large numbers with B/M/K suffixes
 */
function formatLargeNumber(value: number | null | undefined): string {
    if (value === null || value === undefined) return 'N/A';

    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';

    if (absValue >= 1e12) {
        return `${sign}$${(absValue / 1e12).toFixed(2)}T`;
    } else if (absValue >= 1e9) {
        return `${sign}$${(absValue / 1e9).toFixed(2)}B`;
    } else if (absValue >= 1e6) {
        return `${sign}$${(absValue / 1e6).toFixed(2)}M`;
    } else if (absValue >= 1e3) {
        return `${sign}$${(absValue / 1e3).toFixed(2)}K`;
    }
    return `${sign}$${absValue.toFixed(2)}`;
}

/**
 * Format decimal as percentage
 */
function formatPercent(value: number | null | undefined): string {
    if (value === null || value === undefined) return 'N/A';
    return `${(value * 100).toFixed(2)}%`;
}

/**
 * Alternative: Get just the user prompt portion (if system prompt is set separately)
 */
export function getDividendSafetyUserPrompt(stock: StockWithRelations): string {
    const stockData = formatStockData(stock);

    return `Analyze the following stock and provide a dividend safety score (0-100) with justification:

${stockData}

Respond in the following JSON format:
{
  "score": <number 0-100>,
  "rating": "<very_unsafe|unsafe|borderline|safe|very_safe>",
  "justification": "<brief explanation of your rating>",
  "keyRisks": ["<risk 1>", "<risk 2>"],
  "keyStrengths": ["<strength 1>", "<strength 2>"]
}`;
}

/**
 * Get the system prompt separately (useful for chat APIs)
 */
export function getDividendSafetySystemPrompt(): string {
    return `You are a financial analyst specializing in dividend stock analysis. Your task is to evaluate the safety of a company's dividend - specifically, how likely or unlikely it is for the dividend to be cut or suspended.

You will be provided with financial data about a stock. Analyze the data and provide:
1. A dividend safety score from 0-100:
   - 0-20: Very Unsafe (High risk of dividend cut, payout likely unsustainable)
   - 21-40: Unsafe (Elevated risk, concerning metrics)
   - 41-60: Borderline (Could go either way, mixed signals)
   - 61-80: Safe (Low risk of cut, healthy fundamentals)
   - 81-100: Very Safe (Extremely unlikely to cut, fortress balance sheet)

2. A brief justification for your score.

Key factors to consider:
- Payout Ratio: <60% is generally healthy, >80% is concerning, >100% means paying more than earnings
- Free Cash Flow: Must be positive and cover dividend payments
- Debt Levels: High debt-to-equity or net-debt-to-EBITDA increases risk
- Dividend History: Long growth/payment streaks indicate commitment
- Earnings Stability: Consistent earnings support consistent dividends
- Industry/Sector: Some sectors (utilities, REITs) typically have higher payout ratios
- Recession Performance: Past behavior during stress indicates future resilience`;
}
