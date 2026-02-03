import type { Handle } from '@sveltejs/kit';
import cron from 'node-cron';
import { importStocks } from './lib/server/scripts/importFromStockTickers';
import { importStockHistory } from '$lib/server/scripts/importHistoryFromStockTickers';
import { dev } from '$app/environment';
import { calculateRecessionReturns } from '$lib/server/scripts/calculateRecessionReturns';
import { importQuoteSummary } from '$lib/server/scripts/importQuoteSummary';

// This runs once when the server starts
// once a hour update stocks i basically do this to get the most recent stock price
cron.schedule('0 * * * *', () => {
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


export const handle: Handle = async ({ event, resolve }) => {
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
    const response = await resolve(event);
    return response;
};