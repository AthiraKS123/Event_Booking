/**
 * Seat Holding Express Router
 * 
 * Endpoints for holding seats and canceling active holds.
 * All endpoints require JWT authentication (`authenticate`).
 */

const express = require('express');
const router = express.Router();
const { holdSeats, cancelHold, getMyHolds } = require('../controllers/holdController');
const { authenticate } = require('../middleware/auth');

// All hold operations require user login
router.use(authenticate);

router.post('/', holdSeats);
router.delete('/:holdId', cancelHold);
router.get('/my', getMyHolds);

module.exports = router;
