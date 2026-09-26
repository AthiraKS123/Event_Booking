const Booking = require('../src/models/bookingModel');
const Event = require('../src/models/eventModel');
const ticketController = require('../src/controllers/ticketController');
const { generateTicketPDFBuffer } = require('../src/utils/pdfGenerator');
const { sendTicketEmail, sendCancellationEmail } = require('../src/utils/emailService');

jest.mock('../src/models/bookingModel');
jest.mock('../src/models/eventModel');
jest.mock('../src/utils/pdfGenerator');
jest.mock('../src/utils/emailService');
jest.mock('../src/config/razorpay', () => ({
  payments: {
    refund: jest.fn().mockResolvedValue({ id: 'rfnd_mock_123' }),
  },
}));


describe('Ticket & Gatekeeper Check-In Feature Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {},
      params: {},
      user: { id: 'user_123', role: 'user' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
      send: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe('downloadTicketPDF', () => {
    it('should generate and stream PDF for a confirmed booking owned by user', async () => {
      req.params.id = 'booking_abc';

      const mockBooking = {
        _id: 'booking_abc',
        bookingCode: 'EB-TEST99',
        status: 'confirmed',
        user: { _id: 'user_123', name: 'Alice' },
        event: { title: 'Coldplay Concert' },
      };

      Booking.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockBooking),
        }),
      });

      const mockBuffer = Buffer.from('%PDF-1.4 Mock PDF Content');
      generateTicketPDFBuffer.mockResolvedValue(mockBuffer);

      await ticketController.downloadTicketPDF(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="EventTicket_EB-TEST99.pdf"'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(mockBuffer);
    });

    it('should forbid user from downloading someone elses ticket', async () => {
      req.params.id = 'booking_abc';
      req.user = { id: 'unauthorized_hacker', role: 'user' };

      const mockBooking = {
        _id: 'booking_abc',
        user: { _id: 'user_123' },
        status: 'confirmed',
      };

      Booking.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockBooking),
        }),
      });

      await ticketController.downloadTicketPDF(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toMatch(/Not authorized to access this ticket/i);
    });

    it('should reject download if booking is not confirmed', async () => {
      req.params.id = 'booking_abc';

      const mockBooking = {
        _id: 'booking_abc',
        user: { _id: 'user_123' },
        status: 'pending',
      };

      Booking.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockBooking),
        }),
      });

      await ticketController.downloadTicketPDF(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toMatch(/Cannot generate PDF for unconfirmed booking/i);
    });
  });

  describe('verifyAndCheckInTicket', () => {
    it('should verify bookingCode, mark attendee checked in, and return green status', async () => {
      req.user = { id: 'admin_gatekeeper', role: 'admin' };
      req.body = { bookingCode: 'EB-PASS01' };

      const mockBooking = {
        _id: 'booking_1',
        bookingCode: 'EB-PASS01',
        status: 'confirmed',
        isCheckedIn: false,
        user: { name: 'John Attendee', email: 'john@example.com' },
        event: { title: 'Coldplay Live', venue: 'DY Patil Stadium' },
        tierName: 'VIP Gold',
        quantity: 2,
        save: jest.fn().mockResolvedValue(true),
      };

      Booking.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockBooking),
        }),
      });

      await ticketController.verifyAndCheckInTicket(req, res, next);

      expect(mockBooking.isCheckedIn).toBe(true);
      expect(mockBooking.checkedInBy).toBe('admin_gatekeeper');
      expect(mockBooking.checkedInAt).toBeInstanceOf(Date);
      expect(mockBooking.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringMatching(/ENTRY GRANTED/i),
          booking: expect.objectContaining({
            bookingCode: 'EB-PASS01',
            attendeeName: 'John Attendee',
          }),
        })
      );
    });

    it('should detect duplicate scan and return 400 DUPLICATE ENTRY ALERT', async () => {
      req.user = { id: 'admin_gatekeeper', role: 'admin' };
      req.body = { bookingCode: 'EB-PASS01' };

      const mockBooking = {
        _id: 'booking_1',
        bookingCode: 'EB-PASS01',
        status: 'confirmed',
        isCheckedIn: true,
        checkedInAt: new Date(Date.now() - 300000),
        user: { name: 'John Attendee', email: 'john@example.com' },
        event: { title: 'Coldplay Live' },
      };

      Booking.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockBooking),
        }),
      });

      await ticketController.verifyAndCheckInTicket(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toMatch(/DUPLICATE ENTRY ALERT/i);
    });

    it('should reject check-in for non-existent ticket code', async () => {
      req.user = { id: 'admin_gatekeeper', role: 'admin' };
      req.body = { bookingCode: 'EB-FAKE99' };

      Booking.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null),
        }),
      });

      await ticketController.verifyAndCheckInTicket(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toMatch(/INVALID TICKET/i);
    });

    it('should deny entry for unconfirmed / unpaid ticket', async () => {
      req.user = { id: 'admin_gatekeeper', role: 'admin' };
      req.body = { bookingCode: 'EB-UNPAID' };

      const mockBooking = {
        _id: 'booking_unpaid',
        status: 'pending',
        user: { name: 'Unpaid User' },
        event: { title: 'Coldplay Live' },
      };

      Booking.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockBooking),
        }),
      });

      await ticketController.verifyAndCheckInTicket(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toMatch(/ACCESS DENIED/i);
    });
  });

  describe('getGatekeeperStats', () => {
    it('should compute check-in statistics accurately', async () => {
      req.params.eventId = 'event_123';

      Booking.countDocuments
        .mockResolvedValueOnce(100) // totalConfirmed
        .mockResolvedValueOnce(65);  // checkedInCount

      await ticketController.getGatekeeperStats(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          stats: {
            totalConfirmed: 100,
            checkedInCount: 65,
            pendingCount: 35,
            checkInPercentage: 65,
          },
        })
      );
    });
  });

  describe('cancelTicket', () => {
    it('should cancel confirmed ticket, restore event seats, and process refund', async () => {
      req.params.id = 'booking_abc';
      req.user = { id: 'user_123', role: 'user' };
      req.body = { reason: 'Personal scheduling conflict' };

      const mockBooking = {
        _id: 'booking_abc',
        bookingCode: 'EB-CANCEL1',
        status: 'confirmed',
        isCheckedIn: false,
        totalAmount: 1500,
        quantity: 2,
        tierId: 'tier_vip',
        razorpayPaymentId: 'pay_test_999',
        user: { _id: 'user_123', name: 'Alice', email: 'alice@example.com' },
        event: {
          _id: 'event_456',
          title: 'Future Tech Summit',
          dateTime: new Date(Date.now() + 86400000), // Tomorrow
        },
        save: jest.fn().mockResolvedValue(true),
      };

      Booking.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockBooking),
        }),
      });

      Event.updateOne.mockResolvedValue({ modifiedCount: 1 });
      sendCancellationEmail.mockResolvedValue({ success: true });

      await ticketController.cancelTicket(req, res, next);

      expect(Event.updateOne).toHaveBeenCalledWith(
        { _id: 'event_456', 'ticketTiers._id': 'tier_vip' },
        { $inc: { 'ticketTiers.$.availableSeats': 2 } }
      );
      expect(mockBooking.status).toBe('cancelled');
      expect(mockBooking.refundAmount).toBe(1500);
      expect(mockBooking.cancellationReason).toBe('Personal scheduling conflict');
      expect(mockBooking.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringMatching(/successfully cancelled/i),
        })
      );
    });

    it('should forbid user from cancelling another user ticket', async () => {
      req.params.id = 'booking_abc';
      req.user = { id: 'another_user', role: 'user' };

      const mockBooking = {
        _id: 'booking_abc',
        status: 'confirmed',
        user: { _id: 'user_123' },
        event: { dateTime: new Date(Date.now() + 86400000) },
      };

      Booking.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockBooking),
        }),
      });

      await ticketController.cancelTicket(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toMatch(/Not authorized to cancel this booking/i);
    });

    it('should reject cancellation if ticket is already checked in at gate', async () => {
      req.params.id = 'booking_abc';
      req.user = { id: 'user_123', role: 'user' };

      const mockBooking = {
        _id: 'booking_abc',
        status: 'confirmed',
        isCheckedIn: true,
        user: { _id: 'user_123' },
        event: { dateTime: new Date(Date.now() + 86400000) },
      };

      Booking.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockBooking),
        }),
      });

      await ticketController.cancelTicket(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toMatch(/already checked in/i);
    });

    it('should allow cancellation for un-checked-in ticket even if event date is past', async () => {
      req.params.id = 'booking_abc';
      req.user = { id: 'user_123', role: 'user' };

      const mockBooking = {
        _id: 'booking_abc',
        bookingCode: 'EB-PAST1',
        status: 'confirmed',
        isCheckedIn: false,
        totalAmount: 500,
        quantity: 1,
        tierId: 'tier_gen',
        user: { _id: 'user_123', name: 'Alice', email: 'alice@example.com' },
        event: { _id: 'event_999', dateTime: new Date(Date.now() - 86400000) }, // Past date
        save: jest.fn().mockResolvedValue(true),
      };

      Booking.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockBooking),
        }),
      });

      Event.updateOne.mockResolvedValue({ modifiedCount: 1 });
      sendCancellationEmail.mockResolvedValue({ success: true });

      await ticketController.cancelTicket(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockBooking.status).toBe('cancelled');
    });
  });
});

