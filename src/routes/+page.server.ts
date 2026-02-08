
import { getStocks } from '$lib/stocks.remote';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
    let data = await getStocks({ column: 'name', direction: 'asc' });

    return {
        stocks: data.stocks,
        count: data.count
    };
};