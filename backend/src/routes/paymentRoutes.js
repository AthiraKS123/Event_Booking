const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createPaymentOrder,
  verifyPaymentSignature,
  handleWebhook,
  getMyBookings,
} = require('../controllers/paymentController');

// Protected Routes
router.post('/create-order', authenticate, createPaymentOrder);
router.post('/verify-signature', authenticate, verifyPaymentSignature);
router.get('/my', authenticate, getMyBookings);

// Public Webhook Callback Endpoint
router.post('/webhook', handleWebhook);

module.exports = router;
