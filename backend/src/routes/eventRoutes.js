/**
 * Public Event Express Router
 * 
 * Endpoints for browsing and viewing event details.
 */

const express = require('express');
const router = express.Router();
const { getEvents, getEventById } = require('../controllers/eventController');

// Public endpoints
router.get('/', getEvents);
router.get('/:id', getEventById);

module.exports = router;
