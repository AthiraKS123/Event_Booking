const { generateTicketPDFBuffer } = require('../utils/pdfGenerator');
const { sendTicketEmail } = require('../utils/emailService');
const Booking = require('../models/bookingModel');

/**
 * @desc    Generate & Stream downloadable PDF E-Ticket with embedded QR code
 * @route   GET /api/bookings/:id/pdf
 * @access  Private (User/Admin)
 */
const downloadTicketPDF = async (req, res, next) => {
  try {
    const bookingId = req.params.id;

    // Find booking
    const booking = await Booking.findById(bookingId)
      .populate('event', 'title venue dateTime category bannerImage')
      .populate('user', 'name email');

    if (!booking) {
      res.status(404);
      return next(new Error('Booking not found'));
    }

    // Check authorization: User must own booking or be admin
    if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403);
      return next(new Error('Not authorized to access this ticket'));
    }

    // Ensure booking is confirmed
    if (booking.status !== 'confirmed') {
      res.status(400);
      return next(new Error(`Cannot generate PDF for unconfirmed booking (Status: ${booking.status})`));
    }

    const pdfBuffer = await generateTicketPDFBuffer(booking);

    // Set response headers for direct download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="EventTicket_${booking.bookingCode}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);

    res.status(200).send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resend E-Ticket PDF via Email to User
 * @route   POST /api/bookings/:id/resend-email
 * @access  Private (User/Admin)
 */
const resendTicketEmail = async (req, res, next) => {
  try {
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId)
      .populate('event', 'title venue dateTime category bannerImage')
      .populate('user', 'name email');

    if (!booking) {
      res.status(404);
      return next(new Error('Booking not found'));
    }

    if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403);
      return next(new Error('Not authorized to perform this action'));
    }

    if (booking.status !== 'confirmed') {
      res.status(400);
      return next(new Error('Cannot send ticket email for unconfirmed booking'));
    }

    const emailResult = await sendTicketEmail(booking);

    if (!emailResult.success) {
      res.status(500);
      return next(new Error(`Failed to send ticket email: ${emailResult.error}`));
    }

    res.status(200).json({
      success: true,
      message: `🎉 E-Ticket email dispatched successfully to ${booking.user.email}!`,
      previewUrl: emailResult.previewUrl,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Gatekeeper QR Code / Code Check-in Verification
 * @route   POST /api/bookings/check-in
 * @access  Private (Admin / Gatekeeper)
 */
const verifyAndCheckInTicket = async (req, res, next) => {
  try {
    const { bookingCode, bookingId } = req.body;

    if (!bookingCode && !bookingId) {
      res.status(400);
      return next(new Error('Please provide bookingCode or bookingId'));
    }

    // Build query
    const query = bookingCode ? { bookingCode: bookingCode.trim().toUpperCase() } : { _id: bookingId };

    const booking = await Booking.findOne(query)
      .populate('event', 'title venue dateTime')
      .populate('user', 'name email');

    if (!booking) {
      res.status(404);
      return next(new Error('🛑 INVALID TICKET: Booking code not found in system records.'));
    }

    // 1. Verify Payment / Booking Status
    if (booking.status !== 'confirmed') {
      res.status(400);
      return next(
        new Error(`⛔ ACCESS DENIED: Ticket status is "${booking.status.toUpperCase()}". Payment not completed.`)
      );
    }

    // 2. Check if ticket has already been used / checked in
    if (booking.isCheckedIn) {
      const formattedTime = new Date(booking.checkedInAt).toLocaleTimeString();
      res.status(400);
      return next(
        new Error(`⚠️ DUPLICATE ENTRY ALERT: Ticket was ALREADY CHECKED IN today at ${formattedTime}!`)
      );
    }

    // 3. Perform Check-In
    booking.isCheckedIn = true;
    booking.checkedInAt = new Date();
    booking.checkedInBy = req.user.id;
    await booking.save();

    res.status(200).json({
      success: true,
      message: '🎉 ENTRY GRANTED! Ticket verified & attendee checked in successfully.',
      booking: {
        id: booking._id,
        bookingCode: booking.bookingCode,
        attendeeName: booking.user.name,
        attendeeEmail: booking.user.email,
        eventTitle: booking.event.title,
        venue: booking.event.venue,
        tierName: booking.tierName,
        quantity: booking.quantity,
        checkedInAt: booking.checkedInAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Event Gatekeeper Check-In Stats
 * @route   GET /api/bookings/event/:eventId/check-in-stats
 * @access  Private (Admin / Gatekeeper)
 */
const getGatekeeperStats = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const totalConfirmed = await Booking.countDocuments({ event: eventId, status: 'confirmed' });
    const checkedInCount = await Booking.countDocuments({ event: eventId, status: 'confirmed', isCheckedIn: true });
    const pendingCount = totalConfirmed - checkedInCount;
    const checkInPercentage = totalConfirmed > 0 ? Math.round((checkedInCount / totalConfirmed) * 100) : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalConfirmed,
        checkedInCount,
        pendingCount,
        checkInPercentage,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  downloadTicketPDF,
  resendTicketEmail,
  verifyAndCheckInTicket,
  getGatekeeperStats,
};
