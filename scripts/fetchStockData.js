// @ts-nocheck

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// Configure logging (console based to match python logging to stdout)
const logger = {
    info: (msg) => console.log(`${new Date().toISOString()} - INFO - ${msg}`),
    error: (msg) => console.error(`${new Date().toISOString()} - ERROR - ${msg}`),
    warning: (msg) => console.warn(`${new Date().toISOString()} - WARNING - ${msg}`),
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
// src/lib/scripts/fetchStockData.js -> src/lib/scripts -> src/lib -> src -> root

const projectRoot = path.resolve(__dirname, '../../..');
console.log("project root", projectRoot);
const symbolsFile = path.resolve(projectRoot, 'src/lib/data/metadata/datasimpleStockdata.json');
const outputBaseDir = path.resolve(projectRoot, 'src/lib/data/companyData');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchStockData() {
    // Ensure output directory exists
    try {
        await fs.mkdir(outputBaseDir, { recursive: true });
    } catch (e) {
        // ignore if exists
    }

    // Load symbols
    let stockMetadata;
    try {
        const data = await fs.readFile(symbolsFile, 'utf-8');
        stockMetadata = JSON.parse(data);
    } catch (e) {
        logger.error(`Failed to read symbols file: ${e}`);
        return;
    }

    const symbols = stockMetadata.map((item) => item.symbol).filter(Boolean);
    const totalSymbols = symbols.length;

    // Get existing folders
    let existingFolders = new Set();
    try {
        const dirs = await fs.readdir(outputBaseDir, { withFileTypes: true });
        for (const dirent of dirs) {
            if (dirent.isDirectory()) {
                existingFolders.add(dirent.name);
            }
        }
    } catch (e) {
        logger.info(`Could not verify existing folders (maybe first run): ${e.message}`);
    }

    logger.info(`Found ${existingFolders.size} already processed symbols.`);

    // Process symbols
    for (let i = 0; i < symbols.length; i++) {
        const symbol = symbols[i];
        const index = i + 1;

        if (existingFolders.has(symbol)) {
            logger.info(`[${index}/${totalSymbols}] Skipping ${symbol}: Folder already exists.`);
            continue;
        }

        logger.info(`[${index}/${totalSymbols}] Processing: ${symbol}`);
        const symbolDir = path.join(outputBaseDir, symbol);
        await fs.mkdir(symbolDir, { recursive: true });

        const startTime = Date.now();

        try {
            // 1. Fetch Info
            logger.info(`  Fetching info for ${symbol}...`);
            // We request a broad set of modules to mimic yfinance.info
            const queryOptions = {
                modules: [
                    'assetProfile',
                    'summaryProfile',
                    'summaryDetail',
                    'price',
                    'quoteType',
                    'defaultKeyStatistics',
                    'financialData',
                    'calendarEvents',
                    'earnings',
                    'upgradeDowngradeHistory',
                ],
            };

            let info = {};
            try {
                const quoteSummary = await yahooFinance.quoteSummary(symbol, queryOptions);
                // Flatten or keep structured? yfinance is flat-ish but structured.
                // We'll dump the full result to preserve data.
                info = quoteSummary;
            } catch (e) {
                logger.warning(`  Could not fetch info for ${symbol}: ${e.message}`);
                info = { error: 'Failed to fetch info' };
            }

            await fs.writeFile(
                path.join(symbolDir, 'info.json'),
                JSON.stringify(info, null, 2)
            );

            // 2. Fetch Calendar
            logger.info(`  Fetching calendar for ${symbol}...`);
            let calendarData = {};
            // In yahoo-finance2, calendarEvents is part of quoteSummary (fetched above). 
            // We can extract it or report it separately if we want to match the file structure.
            if (info.calendarEvents) {
                calendarData = info.calendarEvents;
            } else {
                calendarData = { error: "No calendar data available" };
                // Try to fetch separately if missed (though unlikely if modules included)
            }
            // Logic to match python "raw" fallback is less relevant here as objects are cleaner? 
            // But we'll just save what we found.
            await fs.writeFile(
                path.join(symbolDir, 'calendar.json'),
                JSON.stringify(calendarData, null, 2)
            );

            // 3. Fetch History (max)
            logger.info(`  Fetching history for ${symbol}...`);
            try {
                // 3. Fetch History (max) via Chart (more reliable for events)
                // Using chart instead of historical wrapper to access events (dividends/splits) directly
                const chartOptions = { period1: '1900-01-01', interval: '1d', events: 'div|split' };
                const chartResult = await yahooFinance.chart(symbol, chartOptions);

                if (chartResult && chartResult.timestamp) {
                    const result = chartResult; // The top level object from chart()
                    const { timestamp } = result;
                    const { quote } = result.indicators;
                    const { open, high, low, close, volume } = quote[0];

                    const priceMap = new Map();
                    const historyRows = [];

                    const formatDate = (dateObj) => {
                        return dateObj.toISOString().split('T')[0];
                    };

                    for (let i = 0; i < timestamp.length; i++) {
                        // timestamps are in seconds
                        const d = new Date(timestamp[i] * 1000);
                        const dateStr = formatDate(d);

                        const o = open[i];
                        const h = high[i];
                        const l = low[i];
                        const c = close[i];
                        const v = volume[i];

                        // Skip incomplete data
                        if (o === null || c === null) continue;

                        priceMap.set(dateStr, c);

                        historyRows.push({
                            Date: dateStr,
                            Open: (o || 0).toFixed(2),
                            High: (h || 0).toFixed(2),
                            Low: (l || 0).toFixed(2),
                            Close: (c || 0).toFixed(2),
                            Volume: v || 0
                        });
                    }

                    // --- Dividends ---
                    if (result.events && result.events.dividends) {
                        const validDividends = [];
                        // events.dividends is an object keyed by timestamp
                        const divsObj = result.events.dividends;
                        const sortedDivKeys = Object.keys(divsObj).sort((a, b) => parseInt(a) - parseInt(b));

                        for (const key of sortedDivKeys) {
                            const div = divsObj[key];
                            // div: { amount, date }
                            const d = new Date(div.date);
                            const dateStr = formatDate(d);
                            const closePrice = priceMap.get(dateStr);

                            // If close price not found on exact day, maybe try to find nearest? 
                            // Python script used exact match logic implied by dataframe filter. 
                            // We'll stick to exact match or successful lookup.
                            // However, dividends date in chart result might match the timestamp in history.

                            if (closePrice !== undefined) {
                                validDividends.push({
                                    Date: dateStr,
                                    Close: (closePrice).toFixed(2),
                                    Dividends: div.amount
                                });
                            }
                        }

                        if (validDividends.length > 0) {
                            const csvContent = [
                                'Date,Close,Dividends',
                                ...validDividends.map(r => `${r.Date},${r.Close},${r.Dividends}`)
                            ].join('\n');
                            await fs.writeFile(path.join(symbolDir, 'dividends.csv'), csvContent);
                            logger.info(`    Found ${validDividends.length} dividend entries.`);
                        }
                    }

                    // --- Stock Splits ---
                    if (result.events && result.events.splits) {
                        const validSplits = [];
                        const splitsObj = result.events.splits;
                        const sortedSplitKeys = Object.keys(splitsObj).sort((a, b) => parseInt(a) - parseInt(b));

                        for (const key of sortedSplitKeys) {
                            const split = splitsObj[key];
                            // split: { date, numerator, denominator, splitRatio }
                            const d = new Date(split.date);
                            const dateStr = formatDate(d);
                            const closePrice = priceMap.get(dateStr);

                            // Calculate split value (e.g. 2:1 -> 2.0)
                            let splitVal = 0;
                            if (split.numerator && split.denominator) {
                                splitVal = split.numerator / split.denominator;
                            } else if (typeof split.splitRatio === 'string') {
                                const parts = split.splitRatio.split(':');
                                if (parts.length === 2) {
                                    splitVal = parseFloat(parts[0]) / parseFloat(parts[1]);
                                }
                            }

                            if (splitVal > 0 && closePrice !== undefined) {
                                validSplits.push({
                                    Date: dateStr,
                                    Close: (closePrice).toFixed(2),
                                    'Stock Splits': splitVal
                                });
                            }
                        }

                        if (validSplits.length > 0) {
                            const csvContent = [
                                'Date,Close,Stock Splits',
                                ...validSplits.map(r => `${r.Date},${r.Close},${r['Stock Splits']}`)
                            ].join('\n');
                            await fs.writeFile(path.join(symbolDir, 'stock_splits.csv'), csvContent);
                            logger.info(`    Found ${validSplits.length} stock split entries.`);
                        }
                    }

                    // --- Save History ---
                    const historyHeader = 'Date,Open,High,Low,Close,Volume';
                    const historyCsvContent = [
                        historyHeader,
                        ...historyRows.map(r => `${r.Date},${r.Open},${r.High},${r.Low},${r.Close},${r.Volume}`)
                    ].join('\n');

                    await fs.writeFile(path.join(symbolDir, 'history.csv'), historyCsvContent);

                } else {
                    logger.warning(`  Empty history for ${symbol}`);
                }

            } catch (e) {
                logger.error(`  Failed to fetch history for ${symbol}: ${e.message}`);
                // console.error(e);
            }

        } catch (e) {
            logger.error(`  Unexpected error processing ${symbol}: ${e.message}`);
        }

        const elapsed = (Date.now() - startTime) / 1000;
        logger.info(`  Successfully processed ${symbol} in ${elapsed.toFixed(2)}s`);

        process.exit();
        // Sleep 5s to respect API rate limits
        await delay(5000);
    }
}

fetchStockData().catch(e => logger.error(`Main error: ${e.message}`));
