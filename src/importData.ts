import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { connectDB, disconnectDB } from './db';

async function importData(): Promise<void> {
    await connectDB();

    const filePath = path.resolve(__dirname, '../../brands.json');
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

    const db = mongoose.connection.db;
    if (!db) throw new Error('No DB connection');

    const collection = db.collection('brands');

    await collection.deleteMany({});
    await collection.insertMany(normalised);

    await disconnectDB();
}

importData().catch(err => {
    console.error('Import failed:', err);
    process.exit(1);
});
