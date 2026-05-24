import * as fs from 'fs';
import mongoose from 'mongoose';
import * as path from 'path';
import { connectDB, disconnectDB, getDB } from './db';
import { runExport } from './exportData';
import { runSeeding } from './seed';
import { runTransformation } from './transform';

async function importData(): Promise<void> {
    const filePath = path.join(process.cwd(), 'brands.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const docs: Record<string, unknown>[] = JSON.parse(raw);

    const normalised = docs.map(doc => {
        const idField = doc['_id'] as { $oid?: string } | string | undefined;
        const oid =
            typeof idField === 'object' && idField !== null && '$oid' in idField
                ? idField.$oid
                : idField;
        return { ...doc, _id: new mongoose.Types.ObjectId(oid as string) };
    });

    const db = getDB();

    const collection = db.collection('brands');
    await collection.deleteMany({});
    await collection.insertMany(normalised);

    console.log(`Imported ${normalised.length} raw documents.\n`);
}

async function main(): Promise<void> {


    await connectDB();

    console.log('Importing brands.json');
    await importData();

    console.log('Transforming documents in-place');
    await runTransformation();

    console.log('Seeding new documents');
    await runSeeding();

    console.log('Exporting brands collection');
    await runExport();

    await disconnectDB();
    console.log('Data pipeline completed successfully!');
}

main().catch(err => {
    console.error('Pipeline failed:', err);
    process.exit(1);
});
