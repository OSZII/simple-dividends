
import { db } from '$lib/server/db';
import { stocks as stocksTable, sectors as sectorsTable, countries as countriesTable } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';
import { isNotNull } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
    let stocks = await db.select().from(stocksTable)
        .where(isNotNull(stocksTable.dividendYield))
        .limit(30);
    let sectors = await db.select().from(sectorsTable);
    let countries = await db.select().from(countriesTable);
    console.log(stocks);

    return {
        stocks,
        sectors,
        countries
    };
};