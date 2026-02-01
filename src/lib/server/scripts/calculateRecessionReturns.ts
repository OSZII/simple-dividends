import { db } from '../db';
import { stocks, sectors, countries } from '../db/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { join } from 'path';
import { mapToStockInsert } from '../db/util';
import { isNull } from 'drizzle-orm';


async function calculateRecessionReturns(silent: boolean = false) {
    console.log('[CALCULATE-RECESSION-RETURNS] Starting recession returns calculation...');

    // Logic is simple fetch all symbols from DB
    // For each symbol fetch stock data history from 2007 to 2009
    // Also fetch the dividend history for the same period
    // Calculate the total returns for the period
    // also keep dividend performance serperate because theres total performance and dividend performance
    // Store results in DB

}

export { calculateRecessionReturns };
