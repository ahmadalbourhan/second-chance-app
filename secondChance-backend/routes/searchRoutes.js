const express = require('express');
const router = express.Router();
const connectToDatabase = require('../models/db');

// Search for gifts
router.get('/', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");

        // Initialize the query object
        let query = {};

        // Add the name filter to the query if the name parameter is not empty
        if (req.query.name && req.query.name.trim() !== '') {
            // Using regex for partial match, case-insensitive
            query.name = { $regex: req.query.name, $options: "i" };
        }

        if (req.query.category) {
            query.category = req.query.category;
        }
        if (req.query.condition) {
            query.condition = req.query.condition;
        }
        if (req.query.age_years && !isNaN(req.query.age_years)) {
            query.age_years = { $lte: parseInt(req.query.age_years) };
        }
        // console.log(query)

        const searchItems = await collection.find(query).toArray();
        // console.log(searchItems)

        res.json(searchItems);

    } catch (e) {
        next(e);
    }
});

module.exports = router;
