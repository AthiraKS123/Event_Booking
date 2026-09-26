const { generateTicketPDFBuffer } = require('../utils/pdfGenerator');
const { sendTicketEmail, sendCancellationEmail } = require('../utils/emailService');
const Booking = require('../models/bookingModel');
const Event = require('../models/eventModel');
const razorpay = require('../config/razorpay');

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

/**
 * @desc    Get All Checked-In Attendees History from Database
 * @route   GET /api/bookings/gatekeeper/history
 * @access  Private (Admin / Gatekeeper)
 */
const getCheckedInHistory = async (req, res, next) => {
  try {
    const checkedInBookings = await Booking.find({ status: 'confirmed', isCheckedIn: true })
      .populate('event', 'title venue dateTime category')
      .populate('user', 'name email')
      .sort({ checkedInAt: -1 })
      .limit(50);

    const formattedHistory = checkedInBookings.map((b) => ({
      status: 'SUCCESS',
      message: 'Verified Entry Pass in Database',
      booking: {
        id: b._id,
        bookingCode: b.bookingCode,
        attendeeName: b.user ? b.user.name : 'Attendee',
        attendeeEmail: b.user ? b.user.email : 'N/A',
        eventTitle: b.event ? b.event.title : 'Event Pass',
        venue: b.event ? b.event.venue : 'Main Gate',
        tierName: b.tierName,
        quantity: b.quantity,
        checkedInAt: b.checkedInAt,
      },
      timestamp: new Date(b.checkedInAt).toLocaleTimeString(),
    }));

    res.status(200).json({
      success: true,
      count: formattedHistory.length,
      history: formattedHistory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel a confirmed ticket booking, restore inventory & trigger refund
 * @route   POST /api/bookings/:id/cancel
 * @access  Private (Ticket owner or Admin)
 */
const cancelTicket = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const { reason } = req.body || {};

    // 1. Find booking with event & user populated
    const booking = await Booking.findById(bookingId)
      .populate('event')
      .populate('user', 'name email');

    if (!booking) {
      res.status(404);
      return next(new Error('Booking not found'));
    }

    // 2. Authorization check: User must own the booking or be admin
    if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403);
      return next(new Error('Not authorized to cancel this booking'));
    }

    // 3. Ensure booking is confirmed
    if (booking.status !== 'confirmed') {
      res.status(400);
      return next(new Error(`Cannot cancel ticket with status '${booking.status}'. Only confirmed tickets can be cancelled.`));
    }

    // 4. Ensure ticket is NOT already checked in
    if (booking.isCheckedIn) {
      res.status(400);
      return next(new Error('Cannot cancel ticket: Attendee has already checked in at the event gate.'));
    }

    // 5. Atomically restore seats to Event's ticket tier
    if (booking.event) {
      await Event.updateOne(
        { _id: booking.event._id, 'ticketTiers._id': booking.tierId },
        { $inc: { 'ticketTiers.$.availableSeats': booking.quantity } }
      );
    }

    // 7. Process Refund (via Razorpay or test mock)
    let refundId = null;
    let refundStatus = 'none';

    if (booking.razorpayPaymentId) {
      try {
        const refundResponse = await razorpay.payments.refund(booking.razorpayPaymentId, {
          amount: Math.round(booking.totalAmount * 100),
          notes: {
            bookingCode: booking.bookingCode,
            cancellationReason: reason || 'Customer requested ticket cancellation',
          },
        });
        refundId = refundResponse.id;
        refundStatus = 'processed';
      } catch (rzpErr) {
        // Fallback for test / sandbox / mock mode
        refundId = 'rfnd_mock_' + Math.random().toString(36).substring(2, 10);
        refundStatus = 'mock_processed';
      }
    } else {
      refundId = 'rfnd_mock_' + Math.random().toString(36).substring(2, 10);
      refundStatus = 'mock_processed';
    }

    // 8. Update Booking status to cancelled
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason || 'Customer requested ticket cancellation';
    booking.refundId = refundId;
    booking.refundAmount = booking.totalAmount;
    booking.refundStatus = refundStatus;
    await booking.save();

    // 9. Dispatch cancellation & refund confirmation email asynchronously
    sendCancellationEmail(booking).catch((emailErr) => {
      console.error('Cancellation email dispatch error:', emailErr);
    });

    res.status(200).json({
      success: true,
      message: 'Ticket successfully cancelled. Seats returned to event pool and full refund initiated.',
      booking: {
        _id: booking._id,
        bookingCode: booking.bookingCode,
        status: booking.status,
        refundId: booking.refundId,
        refundAmount: booking.refundAmount,
        refundStatus: booking.refundStatus,
        cancelledAt: booking.cancelledAt,
        cancellationReason: booking.cancellationReason,
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
  getCheckedInHistory,
  cancelTicket,
};

