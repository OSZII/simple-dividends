import { db } from "$lib/server/db";
import { dividends as dividendsTable, stockHistory, stocks as stocksTable } from "$lib/server/db/schema";
import { query } from '$app/server';
import * as v from 'valibot';
import { and, asc, count, desc, eq, gte, inArray, isNotNull, sql } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { globalCache } from "./server/cache";

const sortableColumns = {
    name: stocksTable.name,
    price: stocksTable.price,
    sector: stocksTable.sector,
    symbol: stocksTable.symbol,
    marketCap: stocksTable.marketCap,
    beta: stocksTable.beta,
    dividendYield: stocksTable.dividendYield,
    peRatio: stocksTable.peRatio,
    fiftyTwoWeekRange: stocksTable.fiftyTwoWeekLow,
    dividendSafety: stocksTable.dividendSafetyScore,
    dividendGrowth1Year: stocksTable.dividendGrowth1Year,
    dividendGrowth5Year: stocksTable.dividendGrowth5Year,
    dividendGrowth10Year: stocksTable.dividendGrowth10Year,
    dividendGrowthStreak: stocksTable.dividendGrowthStreak,
    uninterruptedDividendStreak: stocksTable.uninterruptedDividendStreak,
    dividendDate: stocksTable.dividendDate,
    paymentFrequency: stocksTable.paymentFrequency,
    paymentScheduleMonths: stocksTable.paymentScheduleMonths,
    payoutRatio: stocksTable.payoutRatio,
    netDebtToCapital: stocksTable.netDebtToCapital,
    netDebtToEbitda: stocksTable.netDebtToEbitda,
    freeCashflow: stocksTable.freeCashflow,
    returnOnInvestedCapital: stocksTable.returnOnInvestedCapital,
    recessionDividendPerformance: stocksTable.recessionDividendPerformance,
    recessionReturn: stocksTable.totalRecessionReturn
};

export type SortableColumnKey = keyof typeof sortableColumns;

export type Stock = InferSelectModel<typeof stocksTable>;
export type Dividend = InferSelectModel<typeof dividendsTable>;
type StockHistory = { date: string, price: string, symbol: string };
type StockWithDividendsAndPriceHistory = Stock & { dividends: Dividend[], priceHistory: StockHistory[] };

export const getStocks = query(
    v.object({
        // Validate that 'column' is actually a valid key from the frontend
        column: v.nullable(v.picklist(Object.keys(stocksTable))),
        direction: v.nullable(v.picklist(["asc", "desc"])),
        limit: v.optional(v.number())
    }),
    async ({ column, direction, limit }) => {
        let start = performance.now();

        if (!limit) {
            limit = 10;
        }

        let cacheKey = `stocks:${column}-${direction}-${limit}`;


        // if (globalCache.has(cacheKey)) {
        //     let value = globalCache.get(cacheKey);
        //     console.log(`cache hit ${cacheKey}`, performance.now() - start);
        //     return value;
        // }

        // init data
        const effectiveColumn = column ?? 'name';
        const effectiveDirection = direction ?? 'asc';

        const orderFn = effectiveDirection === "asc" ? asc : desc;
        const sortColumn = sortableColumns[effectiveColumn as keyof typeof sortableColumns];

        // Stock query
        let stockQueryStart = performance.now();
        const queryBuilder = db
            .select()
            .from(stocksTable)
            .where(isNotNull(stocksTable.dividendYield))
            .limit(limit);

        // if sortColumn add to query
        if (sortColumn) {
            queryBuilder.orderBy(orderFn(sortColumn));
        }

        let stocks: StockWithDividendsAndPriceHistory[] = (await queryBuilder).map(stock => ({
            ...stock,
            dividends: [],
            priceHistory: []
        }));
        console.log(`stock query time ${cacheKey}`, performance.now() - stockQueryStart);

        let fiveYearsAgo = `${(new Date().getFullYear()) - 5}-01-01`;

        let stockSymbols = stocks.map((stock) => stock.symbol);

        let dividendQueryStart = performance.now();
        const dividendQueryBuilder = await db.select()
            .from(dividendsTable)
            .where(
                and(
                    inArray(dividendsTable.symbol, stockSymbols),
                    gte(dividendsTable.date, fiveYearsAgo)
                )
            );

        for (let i = 0; i < stocks.length; i++) {
            stocks[i].dividends = dividendQueryBuilder.filter((dividend) => dividend.symbol === stocks[i].symbol);
        }
        console.log(`dividend query time ${cacheKey}`, performance.now() - dividendQueryStart);

        let stockHistoryData = await db
            .selectDistinctOn([sql`date_trunc('month', ${stockHistory.date}::date)`], {
                id: stockHistory.id,
                symbol: stockHistory.symbol,
                date: stockHistory.date,
                price: stockHistory.price,
            })
            .from(stockHistory)
            .where(
                and(
                    inArray(stockHistory.symbol, stockSymbols),
                    gte(stockHistory.date, fiveYearsAgo)
                )
            )
            .orderBy(
                sql`date_trunc('month', ${stockHistory.date}::date)`,
                asc(stockHistory.date) // Use 'asc' for first day of month, 'desc' for last day
            );

        for (let i = 0; i < stocks.length; i++) {
            stocks[i].priceHistory = stockHistoryData.filter((stockHistory) => stockHistory.symbol === stocks[i].symbol);
            // console.log(stocks[i].symbol, stocks[i].priceHistory);

        }


        let countQueryStart = performance.now();
        let countQueryBuilder = db
            .select({ count: count() })
            .from(stocksTable)
            .where(isNotNull(stocksTable.dividendYield));

        let stockCount = (await countQueryBuilder)[0].count;
        console.log(`count query time ${cacheKey}`, performance.now() - countQueryStart);
        globalCache.set(cacheKey, { stocks, count: stockCount });


        console.log(`is not in cache total query time ${cacheKey}`, performance.now() - start);

        let sectors: string[] = [];
        if (globalCache.has("sectors")) {
            sectors = globalCache.get("sectors");
        }

        return { stocks, count: stockCount, sectors };
    }
);

export const getSectors = query(async () => {
    let sectors: string[] = [];

    if (globalCache.has("sectors")) {
        return globalCache.get("sectors");
    }

    let dbSectors = await db
        .selectDistinctOn([stocksTable.sector], { sector: stocksTable.sector })
        .from(stocksTable)
        .where(
            isNotNull(stocksTable.sector)
        );

    let withNullSectors = dbSectors.map((sector) => sector.sector);
    sectors = withNullSectors.filter((sector) => sector !== null);
    globalCache.set("sectors", sectors);

    return sectors;
});