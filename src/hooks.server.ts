import type { Handle } from '@sveltejs/kit';
import cron from 'node-cron';
import { importStocks } from './lib/server/scripts/importFromStockTickers';

// This runs once when the server starts
// once a hour update stocks i basically do this to get the most recent stock price
cron.schedule('0 * * * *', () => {
    console.log('Updating stocks...');
    importStocks();
});


export const handle: Handle = async ({ event, resolve }) => {
    const response = await resolve(event);
    return response;
};