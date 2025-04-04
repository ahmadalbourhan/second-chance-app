const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const connectToDatabase = require('../models/db');
const logger = require('../logger');

// Define the upload directory path
const directoryPath = 'public/images';

// Set up storage for uploaded files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, directoryPath); // Specify the upload directory
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Use the original file name
    },
});

const upload = multer({ storage: storage });


// Get all secondChanceItems
router.get('/', async (req, res, next) => {
    logger.info('/ called');
    try {
        const db = await connectToDatabase()
        const collection = db.collection("secondChanceItems");
        const secondChanceItems = await collection.find({}).toArray();
        res.json(secondChanceItems);

    } catch (e) {
        logger.console.error('oops something went wrong', e)
        next(e);
    }
});

// Add a new item
// Upload the image to the images directory
router.post('/', upload.single('file'), async (req, res, next) => {
    try {

        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");

        let secondChanceItem = req.body;

        const lastItemQuery = await collection.find().sort({ 'id': -1 }).limit(1);

        await lastItemQuery.forEach(item => {
            secondChanceItem.id = (parseInt(item.id) + 1).toString();
        });

        const date_added = Math.floor(new Date().getTime() / 1000);
        secondChanceItem.date_added = date_added

        //Handle image (if the file is not provided, assign a default image or leave it undefined)
        if (req.file) {
            secondChanceItem.image = `/images/${req.file.filename}`;
        } else {
            secondChanceItem.image = "/images/default.jpg"; // Default image
        }

        secondChanceItem = await collection.insertOne(secondChanceItem)

        // res.status(201).json(secondChanceItem.ops[0]);
        res.status(201).json(secondChanceItem);
    } catch (e) {
        next(e);
    }
});

// Get a single secondChanceItem by ID
router.get('/:id', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");

        const secondChanceItem = await collection.findOne({ "id": req.params.id });

        if (!secondChanceItem) {
            return res.status(404).send("secondChanceItem not found");
        }

        res.json(secondChanceItem);
    } catch (e) {
        next(e);
    }
});


// Update an existing item
router.put('/:id', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");

        const secondChanceItem = await collection.findOne({ "id": req.params.id });
        if (!secondChanceItem) {
            logger.error('secondChanceItem not found');
            return res.status(404).json({ message: "secondChanceItem not found" });
        }

        const secondChanceItemUpdate = {
            category: req.body.category,
            condition: req.body.condition,
            age_days: req.body.age_days,
            description: req.body.description,
            age_years: (req.body.age_days / 365).toFixed(1), // Convert days to years, 1 decimal place
            updatedAt: new Date().toISOString() // Current date
        };

        // Perform the update
        const updateResult = await collection.findOneAndUpdate(
            { "id": req.params.id },  // Filter by "id"
            { $set: secondChanceItemUpdate }, // Update data
            { returnDocument: 'after' } // Return the updated document
        );

        console.log(" the result:", updateResult); // Log the result of the update operation


        if (updateResult) {
            res.json({ "updated": "success", "updatedItem": updateResult.value });
        } else {
            res.json({ "updated": "failed", "message": "No changes made" });
        }

    } catch (e) {
        next(e);
    }
});


// Delete an existing item
router.delete('/:id', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");

        const secondChanceItem = await collection.findOne({ "id": req.params.id });
        if (!secondChanceItem) {
            logger.error('secondChanceItem not found');
            return res.status(404).json({ message: "secondChanceItem not found" });
        }

        const deleteResult = await collection.deleteOne({ "id": req.params.id });

        if (deleteResult.deletedCount > 0) {
            res.json({ "deleted": "success" });
        } else {
            res.json({ "deleted": "failed" });
        }

    } catch (e) {
        next(e);
    }
});

module.exports = router;
