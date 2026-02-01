import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { join } from 'path';
import fs from 'fs';
import { createInterface } from 'readline';

// This gives you the full path to the current file
const __filename = fileURLToPath(import.meta.url);

// This gives you the directory path
const __dirname = dirname(__filename);

const dataDir = join(__dirname, '..', "data", "metadata");

import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

let symbol = "AAPL";

let data = await yahooFinance.chart(symbol, { period1: '1900-01-01', period2: '2026-01-01' });
fs.writeFileSync(join(dataDir, `${symbol}.json`), JSON.stringify(data, null, 2));

let quote = await yahooFinance.quote(symbol);
console.log(quote);