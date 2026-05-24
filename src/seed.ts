import { faker } from '@faker-js/faker';
import { Brand } from './brands-schema';

/**
 * Generates 10 seed brand documents, each covering a distinct test case.
 * All documents conform to the Brands schema.
 *
 * Cases documented in seed-cases.xlsx.
 */
function buildSeedDocuments() {
    const currentYear = new Date().getFullYear();

    return [
        {
            brandName: faker.company.name(),
            yearFounded: 1600,
            headquarters: faker.location.city(),
            numberOfLocations: faker.number.int({ min: 10, max: 500 }),
        },

        {
            brandName: faker.company.name(),
            yearFounded: currentYear,
            headquarters: faker.location.city(),
            numberOfLocations: 1,
        },

        {
            brandName: faker.company.name(),
            yearFounded: faker.number.int({ min: 1600, max: currentYear }),
            headquarters: faker.location.city(),
            numberOfLocations: 1,
        },

        {
            brandName: faker.company.name(),
            yearFounded: faker.number.int({ min: 1800, max: 1990 }),
            headquarters: faker.location.city(),
            numberOfLocations: faker.number.int({ min: 5000, max: 50000 }),
        },

        {
            brandName: faker.company.name(),
            yearFounded: faker.number.int({ min: 2000, max: currentYear }),
            headquarters: faker.location.city(),
            numberOfLocations: faker.number.int({ min: 1, max: 200 }),
        },

        {
            brandName: faker.company.name(),
            yearFounded: faker.number.int({ min: 1800, max: 1899 }),
            headquarters: faker.location.city(),
            numberOfLocations: faker.number.int({ min: 50, max: 3000 }),
        },

        {
            brandName: `${faker.company.name()}`.trim(),
            yearFounded: faker.number.int({ min: 1900, max: 1999 }),
            headquarters: faker.location.city(),
            numberOfLocations: faker.number.int({ min: 1, max: 1000 }),
        },

        {
            brandName: faker.company.name(),
            yearFounded: faker.number.int({ min: 1600, max: currentYear }),
            headquarters: `${faker.location.city()}, ${faker.location.country()}`,
            numberOfLocations: faker.number.int({ min: 1, max: 500 }),
        },

        {
            brandName: faker.company.name(),
            yearFounded: faker.number.int({ min: 1940, max: 1979 }),
            headquarters: faker.location.city(),
            numberOfLocations: faker.number.int({ min: 100, max: 5000 }),
        },

        {
            brandName: faker.company.name(),
            yearFounded: faker.number.int({ min: 1600, max: currentYear }),
            headquarters: faker.location.city(),
            numberOfLocations: 2,
        },
    ];
}

export async function runSeeding(): Promise<void> {
    const seedDocs = buildSeedDocuments();

    console.log(`\nSeeding ${seedDocs.length} new brand documents...\n`);

    let successCount = 0;

    for (const data of seedDocs) {
        const brand = new Brand(data);
        await brand.validate();
        await brand.save();
        console.log(
            `Inserted: ${brand.brandName} (Founded: ${brand.yearFounded}, Locations: ${brand.numberOfLocations})`
        );
        successCount++;
    }

    console.log(`\nSeeding complete. ${successCount} documents inserted.`);
}
