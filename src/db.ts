import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://localhost:27017/data-transform';

export async function connectDB(): Promise<void> {
    await mongoose.connect(MONGO_URI);
    console.log(`Connected to MongoDB: ${MONGO_URI}`);
}

export async function disconnectDB(): Promise<void> {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
}

export function getDB() {
    // Access the raw database connection via the client
    const client = mongoose.connection.getClient();
    if (!client) {
        throw new Error('MongoDB client not available');
    }
    const db = client.db('data-transform');
    if (!db) {
        throw new Error('Failed to get database');
    }
    return db;
}
