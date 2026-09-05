/**
 * Admin Express Router Definitions
 * 
 * Protected endpoints reserved strictly for users with the 'admin' role.
 */

const express = require('express');
const router = express.Router();
const { createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');
const { authenticate, authorize } = require('../middleware/auth');

// Protect all routes in this router: user must be logged in AND have 'admin' role
router.use(authenticate, authorize('admin'));

// Admin Event management endpoints
router.post('/events', createEvent);
router.put('/events/:id', updateEvent);
router.delete('/events/:id', deleteEvent);

module.exports = router;
