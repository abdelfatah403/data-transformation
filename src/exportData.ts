import ExcelJS from 'exceljs';
import * as fs from 'fs';
import mongoose from 'mongoose';
import * as path from 'path';

export async function runExport(): Promise<void> {
    const db = mongoose.connection.db;
    if (!db) throw new Error('No DB connection');

    const collection = db.collection('brands');
    const docs = await collection.find({}).toArray();

    const exportsDir = path.resolve(__dirname, '../exports');
    if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
    }

    const jsonOutputPath = path.resolve(exportsDir, 'brands_exported.json');
    fs.writeFileSync(jsonOutputPath, JSON.stringify(docs, null, 2), 'utf-8');
    console.log(`Exported ${docs.length} documents to: ${jsonOutputPath}`);

    await exportToExcel(docs);
}

async function exportToExcel(docs: any[]): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Brands');

    worksheet.columns = [
        { header: 'ID', key: '_id', width: 25 },
        { header: 'Brand Name', key: 'brandName', width: 30 },
        { header: 'Year Founded', key: 'yearFounded', width: 15 },
        { header: 'Headquarters', key: 'headquarters', width: 25 },
        { header: 'Number of Locations', key: 'numberOfLocations', width: 20 },
        { header: 'Created At', key: 'createdAt', width: 20 },
        { header: 'Updated At', key: 'updatedAt', width: 20 },
    ];

    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    docs.forEach(doc => {
        worksheet.addRow({
            _id: doc._id.toString(),
            brandName: doc.brandName,
            yearFounded: doc.yearFounded,
            headquarters: doc.headquarters,
            numberOfLocations: doc.numberOfLocations,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        });
    });

    worksheet.getColumn('yearFounded').alignment = { horizontal: 'center' };
    worksheet.getColumn('numberOfLocations').alignment = { horizontal: 'center' };

    const exportsDir = path.resolve(__dirname, '../exports');
    if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
    }

    const outputPath = path.resolve(exportsDir, 'brands_exported.xlsx');
    await workbook.xlsx.writeFile(outputPath);
}
