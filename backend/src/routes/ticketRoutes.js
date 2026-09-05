const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  downloadTicketPDF,
  resendTicketEmail,
  verifyAndCheckInTicket,
  getGatekeeperStats,
} = require('../controllers/ticketController');

// Download PDF Ticket (User or Admin)
router.get('/:id/pdf', authenticate, downloadTicketPDF);

// Resend E-Ticket via Email (User or Admin)
router.post('/:id/resend-email', authenticate, resendTicketEmail);

// Gatekeeper QR / Ticket Check-in Endpoint (Admin / Gatekeeper)
router.post('/check-in', authenticate, authorize('admin'), verifyAndCheckInTicket);

// Gatekeeper Check-In Stats (Admin)
router.get('/event/:eventId/check-in-stats', authenticate, authorize('admin'), getGatekeeperStats);

module.exports = router;
