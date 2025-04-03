const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectToDatabase = require('../models/db');
const router = express.Router();
const dotenv = require('dotenv');
const pino = require('pino');  // Import Pino logger

dotenv.config();


const logger = pino();  // Create a Pino logger instance

router.post('/register', async (req, res) => {
    try {
        // Task 1: Connect to `secondChance` in MongoDB through `connectToDatabase` in `db.js`.
        const db = await connectToDatabase();
        // Task 2: Access MongoDB `users` collection
        const collection = db.collection('users');
        // Task 3: Check if user credentials already exists in the database and throw an error if they do
        const existingEmail = await collection.findOne({ email: req.body.email });

        if (existingEmail) {
            logger.error('Email id already exists');
            return res.status(400).json({ error: 'Email id already exists' });
        }
        // Task 4: Create a hash to encrypt the password so that it is not readable in the database
        // Generate a salt and hash the password
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(req.body.password, salt);

        // Task 5: Insert the user into the database
        const newUser = {
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            password: hashedPassword,
            createdAt: new Date(),
        }
        // Insert into the database
        // Insert into the database
        const result = await collection.insertOne(newUser);
        // Task 6: Create JWT authentication if passwords match with user._id as payload
        const payload = {
            user: {
                id: result.insertedId,
            },
        };

        const authtoken = jwt.sign(payload, process.env.JWT_SECRET);
        // Task 7: Log the successful registration using the logger
        // res.status(201).json({ message: "User registered successfully" });
        logger.info('User registered successfully');
        // console.log('User registered successfully');
        // Task 8: Return the user email and the token as a JSON
        // res.json({ email: newUser.email, authtoken });
        res.json({ authtoken, email: newUser.email });

    } catch (e) {
        console.error(e)
        return res.status(500).send('Internal server error');
    }
});

module.exports = router;