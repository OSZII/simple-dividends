import { pgTable, integer, text, real, bigint, timestamp, pgEnum, date, decimal, index, jsonb } from 'drizzle-orm/pg-core';

// Enums
export const valuationStatusEnum = pgEnum('valuation_status', [
    'undervalued',
    'reasonably_valued',
    'overvalued',
    'speculative'
]);

export const paymentFrequencyEnum = pgEnum('payment_frequency', [
    'monthly',
    'quarterly',
    'semi_annual',
    'annual'
]);

export const dividendSafetyEnum = pgEnum('dividend_safety', [
    'very_unsafe',    // 1 - High risk of cut
    'unsafe',         // 2 - Elevated risk
    'borderline',     // 3 - Could go either way
    'safe',           // 4 - Low risk of cut
    'very_safe'       // 5 - Extremely unlikely to cut
]);

// Tables
export const sectors = pgTable('sectors', {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    name: text('name').notNull().unique()
});

export const countries = pgTable('countries', {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    name: text('name').notNull().unique()
});

export const currency = pgTable('currency', {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    name: text('name').notNull().unique()
});

// TODO: add this later
// export const industries = pgTable('industries', {
//     id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
//     name: text('name').notNull().unique(),
//     sectorId: integer('sector_id').references(() => sectors.id)
// });

export const stocks = pgTable('stocks', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    symbol: text('symbol').notNull().unique(),
    shortName: text('short_name'),
    longName: text('long_name'),

    // Relations
    sectorId: integer('sector_id').references(() => sectors.id),
    // industryId: integer('industry_id').references(() => industries.id),
    countryId: integer('country_id').references(() => countries.id),
    exchange: text('exchange'),

    // Currency
    currency: text('currency').default('USD'),

    // Company Info
    marketCap: bigint('market_cap', { mode: 'number' }),
    volume90d: bigint('volume90d', { mode: 'number' }), // 90-day avg daily $ volume
    volume: bigint('volume', { mode: 'number' }), // 90-day avg daily $ volume

    // === DIVIDEND DATA ===
    dividendRate: real('dividend_rate'),
    dividendYield: real('dividend_yield'),
    exDividendDate: bigint('ex_dividend_date', { mode: 'number' }), // epoch timestamp
    dividendDate: bigint('dividend_date', { mode: 'number' }), // payment date epoch
    payoutRatio: real('payout_ratio'),
    fiveYearAvgDividendYield: real('five_year_avg_dividend_yield'),
    trailingAnnualDividendRate: real('trailing_annual_dividend_rate'),
    trailingAnnualDividendYield: real('trailing_annual_dividend_yield'),

    // Dividend Growth & Streaks
    dividendGrowth1Year: real('dividend_growth_1_year'), // Latest dividend raise %
    dividendGrowth5Year: real('dividend_growth_5_year'),
    dividendGrowth10Year: real('dividend_growth_10_year'),
    dividendGrowthStreak: integer('dividend_growth_streak'), // years of consecutive growth
    uninterruptedDividendStreak: integer('uninterrupted_dividend_streak'), // years without cut
    latestDividendRaiseDate: bigint('latest_dividend_raise_date', { mode: 'number' }),

    // Payment Info
    paymentFrequency: paymentFrequencyEnum('payment_frequency'),
    paymentScheduleMonths: text('payment_schedule_months'), // e.g., "1,4,7,10" for Jan/Apr/Jul/Oct
    dividendSafety: dividendSafetyEnum('dividend_safety'),
    dividendSafetyScore: integer('dividend_safety_score'),
    // TODO: add this maybe later
    // dividendTaxation: text('dividend_taxation'), // e.g., "qualified", "ordinary", "REIT"

    // Yield Analysis
    yieldRelativeToHistory: real('yield_relative_to_history'), // current yield vs historical avg (ratio)

    // Recession Performance 2007 - 2009
    recessionDividendPerformance: text('recession_dividend_performance'), // "maintained", "cut", "increased"
    annualTotalDividends: jsonb('annual_total_dividends').$type<{ [year: string]: number }>(),
    // 5 steps compared to S&P 500 very good, good, average, poor, very poor
    recessionReturn: real('recession_return'), // performance during recession %

    // === VALUATION ===
    trailingPE: real('trailing_pe'),
    forwardPE: real('forward_pe'),
    priceToBook: real('price_to_book'),
    priceToSalesTrailing12Months: real('price_to_sales_trailing'),
    peRelativeToHistory: real('pe_relative_to_history'), // current PE vs historical avg (ratio)
    valuationStatus: valuationStatusEnum('valuation_status'),

    // === PRICE DATA ===
    price: real('price'),
    previousClose: real('previous_close'),
    fiftyTwoWeekHigh: real('fifty_two_week_high'),
    fiftyTwoWeekLow: real('fifty_two_week_low'),
    fiftyDayAverage: real('fifty_day_average'),
    twoHundredDayAverage: real('two_hundred_day_average'),
    beta: real('beta'),

    // === EARNINGS ===
    trailingEps: real('trailing_eps'),
    forwardEps: real('forward_eps'),
    earningsQuarterlyGrowth: real('earnings_quarterly_growth'),
    earningsGrowth: real('earnings_growth'),
    earningsTimestamp: bigint('earnings_timestamp', { mode: 'number' }),

    // === FINANCIAL HEALTH ===
    profitMargins: real('profit_margins'),
    grossMargins: real('gross_margins'),
    operatingMargins: real('operating_margins'),
    freeCashflow: bigint('free_cashflow', { mode: 'number' }),
    operatingCashflow: bigint('operating_cashflow', { mode: 'number' }),
    returnOnAssets: real('return_on_assets'),
    returnOnEquity: real('return_on_equity'),
    returnOnInvestedCapital: real('return_on_invested_capital'), // ROIC

    // Debt Metrics
    debtToEquity: real('debt_to_equity'),
    currentRatio: real('current_ratio'),
    quickRatio: real('quick_ratio'),
    netDebtToCapital: real('net_debt_to_capital'),
    netDebtToEbitda: real('net_debt_to_ebitda'),
    creditRating: text('credit_rating'), // e.g., "AAA", "BBB+", etc.

    // === ANALYST DATA ===
    recommendationKey: text('recommendation_key'), // "buy", "hold", "sell"
    recommendationMean: real('recommendation_mean'),
    targetMeanPrice: real('target_mean_price'),
    targetMedianPrice: real('target_median_price'),
    numberOfAnalystOpinions: integer('number_of_analyst_opinions'),

    // === METADATA ===
    lastUpdated: timestamp('last_updated').defaultNow()
}, (table) => ([
    index('stocks_dividend_yield_idx').on(table.dividendYield),
    index('stocks_price_idx').on(table.price),
    index('stocks_volume_idx').on(table.volume),
    index('stocks_market_cap_idx').on(table.marketCap),
    // index('stocks_sector_id_idx').on(table.sectorId),
    // index('stocks_country_id_idx').on(table.countryId),
    index('stocks_payout_ratio_idx').on(table.payoutRatio),
    index('stocks_dividend_growth_streak_idx').on(table.dividendGrowthStreak),
]));

// Not now
// // Dividend History - for tracking historical dividend payments
export const dividends = pgTable('dividends', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    symbol: text('symbol').references(() => stocks.symbol).notNull(),
    date: date('date', { mode: 'string' }).notNull(),
    // 11 digits total, 5 before decimal, 6 after max value 99,999.999999
    amount: decimal('amount', { precision: 11, scale: 6 }).notNull(),
    // use currency from stocks table, so no need to store it here
    // currency: text('currency').default('USD')
}, (table) => ([
    index('dividends_symbol_date_idx').on(table.symbol, table.date),
]));

export const splits = pgTable('splits', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    symbol: text('symbol').references(() => stocks.symbol).notNull(),
    date: date('date', { mode: 'string' }).notNull(),
    numerator: integer('numerator').notNull(),
    denominator: integer('denominator').notNull(),
}, (table) => ([
    index('splits_symbol_date_idx').on(table.symbol, table.date),
]));

export const stockHistory = pgTable('stock_history', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    symbol: text('symbol').references(() => stocks.symbol).notNull(),
    date: date('date', { mode: 'string' }).notNull(),
    // adjclose as close is the price of the stock adjusted for splits and dividends
    // 12 digits total, 8 before decimal, 4 after max value 99,999,999.9999
    price: decimal('price', { precision: 12, scale: 4 }).notNull(),
    volume: bigint('volume', { mode: 'number' }).notNull(),
}, (table) => ([
    index('stock_history_symbol_date_idx').on(table.symbol, table.date),
]));
