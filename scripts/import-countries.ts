import { db } from './db';
import { countries, sectors } from '../src/lib/server/db/schema';
import * as fs from 'fs';
import * as path from 'path';

async function importSectors() {
    console.log('Starting countries import...');

    const companyDataPath = path.resolve(process.cwd(), 'data/companyData');

    let files = fs.readdirSync(companyDataPath);

    let countryData = new Set<string>();

    files.forEach((file) => {
        if (file === ".DS_Store") {
            return;
        }

        let compandyInfoRaw = fs.readFileSync(`${companyDataPath}/${file}/info.json`) as unknown as string;
        let companyInfo = JSON.parse(compandyInfoRaw);

        if (!companyInfo.hasOwnProperty("country")) {
            return;
        }
        countryData.add(companyInfo["country"]);
    })

    try {
        await db.insert(countries)
            .values(Array.from(countryData).map((country) => ({
                name: country
            })))
            .onConflictDoNothing();
        console.log('Countries import completed successfully!');
    } catch (error) {
        console.error('Error importing sectors:', error);
        process.exit(1);
    }

    process.exit(0);
}

importSectors();
