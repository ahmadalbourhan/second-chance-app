// db.js
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

    
    // Task 1 : Connect to MongoDB
    
    try {
        const client = new MongoClient(url);
        await client.connect();
        console.log('Connected to MongoDB successfully!');

        // Task 2: Connect to database giftDB and store in variable dbInstance
        dbInstance = client.db(dbName);
        console.log('Connected to database:', dbInstance.databaseName);

        // Task 3: Return database instance
        return dbInstance;

    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error; // Re-throw the error for better error handling
    }
}

module.exports = connectToDatabase;
