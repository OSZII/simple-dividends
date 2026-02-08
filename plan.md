# Stock Import Coverage Plan

> [!NOTE]
> This plan ensures all `stocks` table fields are populated from the appropriate Yahoo Finance API sources.

---

## Overview

### Import Scripts & Schedules

| Script | API | Schedule | Purpose |
|--------|-----|----------|---------|
| `importFromStockTickers.ts` | `yahooFinance.quote()` | Hourly | Real-time price data (batch of 200) |
| `importQuoteSummary.ts` | `yahooFinance.quoteSummary()` | Weekly | Fundamental/financial data |
| `calculateDividendMetrics.ts` | Database only | Weekly | Dividend calculations from `dividends` table |
| `calculateRecessionReturns.ts` | Database only | One-time | Recession performance 2007-2009 |

---

## Data Source Reference

### From `quote()` API (AAPL-quote.json)

Used in `importFromStockTickers.ts` (hourly):

| Field | API Property | Type |
|-------|--------------|------|
| `symbol` | `symbol` | string |
| `name` | `shortName` | string |
| `currency` | `currency` | string |
| `marketCap` | `marketCap` | number |
| `price` | `regularMarketPrice` | number |
| `previousClose` | `regularMarketPreviousClose` | number |
| `volume` | `regularMarketVolume` | number |
| `volume90d` | `averageDailyVolume3Month` | number |
| `fiftyTwoWeekHigh` | `fiftyTwoWeekHigh` | number |
| `fiftyTwoWeekLow` | `fiftyTwoWeekLow` | number |
| `dividendYield` | `dividendYield` | number |
| `dividendDate` | `dividendDate` | epoch |
| `trailingPE` | `trailingPE` | number |
| `priceToBook` | `priceToBook` | number |
| `trailingEps` | `epsTrailingTwelveMonths` | number |
| `forwardEps` | `epsForward` | number |
| `earningsTimestamp` | `earningsTimestamp` | epoch |
| `analystRating` | `averageAnalystRating` (parse "2.0 - Buy") | number |

---

### From `quoteSummary()` API (AAPL-quoteSummary.json)

Used in `importQuoteSummary.ts` (weekly):

#### Module: `assetProfile`
| Field | API Property |
|-------|--------------|
| `sectorId` | `sectorKey` (lookup/create in sectors table) |
| `countryId` | `country` (lookup/create in countries table) |

#### Module: `summaryDetail`
| Field | API Property |
|-------|--------------|
| `beta` | `beta` |
| `payoutRatio` | `payoutRatio` |
| `dividendYield5YearAverage` | `fiveYearAvgDividendYield` |
| `priceToSalesTrailing12Months` | `priceToSalesTrailing12Months` |
| `exDividendDate` | — (use calendarEvents instead) |

#### Module: `financialData`
| Field | API Property |
|-------|--------------|
| `freeCashflow` | `freeCashflow` |
| `ebitda` | `ebitda` |
| `totalCash` | `totalCash` |
| `totalDebt` | `totalDebt` |
| `debtToEquity` | `debtToEquity` |
| `recommendation` | `recommendationKey` |
| `numberOfAnalystOpinions` | `numberOfAnalystOpinions` |
| `profitMargins` | `profitMargins` |
| `grossMargins` | `grossMargins` |
| `operatingMargins` | `operatingMargins` |
| `earningsGrowth` | `earningsGrowth` |

#### Module: `defaultKeyStatistics`
| Field | API Property |
|-------|--------------|
| `earningsQuarterlyGrowth` | `earningsQuarterlyGrowth` |

#### Module: `calendarEvents`
| Field | API Property |
|-------|--------------|
| `exDividendDate` | `exDividendDate` |

#### Calculated Fields (in importQuoteSummary)
| Field | Formula |
|-------|---------|
| `netDebtToEbitda` | `(totalDebt - totalCash) / ebitda` |
| `netDebtToCapital` | `totalDebt / (totalDebt + totalEquity)` where `totalEquity = totalDebt / (debtToEquity / 100)` |
| `returnOnInvestedCapital` | See ROIC calculation below |

---

### ROIC Calculation

**Formula:**
```
ROIC = NOPAT / Invested Capital

Where:
- NOPAT = Operating Income × (1 - Tax Rate)
- Operating Income = totalRevenue × operatingMargins
- Tax Rate = 1 - (netIncomeToCommon / operatingIncome)  [effective tax rate]
- Invested Capital = totalEquity + totalDebt - totalCash
- totalEquity = totalDebt / (debtToEquity / 100)
```

**Available from financialData:**
- `totalRevenue`
- `operatingMargins`
- `totalDebt`
- `totalCash`
- `debtToEquity`

**Available from defaultKeyStatistics:**
- `netIncomeToCommon`

---

### From Database Calculations

Used in `calculateDividendMetrics.ts` (weekly, new script):

| Field | Calculation Method |
|-------|-------------------|
| `dividendGrowth1Year` | Compare last 1 year dividend total to prior year |
| `dividendGrowth5Year` | CAGR over 5 years |
| `dividendGrowth10Year` | CAGR over 10 years |
| `dividendGrowthStreak` | Count consecutive years of dividend increases |
| `uninterruptedDividendStreak` | Count years without a dividend cut |
| `latestDividendRaiseDate` | Date of most recent dividend increase |
| `paymentFrequency` | Infer from dividend payment pattern (monthly/quarterly/semi/annual) |
| `paymentScheduleMonths` | Extract payment months (e.g., "Jan, Apr, Jul, Oct") |
| `exDividendDateEstimatedOrConfirmed` | Set to false when confirmed from API, true if estimated |

---

### From Recession Calculations

Used in `calculateRecessionReturns.ts` (existing):

| Field | Status |
|-------|--------|
| `recessionDividendPerformance` | ✅ Already implemented |
| `recessionDividendPerformancePercentage` | ✅ Already implemented |
| `totalRecessionReturn` | ✅ Already implemented |

---

### Not Available from Yahoo Finance

| Field | Notes |
|-------|-------|
| `dividendSafetyScore` | Requires LLM evaluation script (separate project) |
| `creditRating` | Would need Moody's/S&P external API |
| `valuationMin`, `valuationMax` | Not available |
| `peRelativeToHistory` | Would need historical PE storage |

---

## Implementation Checklist

### Phase 1: Update util.ts (mapToStockInsert)

- [ ] Add `name` field mapping from `shortName`
- [ ] Fix `previousClose` to use `regularMarketPreviousClose`
- [ ] Parse `analystRating` from `averageAnalystRating` string (e.g., "2.0 - Buy" → 2.0)
- [ ] Remove `corporateActions` extraction (not needed, saves API quota)

#### Implementation:

```typescript
// In mapToStockInsert function, add:

// Map name from shortName
addIfValid('name', stockInfo.shortName);

// Previous close - correct field name
addIfValid('previousClose', stockInfo.regularMarketPreviousClose);

// Parse analyst rating from string like "2.0 - Buy"
if (stockInfo.averageAnalystRating) {
    const match = stockInfo.averageAnalystRating.match(/^([\d.]+)/);
    if (match) {
        addIfValid('analystRating', parseFloat(match[1]));
    }
}
```

---

### Phase 2: Update importQuoteSummary.ts

- [ ] Add modules: `defaultKeyStatistics`, `calendarEvents`
- [ ] Extract `dividendYield5YearAverage` from `summaryDetail.fiveYearAvgDividendYield`
- [ ] Extract `priceToSalesTrailing12Months` from `summaryDetail`
- [ ] Extract `profitMargins` from `financialData`
- [ ] Extract `grossMargins` from `financialData`
- [ ] Extract `operatingMargins` from `financialData`
- [ ] Extract `earningsGrowth` from `financialData`
- [ ] Calculate `returnOnInvestedCapital` using ROIC formula
- [ ] Extract `earningsQuarterlyGrowth` from `defaultKeyStatistics`
- [ ] Extract `exDividendDate` from `calendarEvents.exDividendDate`
- [ ] Update the `.set()` call to include all new fields

#### Implementation:

```typescript
// 1. Update modules list (line ~47):
quoteSummary = await yahooFinance.quoteSummary(stockData.symbol, {
    modules: ['assetProfile', 'summaryDetail', 'financialData', 'defaultKeyStatistics', 'calendarEvents']
});

// 2. Extract new fields (after existing extractions):

// From summaryDetail
let dividendYield5YearAverage = quoteSummary.summaryDetail?.fiveYearAvgDividendYield ?? null;
let priceToSalesTrailing12Months = quoteSummary.summaryDetail?.priceToSalesTrailing12Months ?? null;

// From financialData
let profitMargins = quoteSummary.financialData?.profitMargins ?? null;
let grossMargins = quoteSummary.financialData?.grossMargins ?? null;
let operatingMargins = quoteSummary.financialData?.operatingMargins ?? null;
let earningsGrowth = quoteSummary.financialData?.earningsGrowth ?? null;
let totalRevenue = quoteSummary.financialData?.totalRevenue ?? null;

// From defaultKeyStatistics
let earningsQuarterlyGrowth = quoteSummary.defaultKeyStatistics?.earningsQuarterlyGrowth ?? null;
let netIncomeToCommon = quoteSummary.defaultKeyStatistics?.netIncomeToCommon ?? null;

// From calendarEvents
let exDividendDateRaw = quoteSummary.calendarEvents?.exDividendDate ?? null;
let exDividendDate = exDividendDateRaw ? new Date(exDividendDateRaw).getTime() : null;

// 3. Calculate ROIC
let returnOnInvestedCapital: number | null = null;
if (totalRevenue && operatingMargins && totalDebt && debtToEquity && netIncomeToCommon) {
    // Calculate operating income
    const operatingIncome = totalRevenue * operatingMargins;
    
    // Calculate effective tax rate (guard against division by zero)
    let effectiveTaxRate = 0.21; // Default to 21% US corporate rate
    if (operatingIncome > 0) {
        effectiveTaxRate = 1 - (netIncomeToCommon / operatingIncome);
        // Clamp to reasonable range (0-50%)
        effectiveTaxRate = Math.max(0, Math.min(0.5, effectiveTaxRate));
    }
    
    // Calculate NOPAT
    const nopat = operatingIncome * (1 - effectiveTaxRate);
    
    // Calculate invested capital
    const totalEquityCalc = totalDebt / (debtToEquity / 100);
    const investedCapital = totalEquityCalc + totalDebt - (totalCash ?? 0);
    
    // Calculate ROIC (guard against division by zero)
    if (investedCapital > 0) {
        returnOnInvestedCapital = nopat / investedCapital;
    }
}

// 4. Update the .set() call:
await db.update(stocks)
    .set({
        sectorId,
        countryId,
        beta,
        freeCashflow,
        ebitda,
        totalCash,
        totalDebt,
        netDebtToEbitda,
        recommendation,
        numberOfAnalystOpinions,
        debtToEquity,
        netDebtToCapital,
        payoutRatio,
        // NEW FIELDS:
        dividendYield5YearAverage,
        priceToSalesTrailing12Months,
        profitMargins,
        grossMargins,
        operatingMargins,
        earningsGrowth,
        earningsQuarterlyGrowth,
        returnOnInvestedCapital,
        exDividendDate,
    })
    .where(eq(stocks.symbol, stockData.symbol));
```

---

### Phase 3: Create calculateDividendMetrics.ts (new weekly script)

- [ ] Create new file `src/lib/server/scripts/calculateDividendMetrics.ts`
- [ ] Query `dividends` table grouped by symbol
- [ ] Calculate annual dividend totals per symbol
- [ ] Implement `dividendGrowth1Year` calculation
- [ ] Implement `dividendGrowth5Year` CAGR calculation
- [ ] Implement `dividendGrowth10Year` CAGR calculation
- [ ] Implement `dividendGrowthStreak` counter
- [ ] Implement `uninterruptedDividendStreak` counter
- [ ] Find `latestDividendRaiseDate`
- [ ] Infer `paymentFrequency` from date patterns
- [ ] Extract `paymentScheduleMonths` from dates
- [ ] Update `stocks` table with calculated values
- [ ] Add to package.json scripts
- [ ] Add batch processing with delay (similar to other scripts)

#### Implementation:

```typescript
import { db } from '../db';
import { stocks, dividends } from '../db/schema';
import { eq, sql, desc } from 'drizzle-orm';

const log = (msg: string) => console.log(`[CALCULATE-DIVIDEND-METRICS] ${msg}`);

export async function calculateDividendMetrics() {
    log('Starting dividend metrics calculation...');

    // Get all symbols with dividends
    const symbolsWithDividends = await db
        .selectDistinct({ symbol: dividends.symbol })
        .from(dividends);

    log(`Found ${symbolsWithDividends.length} symbols with dividend history`);

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
            const currentYear = new Date().getFullYear();

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
                    dividendGrowth5Year = Math.pow(current / fiveYearsAgo, 1/5) - 1;
                }
            }

            if (years.length >= 11) {
                const current = annualTotals.get(years[0]) || 0;
                const tenYearsAgo = annualTotals.get(years[10]) || 0;
                if (tenYearsAgo > 0) {
                    dividendGrowth10Year = Math.pow(current / tenYearsAgo, 1/10) - 1;
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

        } catch (error) {
            log(`Error processing ${symbol}: ${error}`);
        }
    }

    log('Dividend metrics calculation complete');
}
```

#### Add to package.json:
```json
"db:calculate-dividend-metrics": "npx tsx src/lib/server/scripts/calculateDividendMetrics.ts"
```

---

### Phase 4: Testing & Verification

- [ ] Run `importFromStockTickers` and verify new fields populated
- [ ] Run `importQuoteSummary` and verify new fields populated
- [ ] Run `calculateDividendMetrics` and verify calculated fields
- [ ] Query database to confirm no null overwrites of existing data
- [ ] Verify rate limiting is respected (7s delay for quoteSummary)

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/lib/server/db/util.ts` | MODIFY | Add `name`, fix `previousClose`, parse `analystRating` |
| `src/lib/server/scripts/importQuoteSummary.ts` | MODIFY | Add modules, extract 10+ new fields, calculate ROIC |
| `src/lib/server/scripts/calculateDividendMetrics.ts` | NEW | Weekly dividend calculations |
| `package.json` | MODIFY | Add script for calculateDividendMetrics |

---

## Notes

- **Rate Limiting**: quoteSummary uses 7s delay between requests
- **No Null Overwrites**: `addIfValid` helper prevents null values from replacing existing data
- **ROIC Calculation**: Uses operating income, effective tax rate, and invested capital
- **exDividendDate**: Using `calendarEvents.exDividendDate` only (not corporateActions) to avoid extra API calls
