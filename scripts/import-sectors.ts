import { db } from './db';
import { sectors } from '../src/lib/server/db/schema';
import * as fs from 'fs';
import * as path from 'path';

async function importSectors() {
    console.log('Starting sectors import...');

    const companyDataPath = path.resolve(process.cwd(), 'data/companyData');
    console.log(companyDataPath);

    let files = fs.readdirSync(companyDataPath);
    console.log(files);

    let sectorData = new Set();

    files.forEach((file) => {
        if (file === ".DS_Store") {
            return;
        }

        let compandyInfoRaw = fs.readFileSync(`${companyDataPath}/${file}/info.json`) as unknown as string;
        let companyInfo = JSON.parse(compandyInfoRaw);

        if (!companyInfo.hasOwnProperty("sectorKey") || !companyInfo.hasOwnProperty("sectorDisp")) {
            console.log("no sector!!!!");
            // console.log(companyInfo["sectorKey"]);
            // console.log(companyInfo["sectorDisp"]);
            // console.log(companyInfo);
            // process.exit();

            return;
        }


        let data = {
            id: companyInfo["sectorKey"],
            name: companyInfo["sectorDisplay"],
        }

        sectorData.add(data);
    })


    try {
        await db.insert(sectors)
            .values(sectorData.)
            .onConflictDoNothing();
        console.log('Sectors import completed successfully!');
    } catch (error) {
        console.error('Error importing sectors:', error);
        process.exit(1);
    }

    process.exit(0);
}

importSectors();
