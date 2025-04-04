
require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;

// MongoDB connection URL with authentication options
let url = `${process.env.MONGO_URL}`;
const dbName = `${process.env.MONGO_DB}`;

let dbInstance = null;

async function connectToDatabase() {
    if (dbInstance) {
        return dbInstance
    };

    // Connect to MongoDB
    try {
        const client = new MongoClient(url);
        await client.connect();
        console.log('Connected to MongoDB successfully!');

        dbInstance = client.db(dbName);
        console.log('Connected to database:', dbInstance.databaseName);

        return dbInstance;

    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

module.exports = connectToDatabase;
