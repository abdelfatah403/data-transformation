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
    console.log('='.repeat(60));
    console.log('  Brands Data Pipeline');
    console.log('='.repeat(60));

    await connectDB();

    // Step 1 — Import raw JSON
    console.log('\n[Step 1] Importing brands.json...');
    await importData();

    // Step 2 — Transform in-place
    console.log('[Step 2] Transforming documents in-place...');
    await runTransformation();

    // Step 3 — Seed 10 new documents
    console.log('[Step 3] Seeding new documents...');
    await runSeeding();

    // Step 4 — Export the full collection
    console.log('[Step 4] Exporting brands collection...');
    await runExport();

    await disconnectDB();

    console.log('\n' + '='.repeat(60));
    console.log('  Pipeline complete.');
    console.log('='.repeat(60));
}

main().catch(err => {
    console.error('Pipeline failed:', err);
    process.exit(1);
});
