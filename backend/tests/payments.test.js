const crypto = require('crypto');
const SeatHold = require('../src/models/seatHoldModel');
const Booking = require('../src/models/bookingModel');
const paymentController = require('../src/controllers/paymentController');
const { sendTicketEmail } = require('../src/utils/emailService');

jest.mock('../src/models/seatHoldModel');
jest.mock('../src/models/bookingModel');
jest.mock('../src/utils/emailService');
jest.mock('../src/config/razorpay', () => ({
  orders: {
    create: jest.fn(),
  },
}));

const razorpay = require('../src/config/razorpay');

describe('Payment Feature Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {},
      headers: {},
      user: { id: 'user_123', role: 'user' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    sendTicketEmail.mockResolvedValue({ success: true });
  });

  describe('createPaymentOrder', () => {
    it('should create Razorpay order and pending booking for an active hold', async () => {
      req.body = { holdId: 'hold_abc_123' };

      const mockHold = {
        _id: 'hold_abc_123',
        user: 'user_123',
        status: 'held',
        totalAmount: 500,
        tierId: 'tier_1',
        tierName: 'VIP',
        quantity: 2,
        selectedSeats: ['B1', 'B2'],
        event: {
          _id: 'event_1',
          title: 'Coldplay Live',
        },
      };

      SeatHold.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockHold),
      });

      razorpay.orders.create.mockResolvedValue({
        id: 'order_rzp_live_999',
        amount: 50000,
        currency: 'INR',
      });

      const mockBooking = {
        _id: 'booking_999',
        user: 'user_123',
        totalAmount: 500,
        status: 'pending',
      };

      Booking.create.mockResolvedValue(mockBooking);

      await paymentController.createPaymentOrder(req, res, next);

      expect(razorpay.orders.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 50000,
          currency: 'INR',
          receipt: 'receipt_hold_abc_123',
        })
      );
      expect(Booking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user: 'user_123',
          totalAmount: 500,
          status: 'pending',
          razorpayOrderId: 'order_rzp_live_999',
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Razorpay order created successfully',
          order: expect.objectContaining({
            id: 'order_rzp_live_999',
            amount: 50000,
            bookingId: 'booking_999',
          }),
        })
      );
    });

    it('should return 400 if holdId is missing', async () => {
      req.body = {};

      await paymentController.createPaymentOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toMatch(/Please provide holdId/i);
    });

    it('should return 404 if active seat hold does not exist or has expired', async () => {
      req.body = { holdId: 'expired_hold' };

      SeatHold.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await paymentController.createPaymentOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toMatch(/Active seat hold not found or has expired/i);
    });
  });

  describe('verifyPaymentSignature', () => {
    it('should verify cryptographic HMAC signature and confirm booking', async () => {
      const orderId = 'order_valid_123';
      const paymentId = 'pay_valid_456';
      const secret = process.env.RAZORPAY_KEY_SECRET;

      const validSignature = crypto
        .createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      req.body = {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSignature,
        bookingId: 'booking_123',
      };

      const mockConfirmedBooking = {
        _id: 'booking_123',
        hold: 'hold_123',
        status: 'confirmed',
        bookingCode: 'EB-TEST01',
        event: { title: 'Coldplay Live' },
        user: { name: 'Alice', email: 'alice@example.com' },
      };

      Booking.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockConfirmedBooking),
        }),
      });

      SeatHold.findByIdAndUpdate.mockResolvedValue(true);

      await paymentController.verifyPaymentSignature(req, res, next);

      expect(Booking.findByIdAndUpdate).toHaveBeenCalledWith(
        'booking_123',
        expect.objectContaining({
          status: 'confirmed',
          razorpayPaymentId: paymentId,
          razorpaySignature: validSignature,
        }),
        { new: true }
      );
      expect(SeatHold.findByIdAndUpdate).toHaveBeenCalledWith('hold_123', { status: 'purchased' });
      expect(sendTicketEmail).toHaveBeenCalledWith(mockConfirmedBooking);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          booking: mockConfirmedBooking,
        })
      );
    });

    it('should reject tampered signature with 400 and mark booking failed', async () => {
      req.body = {
        razorpay_order_id: 'order_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'fake_tampered_signature_xyz',
        bookingId: 'booking_123',
      };

      Booking.findByIdAndUpdate.mockResolvedValue({ status: 'failed' });

      await paymentController.verifyPaymentSignature(req, res, next);

      expect(Booking.findByIdAndUpdate).toHaveBeenCalledWith('booking_123', { status: 'failed' });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toMatch(/Cryptographic payment signature verification failed/i);
    });

    it('should reject when required signature fields are missing', async () => {
      req.body = { bookingId: 'booking_123' };

      await paymentController.verifyPaymentSignature(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
