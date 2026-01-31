import YahooFinance from "yahoo-finance2";
import fs from "fs";

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// Type definitions for screener module
type PredefinedScreenerModules =
    | "aggressive_small_caps"
    | "conservative_foreign_funds"
    | "day_gainers"
    | "day_losers"
    | "growth_technology_stocks"
    | "high_yield_bond"
    | "most_actives"
    | "most_shorted_stocks"
    | "portfolio_anchors"
    | "small_cap_gainers"
    | "solid_large_growth_funds"
    | "solid_midcap_growth_funds"
    | "top_mutual_funds"
    | "undervalued_growth_stocks"
    | "undervalued_large_caps";

interface ScreenerQuote {
    symbol: string;
    shortName: string;
    longName?: string;
    exchange: string;
    marketCap?: number;
    regularMarketPrice: number;
    regularMarketChangePercent: number;
    regularMarketVolume?: number;
    trailingPE?: number;
    trailingAnnualDividendYield?: number;
    trailingAnnualDividendRate?: number;
    dividendYield?: number;
    [key: string]: unknown;
}

// Filter criteria
const VALID_EXCHANGES = [
    'NYQ',   // NYSE
    'NMS',   // Nasdaq GS (Global Select)
    'NGM',   // Nasdaq GM (Global Market)  
    'NCM',   // Nasdaq CM (Capital Market)
    'ASE',   // NYSE American (formerly AMEX)
    'XET',   // Xetra (Germany)
];

// Region codes for: USA, Canada, Switzerland, Germany, France, Japan, Singapore, Australia
const REGIONS = [
    { region: 'US', lang: 'en-US' },
    { region: 'CA', lang: 'en-CA' },
    { region: 'CH', lang: 'de-CH' },
    { region: 'DE', lang: 'de-DE' },
    { region: 'FR', lang: 'fr-FR' },
    { region: 'JP', lang: 'ja-JP' },
    { region: 'SG', lang: 'en-SG' },
    { region: 'AU', lang: 'en-AU' },
];

const MIN_MARKET_CAP = 300_000_000; // $300M

// Screener IDs to use for fetching stocks
const SCREENER_IDS: PredefinedScreenerModules[] = [
    'most_actives',
    'day_gainers',
    'day_losers',
    'undervalued_large_caps',
    'growth_technology_stocks',
];

let result = await yahooFinance.quote("NDAQ");
fs.writeFileSync("./stocks3.json", JSON.stringify(result));
process.exit();

/**
 * Fetches stocks from Yahoo Finance screener based on defined criteria:
 * - Regions: USA, Canada, Switzerland, Germany, France, Japan, Singapore, Australia
 * - Market Cap > $300M
 * - Exchanges: NYSE, Nasdaq GS, NYSE American, Xetra, Nasdaq CM, Nasdaq GM
 */
export async function fetchFilteredStocks(): Promise<ScreenerQuote[]> {
    const allStocks = new Map<string, ScreenerQuote>();

    for (const regionConfig of REGIONS) {
        for (const scrId of SCREENER_IDS) {
            try {
                console.log(`Fetching ${scrId} for region ${regionConfig.region}...`);

                const result = await yahooFinance.screener({
                    scrIds: scrId,
                    count: 250, // Max per request
                    ...regionConfig,
                });

                if (!result.quotes) continue;

                // Filter by market cap and exchange
                const filteredQuotes = (result.quotes as unknown as ScreenerQuote[]).filter((quote) => {
                    const hasValidMarketCap = quote.marketCap && quote.marketCap > MIN_MARKET_CAP;
                    // const hasValidExchange = quote.exchange && VALID_EXCHANGES.includes(quote.exchange);
                    const hasValidDividendYield = quote.dividendYield && quote.dividendYield > 0;
                    return hasValidMarketCap && hasValidDividendYield;
                });

                // Add to map (dedupe by symbol)
                for (const quote of filteredQuotes) {
                    if (!allStocks.has(quote.symbol)) {
                        allStocks.set(quote.symbol, quote);
                    }
                }

                console.log(`  Found ${filteredQuotes.length} matching stocks`);

            } catch (error) {
                console.error(`Error fetching ${scrId} for ${regionConfig.region}:`, error);
            }
        }
    }

    const stocks = Array.from(allStocks.values());
    console.log(`\nTotal unique stocks matching criteria: ${stocks.length}`);

    return stocks;
}

/**
 * Checks if a stock matches the filter criteria
 */
export function matchesFilterCriteria(quote: ScreenerQuote): boolean {
    const hasValidMarketCap = quote.marketCap && quote.marketCap > MIN_MARKET_CAP;
    const hasValidExchange = quote.exchange && VALID_EXCHANGES.includes(quote.exchange);
    return Boolean(hasValidMarketCap && hasValidExchange);
}

// Export constants for use elsewhere
export { VALID_EXCHANGES, REGIONS, MIN_MARKET_CAP, SCREENER_IDS };
export type { ScreenerQuote, PredefinedScreenerModules };
let data = await fetchFilteredStocks();
console.log("test1");

fs.writeFileSync("./stocks.json", JSON.stringify(data));
console.log("test2");