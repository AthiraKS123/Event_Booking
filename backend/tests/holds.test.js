const Event = require('../src/models/eventModel');
const SeatHold = require('../src/models/seatHoldModel');
const holdController = require('../src/controllers/holdController');

jest.mock('../src/models/eventModel');
jest.mock('../src/models/seatHoldModel');

describe('Seat Hold Feature Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {},
      params: {},
      user: { id: 'user_456', role: 'user' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe('holdSeats', () => {
    it('should hold seats atomically and create seat hold document', async () => {
      req.body = {
        eventId: 'event_123',
        tierId: 'tier_vip_1',
        quantity: 2,
        selectedSeats: ['A1', 'A2'],
      };

      const mockTier = {
        _id: 'tier_vip_1',
        name: 'VIP',
        price: 150,
        availableSeats: 10,
      };

      const mockEvent = {
        _id: 'event_123',
        title: 'Coldplay Concert',
        status: 'published',
        ticketTiers: {
          id: jest.fn().mockReturnValue(mockTier),
        },
      };

      Event.findById.mockResolvedValue(mockEvent);
      Event.findOneAndUpdate.mockResolvedValue({ _id: 'event_123' });

      const mockSavedHold = {
        _id: 'hold_999',
        event: 'event_123',
        tierId: 'tier_vip_1',
        tierName: 'VIP',
        quantity: 2,
        selectedSeats: ['A1', 'A2'],
        pricePerSeat: 150,
        totalAmount: 300,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        status: 'held',
      };
      mockSavedHold.save = jest.fn().mockResolvedValue(mockSavedHold);

      SeatHold.mockImplementation(() => mockSavedHold);

      await holdController.holdSeats(req, res, next);

      expect(Event.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'event_123',
          ticketTiers: {
            $elemMatch: {
              _id: 'tier_vip_1',
              availableSeats: { $gte: 2 },
            },
          },
        }),
        expect.objectContaining({
          $inc: { 'ticketTiers.$.availableSeats': -2 },
        }),
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringMatching(/held 2 seat\(s\)/i),
          hold: expect.objectContaining({
            id: 'hold_999',
            totalAmount: 300,
          }),
        })
      );
    });

    it('should reject hold if requested quantity exceeds available capacity', async () => {
      req.body = {
        eventId: 'event_123',
        tierId: 'tier_vip_1',
        quantity: 5,
      };

      const mockTier = {
        _id: 'tier_vip_1',
        name: 'VIP',
        price: 150,
        availableSeats: 2,
      };

      const mockEvent = {
        _id: 'event_123',
        status: 'published',
        ticketTiers: { id: jest.fn().mockReturnValue(mockTier) },
      };

      Event.findById.mockResolvedValue(mockEvent);
      // Atomic findOneAndUpdate returns null when condition fails
      Event.findOneAndUpdate.mockResolvedValue(null);

      await holdController.holdSeats(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toMatch(/Not enough seats available/i);
    });

    it('should reject hold if inputs are invalid or missing', async () => {
      req.body = { eventId: 'event_123', quantity: 0 };

      await holdController.holdSeats(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('cancelHold', () => {
    it('should cancel hold and restore seats to the event pool', async () => {
      req.params.holdId = 'hold_123';

      const mockHold = {
        _id: 'hold_123',
        event: 'event_123',
        tierId: 'tier_vip_1',
        quantity: 2,
        status: 'held',
        save: jest.fn().mockResolvedValue(true),
      };

      SeatHold.findOne.mockResolvedValue(mockHold);
      Event.updateOne.mockResolvedValue({ modifiedCount: 1 });

      await holdController.cancelHold(req, res, next);

      expect(mockHold.status).toBe('released');
      expect(mockHold.save).toHaveBeenCalled();
      expect(Event.updateOne).toHaveBeenCalledWith(
        { _id: 'event_123', 'ticketTiers._id': 'tier_vip_1' },
        { $inc: { 'ticketTiers.$.availableSeats': 2 } }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringMatching(/returned to event pool/i),
        })
      );
    });

    it('should return 404 if active hold is not found', async () => {
      req.params.holdId = 'nonexistent_hold';

      SeatHold.findOne.mockResolvedValue(null);

      await holdController.cancelHold(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getMyHolds', () => {
    it('should retrieve active unexpired holds for logged-in user', async () => {
      const mockHolds = [
        {
          _id: 'hold_1',
          tierName: 'VIP',
          quantity: 2,
          status: 'held',
          expiresAt: new Date(Date.now() + 500000),
        },
      ];

      SeatHold.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockHolds),
      });

      await holdController.getMyHolds(req, res, next);

      expect(SeatHold.find).toHaveBeenCalledWith(
        expect.objectContaining({
          user: 'user_456',
          status: 'held',
          expiresAt: expect.any(Object),
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 1,
          holds: mockHolds,
        })
      );
    });
  });
});
