
import { getSectors, getStocks } from '$lib/stocks.remote';
import { CookieManager } from '$lib/CookieManager';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, cookies }) => {
    const cookieManager = new CookieManager(cookies);
    const columnPreferences = cookieManager.get<{ prefs: { key: string; enabled: boolean }[]; savedAt: number }>('column-preferences');

    let data = await getStocks({ column: 'name', direction: 'asc', limit: locals.limit });
    let sectors = await getSectors();

    return {
        stocks: data.stocks,
        count: data.count,
        sectors,
        pageSize: locals.limit,
        columnPreferences
    };
};