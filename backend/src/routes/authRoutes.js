/**
 * Auth Express Router Definitions
 * 
 * Concepts Demonstrated:
 * Express Router modularization separates endpoint definitions from full app initialization.
 */

const express = require('express');
const router = express.Router();
const { register, login, refreshToken } = require('../controllers/authController');

// Authentication endpoints
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);

module.exports = router;
