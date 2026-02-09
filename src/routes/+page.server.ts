
import { getSectors, getStocks } from '$lib/stocks.remote';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
    let data = await getStocks({ column: 'name', direction: 'asc' });
    let sectors = await getSectors();

    return {
        stocks: data.stocks,
        count: data.count,
        sectors
    };
};