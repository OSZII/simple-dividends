import { pgTable, integer, text, real, bigint, timestamp, pgEnum, date, decimal, index, jsonb, boolean } from 'drizzle-orm/pg-core';

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
    name: text('name'),

    // Relations
    sector: text('sector'),

    // Currency
    currency: text('currency').default('USD'),

    // Company Info required for display
    marketCap: bigint('market_cap', { mode: 'number' }),
    // da nachschauen welches ich wirklich brauche
    // volume is the current daily one and 90d is long term so then i can see if an event happens if the volume
    // is way higher than the 90d average
    volume90d: bigint('volume90d', { mode: 'number' }), // 90-day avg daily $ volume
    volume: bigint('volume', { mode: 'number' }), // 90-day avg daily $ volume

    // === DIVIDEND DATA ===
    dividendYield: real('dividend_yield'),
    // simply safe dividends has a graph with a line at the 5 year average and shows a dot at the current one
    dividendYield5YearAverage: real('dividend_yield_5_year_average'),
    exDividendDate: bigint('ex_dividend_date', { mode: 'number' }), // epoch timestamp contains either the date or an estimated one
    exDividendDateEstimatedOrConfirmed: boolean('ex_dividend_date_estimated_or_confirmed'), // true if estimated, we will do it based of historical data if available

    dividendDate: bigint('dividend_date', { mode: 'number' }), // payment date epoch
    payoutRatio: real('payout_ratio'),

    // Dividend Growth & Streaks
    dividendGrowth1Year: real('dividend_growth_1_year'), // Latest dividend raise %
    dividendGrowth5Year: real('dividend_growth_5_year'),
    dividendGrowth10Year: real('dividend_growth_10_year'),
    dividendGrowthStreak: integer('dividend_growth_streak'), // years of consecutive growth
    uninterruptedDividendStreak: integer('uninterrupted_dividend_streak'), // years without cut
    latestDividendRaiseDate: bigint('latest_dividend_raise_date', { mode: 'number' }), // when it was raised to show in dividend growth field

    // Payment Info
    paymentFrequency: paymentFrequencyEnum('payment_frequency'), // monthly, quarterly, semi_annual, annual
    paymentScheduleMonths: text('payment_schedule_months'), // e.g., Jan, Apr, Jul, Oct
    dividendSafetyScore: integer('dividend_safety_score'), // 0 - 100 and then frontend between very safe, safe, borderline, unsafe, very unsafe

    // Recession Performance 2007 - 2009
    recessionDividendPerformance: text('recession_dividend_performance'), // "maintained", "cut", "increased"
    recessionDividendPerformancePercentage: real('recession_dividend_performance_percentage'), // "maintained", "cut", "increased"
    // 5 steps compared to S&P 500 very good, good, average, poor, very poor, required for display
    totalRecessionReturn: real('total_recession_return'), // performance during recession %

    analystRating: real('analyst_rating'), // 1-5 averageAnalystRating maybe valuation???

    // === VALUATION ===
    peRatio: real('pe_ratio'),
    priceToBook: real('price_to_book'),
    peRelativeToHistory: real('pe_relative_to_history'), // current PE vs historical avg (ratio)
    priceToSalesTrailing12Months: real('price_to_sales_trailing'),
    // 'undervalued', 'reasonably_valued','overvalued', 'speculative'
    // in the table this shows min and max expected and a dot on a horizontal line where it is now left is below value right above
    // the current valuation is the price
    // i will not save the status in the database because I can query it if price < valiation_min is undervalued and so on...
    valuationMin: real('valuation_min'),
    valuationMax: real('valuation_max'),



    // === PRICE DATA ===
    price: real('price'),
    previousClose: real('previous_close'), // to calculate the change in percent
    fiftyTwoWeekHigh: real('fifty_two_week_high'),
    fiftyTwoWeekLow: real('fifty_two_week_low'),
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
    // required for display
    freeCashflow: bigint('free_cashflow', { mode: 'number' }),
    // required for display
    returnOnInvestedCapital: real('return_on_invested_capital'), // ROIC

    // Debt Metrics
    // required for debtToEquity and netDebtToEbita
    totalDebt: bigint('total_debt', { mode: 'number' }),
    totalCash: bigint('total_cash', { mode: 'number' }),
    // required to calculate totalEquity
    debtToEquity: real('debt_to_equity'),
    // calculated by totalDebt / totalCapital
    netDebtToCapital: real('net_debt_to_capital'),
    // calculated by totalDebt, totalCash and ebitda, required for display
    netDebtToEbitda: real('net_debt_to_ebitda'),
    ebitda: bigint('ebitda', { mode: 'number' }),

    creditRating: text('credit_rating'), // e.g., "AAA", "BBB+", etc.

    // === ANALYST DATA ===
    recommendation: text('recommendation'), // "buy", "hold", "sell"
    numberOfAnalystOpinions: integer('number_of_analyst_opinions'),

    // === METADATA ===
    lastUpdated: timestamp('last_updated').defaultNow()
}, (table) => ([
    index('stocks_name_idx').on(table.name),
    index('stocks_price_idx').on(table.price),
    index('stocks_sector_id_idx').on(table.sector),
    index('stocks_market_cap_idx').on(table.marketCap),
    index('stocks_beta_idx').on(table.beta),
    index('stocks_analyst_rating_idx').on(table.analystRating),
    index('stocks_dividend_yield_idx').on(table.dividendYield),
    index('stocks_pe_ratio_idx').on(table.peRatio),
    // 52-week-range
    index('stocks_fifty_two_week_high_idx').on(table.fiftyTwoWeekHigh),
    index('stocks_fifty_two_week_low_idx').on(table.fiftyTwoWeekLow),

    index('stocks_dividend_safety_score_idx').on(table.dividendSafetyScore),
    index('stocks_dividend_growth_1_year_idx').on(table.dividendGrowth1Year),
    index('stocks_dividend_growth_5_year_idx').on(table.dividendGrowth5Year),
    index('stocks_dividend_growth_10_year_idx').on(table.dividendGrowth10Year),
    index('stocks_dividend_growth_streak_idx').on(table.dividendGrowthStreak),
    index('stocks_uninterrupted_dividend_streak_idx').on(table.uninterruptedDividendStreak),
    index('stocks_ex_dividend_date_idx').on(table.exDividendDate),
    index('stocks_payment_frequency_idx').on(table.paymentFrequency),
    index('stocks_payment_schedule_months_idx').on(table.paymentScheduleMonths),
    index('stocks_credit_rating_idx').on(table.creditRating),
    index('stocks_payout_ratio_idx').on(table.payoutRatio),
    index('stocks_net_debt_to_capital_idx').on(table.netDebtToCapital),
    index('stocks_net_debt_to_ebitda_idx').on(table.netDebtToEbitda),
    index('stocks_free_cashflow_idx').on(table.freeCashflow),
    index('stocks_return_on_invested_capital_idx').on(table.returnOnInvestedCapital),
    index('stocks_recession_dividend_performance_idx').on(table.recessionDividendPerformance),
    index('stocks_total_recession_return_idx').on(table.totalRecessionReturn),
]));

// Not now
// // Dividend History - for tracking historical dividend payments
export const dividends = pgTable('dividends', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    symbol: text('symbol').references(() => stocks.symbol, { onDelete: 'cascade' }).notNull(),
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
    symbol: text('symbol').references(() => stocks.symbol, { onDelete: 'cascade' }).notNull(),
    date: date('date', { mode: 'string' }).notNull(),
    numerator: integer('numerator').notNull(),
    denominator: integer('denominator').notNull(),
}, (table) => ([
    index('splits_symbol_date_idx').on(table.symbol, table.date),
]));

export const stockHistory = pgTable('stock_history', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    symbol: text('symbol').references(() => stocks.symbol, { onDelete: 'cascade' }).notNull(),
    date: date('date', { mode: 'string' }).notNull(),
    // adjclose as close is the price of the stock adjusted for splits and dividends
    // 12 digits total, 8 before decimal, 4 after max value 99,999,999.9999
    price: decimal('price', { precision: 12, scale: 4 }).notNull(),
    volume: bigint('volume', { mode: 'number' }).notNull(),
}, (table) => ([
    index('stock_history_symbol_date_idx').on(table.symbol, table.date),
]));
