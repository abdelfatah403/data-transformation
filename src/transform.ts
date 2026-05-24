import mongoose from 'mongoose';
import { Brand } from './brands-schema';

const MIN_YEAR = 1600;
const MAX_YEAR = new Date().getFullYear();

function parseYear(value: unknown): number | null {
    if (value === null || value === undefined) return null;

    const num = typeof value === 'string' ? parseInt(value, 10) : Number(value);

    if (!Number.isFinite(num)) return null;
    if (num < MIN_YEAR || num > MAX_YEAR) return null;

    return num;
}

function parseLocations(value: unknown): number | null {
    if (value === null || value === undefined) return null;

    const num = typeof value === 'string' ? parseInt(value, 10) : Number(value);

    if (!Number.isFinite(num)) return null;
    if (num < 1) return null;

    return num;
}

function parseString(value: unknown): string | null {
    if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
    }
    return null;
}

interface TransformResult {
    _id: mongoose.Types.ObjectId;
    brandName: string;
    yearFounded: number;
    headquarters: string;
    numberOfLocations: number;
    issues: string[];
}

function transformDocument(doc: Record<string, any>): TransformResult {
    const issues: string[] = [];

    let brandName: string | null = parseString(doc.brandName);

    if (!brandName) {
        const nested = doc.brand;
        if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
            brandName = parseString(nested.name);
            if (brandName) {
                issues.push(`brandName resolved from brand.name: "${brandName}"`);
            }
        }
    }

    if (!brandName) {
        throw new Error(
            `Document ${doc._id}: brandName is required but could not be resolved. ` +
            `Raw value: ${JSON.stringify(doc.brandName)}, brand field: ${JSON.stringify(doc.brand)}`
        );
    }

    let yearFounded: number | null = parseYear(doc.yearFounded);

    if (yearFounded === null) {
        if (doc.yearFounded !== undefined) {
            issues.push(`yearFounded original value "${doc.yearFounded}" is invalid.`);
        }

        yearFounded = parseYear(doc.yearCreated);
        if (yearFounded !== null) {
            issues.push(`yearFounded resolved from yearCreated: ${yearFounded}`);
        }
    }

    if (yearFounded === null) {
        yearFounded = parseYear(doc.yearsFounded);
        if (yearFounded !== null) {
            issues.push(`yearFounded resolved from yearsFounded: ${yearFounded}`);
        }
    }

    if (yearFounded === null) {
        yearFounded = MIN_YEAR;
        issues.push(`yearFounded not available; defaulting to schema minimum: ${MIN_YEAR}`);
    }

    let headquarters: string | null = parseString(doc.headquarters);

    if (!headquarters) {
        headquarters = parseString(doc.hqAddress);
        if (headquarters) {
            issues.push(`headquarters resolved from hqAddress: "${headquarters}"`);
        }
    }

    if (!headquarters) {
        throw new Error(
            `Document ${doc._id}: headquarters is required but could not be resolved. ` +
            `Raw value: ${JSON.stringify(doc.headquarters)}, hqAddress: ${JSON.stringify(doc.hqAddress)}`
        );
    }

    let numberOfLocations: number | null = parseLocations(doc.numberOfLocations);

    if (numberOfLocations === null) {
        if (doc.numberOfLocations !== undefined) {
            issues.push(`numberOfLocations original value "${doc.numberOfLocations}" is invalid.`);
        }
        numberOfLocations = 1;
        issues.push(`numberOfLocations not available; defaulting to schema minimum: 1`);
    }

    return {
        _id: doc._id,
        brandName,
        yearFounded,
        headquarters,
        numberOfLocations,
        issues,
    };
}

export async function runTransformation(): Promise<void> {
    const db = mongoose.connection.db;
    if (!db) throw new Error('No DB connection');

    const collection = db.collection('brands');
    const rawDocs = await collection.find({}).toArray();

    console.log(`\nTransforming ${rawDocs.length} documents...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const rawDoc of rawDocs) {
        try {
            const transformed = transformDocument(rawDoc);

            if (transformed.issues.length > 0) {
                console.log(`[${transformed._id}] Issues fixed:`);
                transformed.issues.forEach(issue => console.log(`   • ${issue}`));
            }

            const updatePayload = {
                brandName: transformed.brandName,
                yearFounded: transformed.yearFounded,
                headquarters: transformed.headquarters,
                numberOfLocations: transformed.numberOfLocations,
            };

            const brandDoc = new Brand({ _id: transformed._id, ...updatePayload });
            await brandDoc.validate();

            await collection.replaceOne(
                { _id: transformed._id },
                { ...updatePayload, updatedAt: new Date() }
            );

            console.log(`[${transformed._id}] ✓ Transformed: "${transformed.brandName}"\n`);
            successCount++;
        } catch (err) {
            console.error(`[${rawDoc._id}] ✗ Error: ${(err as Error).message}\n`);
            errorCount++;
        }
    }

    console.log(`\nTransformation complete. Success: ${successCount}, Errors: ${errorCount}`);
}
