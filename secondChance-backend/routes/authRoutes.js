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
        const db = await connectToDatabase();
        const collection = db.collection('users');
        const existingEmail = await collection.findOne({ email: req.body.email });

        if (existingEmail) {
            logger.error('Email id already exists');
            return res.status(400).json({ error: 'Email id already exists' });
        }
        // Generate a salt and hash the password
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(req.body.password, salt);

        const newUser = {
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            password: hashedPassword,
            createdAt: new Date(),
        }
        // Insert into the database
        const result = await collection.insertOne(newUser);
        // Create JWT authentication if passwords match with user._id as payload
        const payload = {
            user: {
                id: result.insertedId,
            },
        };

        const authtoken = jwt.sign(payload, process.env.JWT_SECRET);

        // Log the successful registration using the logger
        // res.status(201).json({ message: "User registered successfully" });
        logger.info('User registered successfully');
        // console.log('User registered successfully');

        // res.json({ email: newUser.email, authtoken });
        res.json({ authtoken, email: newUser.email });

    } catch (e) {
        console.error(e)
        return res.status(500).send('Internal server error');
    }
});

router.post('/login', async (req, res) => {
    try {

        const db = await connectToDatabase();
        const collection = db.collection('users');

        const registeredUser = await collection.findOne({ email: req.body.email });

        if (registeredUser) {
            let result = await bcryptjs.compare(req.body.password, registeredUser.password)

            if (!result) {
                logger.error('Passwords do not match');
                return res.status(404).json({ error: 'Wrong pasword' });
            }

            // Fetch user details from a database
            const userName = registeredUser.firstName
            const userEmail = registeredUser.email

            // Create JWT authentication if passwords match with user._id as payload
            let payload = {
                user: {
                    id: registeredUser._id.toString(),
                },
            };

            const authtoken = jwt.sign(payload, process.env.JWT_SECRET)

            logger.error('User Login successfuly!');
            res.json({ authtoken, userName, userEmail });

        } else {
            // Send appropriate message if the user is not found
            return res.status(404).json({ error: 'User not found' });
        }

    } catch (e) {
        return res.status(500).send('Internal server error');

    }
});

module.exports = router;