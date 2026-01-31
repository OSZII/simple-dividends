import type { Handle } from '@sveltejs/kit';
import cron from 'node-cron';
import { importStocks } from './lib/server/scripts/importFromStockTickers';
import { importStockHistory } from '$lib/server/scripts/importHistoryFromStockTickers';
import { dev } from '$app/environment';

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

export const handle: Handle = async ({ event, resolve }) => {
    // get query param here
    const scriptParam = event.url.searchParams.get('script');
    if (scriptParam === 'import-stocks') {
        importStocks();
    }
    if (scriptParam === 'import-history') {
        importStockHistory();
    }
    const response = await resolve(event);
    return response;
};