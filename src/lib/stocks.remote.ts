import { db } from "$lib/server/db";
import { dividends as dividendsTable, stocks as stocksTable } from "$lib/server/db/schema";
import { query } from '$app/server';
import * as v from 'valibot';
import { and, asc, count, desc, eq, gte, inArray, isNotNull } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { LRUCache } from 'lru-cache';

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

const options = {
    // Option A: Limit by number of items
    max: 500,

    // Option B: Limit by total memory size (e.g., 50MB)
    maxSize: 500 * 1024 * 1024,
    sizeCalculation: (value: any, key: any) => {
        // Estimate size in bytes
        return Buffer.byteLength(JSON.stringify(value) + key);
    },

    // How long to keep items (e.g., 5 minutes)
    ttl: 1000 * 60 * 60,
};

const cache = new LRUCache(options);

export type SortableColumnKey = keyof typeof sortableColumns;

export type Stock = InferSelectModel<typeof stocksTable>;
export type Dividend = InferSelectModel<typeof dividendsTable>;
type StockWithDividends = Stock & { dividends: Dividend[] };


// let countCache: { count: number, timestamp: number } | null = null;
// let defaultStockCache: { stocks: StockWithDividends[], count: number, timestamp: number } | null = null;

export const getStocks = query(
    v.object({
        // Validate that 'column' is actually a valid key from the frontend
        column: v.nullable(v.picklist(Object.keys(stocksTable))),
        direction: v.nullable(v.picklist(["asc", "desc"]))
    }),
    async ({ column, direction }) => {
        let start = performance.now();
        let cacheKey = `${column}-${direction}`;

        if (cache.has(cacheKey)) {
            let value = cache.get(cacheKey);
            console.log(`cache hit ${cacheKey}`, performance.now() - start);
            return value;
        }

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
            .limit(30);

        // if sortColumn add to query
        if (sortColumn) {
            queryBuilder.orderBy(orderFn(sortColumn));
        }

        let stocks: StockWithDividends[] = (await queryBuilder).map(stock => ({
            ...stock,
            dividends: []
        }));
        console.log(`stock query time ${cacheKey}`, performance.now() - stockQueryStart);


        let stockSymbols = stocks.map((stock) => stock.symbol);

        let dividendQueryStart = performance.now();
        const dividendQueryBuilder = await db.select()
            .from(dividendsTable)
            .where(
                and(
                    inArray(dividendsTable.symbol, stockSymbols),
                    gte(dividendsTable.date, `${(new Date().getFullYear()) - 5}-01-01`)
                )
            );

        for (let i = 0; i < stocks.length; i++) {
            stocks[i].dividends = dividendQueryBuilder.filter((dividend) => dividend.symbol === stocks[i].symbol);
        }
        console.log(`dividend query time ${cacheKey}`, performance.now() - dividendQueryStart);

        let countQueryStart = performance.now();
        let countQueryBuilder = db
            .select({ count: count() })
            .from(stocksTable)
            .where(isNotNull(stocksTable.dividendYield));

        let stockCount = (await countQueryBuilder)[0].count;
        console.log(`count query time ${cacheKey}`, performance.now() - countQueryStart);
        cache.set(cacheKey, { stocks, count: stockCount });


        console.log(`is not in cache total query time ${cacheKey}`, performance.now() - start);

        return { stocks, count: stockCount };
    }
);