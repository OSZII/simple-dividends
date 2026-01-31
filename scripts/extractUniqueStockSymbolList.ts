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

let uniqueStockSymbols: Set<string> = new Set();

async function processLineByLine() {
    const filesStream = fs.createReadStream(join(dataDir, "stocksymbollist.csv"));
    const readLineInterface = createInterface({
        input: filesStream,
        crlfDelay: Infinity
    });

    for await (const line of readLineInterface) {
        if (line.includes("###")) {
            continue;
        }

        if (line === "") {
            continue;
        }

        uniqueStockSymbols.add(line);
    }

    // convert to json array and write to uniqueStockSymbolList.json
    const uniqueStockSymbolList = Array.from(uniqueStockSymbols);
    fs.writeFileSync(join(dataDir, "uniqueStockSymbolList.json"), JSON.stringify(uniqueStockSymbolList, null, 2));
}

processLineByLine();

