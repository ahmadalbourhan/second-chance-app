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
        //Step 2: task 1 - insert code here
        const db = await connectToDatabase()
        //Step 2: task 2 - insert code here
        const collection = db.collection("secondChanceItems");
        //Step 2: task 3 - insert code here
        const secondChanceItems = await collection.find({}).toArray();
        //Step 2: task 4 - insert code here
        res.json(secondChanceItems);

    } catch (e) {
        logger.console.error('oops something went wrong', e)
        next(e);
    }
});

// Add a new item
// Task 7: Upload the image to the images directory
router.post('/', upload.single('file'), async (req, res, next) => {
    try {

        //Step 3: task 1 - insert code here
        const db = await connectToDatabase();
        //Step 3: task 2 - insert code here
        const collection = db.collection("secondChanceItems");
        //Step 3: task 3 - insert code here
        let secondChanceItem = req.body;
        //Step 3: task 4 - insert code here
        const lastItemQuery = await collection.find().sort({ 'id': -1 }).limit(1);
        await lastItemQuery.forEach(item => {
            secondChanceItem.id = (parseInt(item.id) + 1).toString();
        });
        //Step 3: task 5 - insert code here
        const date_added = Math.floor(new Date().getTime() / 1000);
        secondChanceItem.date_added = date_added

        //Handle image (if the file is not provided, assign a default image or leave it undefined)
        if (req.file) {
            secondChanceItem.image = `/images/${req.file.filename}`;
        } else {
            secondChanceItem.image = "/images/lamp.jpg"; // Default image
        }
        // Step 3: Task 6 insert code here
        secondChanceItem = await collection.insertOne(secondChanceItem)

        // res.status(201).json(secondChanceItem.ops[0]);
        res.status(201).json(secondChanceItem);
    } catch (e) {
        next(e);
    }
});

// Add a new item
// router.post('/', upload.single('file'), async (req, res, next) => {
//     try {
//         // Step 3: task 1 - Connect to database
//         const db = await connectToDatabase();
//         // Step 3: task 2 - Get collection
//         const collection = db.collection("secondChanceItems");
//         // Step 3: task 3 - Get item data from request body
//         let secondChanceItem = req.body;

//         // Step 3: task 4 - Get the last item ID to increment
//         const lastItemQuery = await collection.find().sort({ 'id': -1 }).limit(1);
//         await lastItemQuery.forEach(item => {
//             secondChanceItem.id = (parseInt(item.id) + 1).toString();
//         });

//         // Step 3: task 5 - Add date_added
//         const date_added = Math.floor(new Date().getTime() / 1000);
//         secondChanceItem.date_added = date_added;

//         // Step 3: Task 6 - Insert the new item into the database
//         const result = await collection.insertOne(secondChanceItem);

//         // If file is uploaded, include its image path in the response
//         if (req.file) {
//             secondChanceItem.image = `/images/${req.file.originalname}`;
//         }

//         // Send the response with the inserted item
//         res.status(201).json({
//             id: result.insertedId,  // Return the insertedId
//             ...secondChanceItem      // Return the full secondChanceItem with all fields
//         });
//     } catch (e) {
//         next(e);
//     }
// });


// Get a single secondChanceItem by ID
router.get('/:id', async (req, res, next) => {
    try {
        // Step 4: task 1 - Connect to database
        const db = await connectToDatabase();
        // Step 4: task 2 - Get collection
        const collection = db.collection("secondChanceItems");
        // Step 4: task 3 - Find item by ID
        const secondChanceItem = await collection.findOne({ "id": req.params.id });
        // Step 4: task 4 - Handle not found case
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
        // Step 1: Retrieve the database connection
        const db = await connectToDatabase();

        // Step 2: Get the secondChanceItems collection
        const collection = db.collection("secondChanceItems");

        // Step 3: Check if the item exists
        const secondChanceItem = await collection.findOne({ "id": req.params.id });
        if (!secondChanceItem) {
            logger.error('secondChanceItem not found');
            return res.status(404).json({ message: "secondChanceItem not found" });
        }

        // Step 4: Update the item with new values
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

        // Step 5: Send confirmation
        // if (updateResult.value) {
        //     res.json({ "updated": "success", "updatedItem": updateResult.value });
        // } else {
        //     res.json({ "updated": "failed" });
        // }
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
        // Step 1: Retrieve the database connection
        const db = await connectToDatabase();

        // Step 2: Get the secondChanceItems collection
        const collection = db.collection("secondChanceItems");

        // Step 3: Check if the item exists
        const secondChanceItem = await collection.findOne({ "id": req.params.id });
        if (!secondChanceItem) {
            logger.error('secondChanceItem not found');
            return res.status(404).json({ message: "secondChanceItem not found" });
        }

        // Step 4: Perform the deletion
        const deleteResult = await collection.deleteOne({ "id": req.params.id });

        // Step 5: Send confirmation
        if (deleteResult.deletedCount > 0) { // deletedCount is a property returned by MongoDB
            res.json({ "deleted": "success" });
        } else {
            res.json({ "deleted": "failed" });
        }

    } catch (e) {
        next(e);
    }
});

module.exports = router;
