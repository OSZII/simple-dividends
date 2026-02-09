import type { Handle } from '@sveltejs/kit';
import cron from 'node-cron';
import { importStocks } from './lib/server/scripts/importFromStockTickers';
import { importStockHistory } from '$lib/server/scripts/importHistoryFromStockTickers';
import { dev } from '$app/environment';
import { calculateRecessionReturns } from '$lib/server/scripts/calculateRecessionReturns';
import { importQuoteSummary } from '$lib/server/scripts/importQuoteSummary';
import type { ServerInit } from '@sveltejs/kit';
import { calculateDividendMetrics } from '$lib/server/scripts/calculateDividendMetrics';
import { stockHistory, stocks } from '$lib/server/db/schema';
import { and, asc, eq, getTableColumns, gte, inArray, isNotNull, sql } from 'drizzle-orm';
import { globalCache } from '$lib/server/cache';
import { db } from '$lib/server/db';

cron.schedule('0 * * * 1-5', () => {
    if (dev) {
        return;
    }
    importStocks();
});

// every sunday at 00:30 update stock history
cron.schedule('30 0 * * 7', () => {
    if (dev) {
        return;
    }
    importStockHistory();
});

// every sunday at 01:00 calculate recession returns
cron.schedule('0 1 * * 7', () => {
    if (dev) {
        return;
    }
    calculateRecessionReturns();
});

cron.schedule('0 1 * * 6', () => {
    if (dev) {
        return;
    }
    importQuoteSummary();
});

// weekly sunday
cron.schedule('0 0 * * 0', () => {
    if (dev) {
        return;
    }
    calculateDividendMetrics();
});

export const handle: Handle = async ({ event, resolve }) => {

    let fiveYearsAgo = `${(new Date().getFullYear()) - 5}-01-01`;
    let stockSymbols = ["AAPL", "MSFT"];
    let start = performance.now();
    let stockHistoryData = db
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

    let { sql: stockHistorySQL, params: stockHistoryParams } = stockHistoryData.toSQL();
    // console.log("sql", stockHistorySQL);
    // console.log(stockHistoryParams);
    // console.log(stockHistoryData.());


    console.log("stockhistory hooks", await stockHistoryData);
    console.log(performance.now() - start);

    // get query param here
    const scriptParam = event.url.searchParams.get('script');
    if (scriptParam === 'import-stocks') {
        importStocks();
    }
    if (scriptParam === 'import-history') {
        importStockHistory();
    }
    if (scriptParam === 'calculate-recession-returns') {
        calculateRecessionReturns();
    }
    if (scriptParam === 'import-quote-summary') {
        importQuoteSummary();
    }
    if (scriptParam === 'calculate-dividend-metrics') {
        calculateDividendMetrics();
    }

    const response = await resolve(event);
    return response;
};