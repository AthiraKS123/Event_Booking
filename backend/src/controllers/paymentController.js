const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const SeatHold = require('../models/seatHoldModel');
const Booking = require('../models/bookingModel');
const { sendTicketEmail } = require('../utils/emailService');

/**
 * @desc    Create a Razorpay Payment Order for an active seat hold
 * @route   POST /api/payments/create-order
 * @access  Private (User/Admin)
 */
const createPaymentOrder = async (req, res, next) => {
  try {
    const { holdId } = req.body;

    if (!holdId) {
      res.status(400);
      return next(new Error('Please provide holdId'));
    }

    // 1. Find active seat hold for logged-in user
    const hold = await SeatHold.findOne({
      _id: holdId,
      user: req.user.id,
      status: 'held',
      expiresAt: { $gt: new Date() },
    }).populate('event', 'title venue dateTime');

    if (!hold) {
      res.status(404);
      return next(new Error('Active seat hold not found or has expired'));
    }

    // 2. Amount in paise (1 INR = 100 Paise)
    const amountInPaise = Math.round(hold.totalAmount * 100);

    let orderId;
    let isMock = false;
    try {
      // Create Order with Razorpay SDK
      const razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_${hold._id}`,
        notes: {
          holdId: hold._id.toString(),
          userId: req.user.id.toString(),
          eventId: hold.event._id.toString(),
        },
      });
      orderId = razorpayOrder.id;
    } catch (rzpErr) {
      // Fallback for development if Razorpay API keys are in test mock mode
      orderId = 'order_rzp_mock_' + Math.random().toString(36).substring(2, 10);
      isMock = true;
    }

    // 3. Create Pending Booking document
    const booking = await Booking.create({
      user: req.user.id,
      event: hold.event._id,
      hold: hold._id,
      tierId: hold.tierId,
      tierName: hold.tierName,
      quantity: hold.quantity,
      selectedSeats: hold.selectedSeats || [],
      totalAmount: hold.totalAmount,
      razorpayOrderId: orderId,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Razorpay order created successfully',
      order: {
        id: orderId,
        amount: amountInPaise,
        currency: 'INR',
        bookingId: booking._id,
        holdId: hold._id,
        eventTitle: hold.event.title,
        tierName: hold.tierName,
        quantity: hold.quantity,
        totalAmount: hold.totalAmount,
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_eventbook_key_2026',
        isMock,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify Cryptographic Razorpay Signature & Confirm Booking
 * @route   POST /api/payments/verify-signature
 * @access  Private (User/Admin)
 */
const verifyPaymentSignature = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
      res.status(400);
      return next(new Error('Missing required payment signature fields'));
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_eventbook_secret_2026';

    // HMAC SHA256 Signature Verification: order_id + "|" + payment_id
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isSignatureValid = generatedSignature === razorpay_signature;

    if (!isSignatureValid) {
      // Mark booking failed
      await Booking.findByIdAndUpdate(bookingId, { status: 'failed' });
      res.status(400);
      return next(new Error('🛑 FRAUD DETECTED: Cryptographic payment signature verification failed'));
    }

    // Update Booking status to confirmed
    const confirmedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: 'confirmed',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
      { new: true }
    )
      .populate('event', 'title venue dateTime bannerImage category')
      .populate('user', 'name email');

    // Update SeatHold status to purchased
    if (confirmedBooking?.hold) {
      await SeatHold.findByIdAndUpdate(confirmedBooking.hold, { status: 'purchased' });
    }

    // Asynchronously dispatch E-Ticket PDF Email (non-blocking)
    sendTicketEmail(confirmedBooking).catch((err) =>
      console.error('Async ticket email dispatch error:', err)
    );

    res.status(200).json({
      success: true,
      message: '🎉 Payment verified & Booking confirmed successfully!',
      booking: confirmedBooking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Razorpay Webhook Handler (Asynchronous Server-to-Server Verification)
 * @route   POST /api/payments/webhook
 * @access  Public (Razorpay Server Callback)
 */
const handleWebhook = async (req, res, next) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'razorpay_webhook_secret_concurrency_2026';
    const signature = req.headers['x-razorpay-signature'];

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (expectedSignature !== signature) {
      res.status(400);
      return next(new Error('Invalid Webhook Signature'));
    }

    const event = req.body.event;

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = req.body.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;

      const booking = await Booking.findOne({ razorpayOrderId: orderId })
        .populate('event', 'title venue dateTime bannerImage category')
        .populate('user', 'name email');

      if (booking && booking.status !== 'confirmed') {
        booking.status = 'confirmed';
        booking.razorpayPaymentId = paymentId;
        await booking.save();

        if (booking.hold) {
          await SeatHold.findByIdAndUpdate(booking.hold, { status: 'purchased' });
        }

        sendTicketEmail(booking).catch((err) =>
          console.error('Webhook ticket email dispatch error:', err)
        );
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Logged-in User's Confirmed Bookings & Tickets
 * @route   GET /api/bookings/my
 * @access  Private (User/Admin)
 */
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({
      user: req.user.id,
      status: { $in: ['confirmed', 'cancelled', 'refunded'] },
    })
      .populate('event', 'title venue dateTime category bannerImage')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPaymentOrder,
  verifyPaymentSignature,
  handleWebhook,
  getMyBookings,
};
