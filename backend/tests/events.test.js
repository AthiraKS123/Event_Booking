const Event = require('../src/models/eventModel');
const SeatHold = require('../src/models/seatHoldModel');
const Booking = require('../src/models/bookingModel');
const eventController = require('../src/controllers/eventController');

jest.mock('../src/models/eventModel');
jest.mock('../src/models/seatHoldModel');
jest.mock('../src/models/bookingModel');

describe('Event Feature Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {},
      query: {},
      params: {},
      user: { id: 'admin_123', role: 'admin' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe('createEvent', () => {
    it('should create an event successfully with valid tiers', async () => {
      req.body = {
        title: 'Tech Summit 2026',
        description: 'Global developer conference',
        venue: 'Convention Center, SF',
        dateTime: '2026-10-15T09:00:00Z',
        category: 'Conference',
        ticketTiers: [
          { name: 'VIP', price: 299, totalSeats: 50 },
          { name: 'General', price: 99, totalSeats: 200 },
        ],
      };

      const mockSavedEvent = {
        _id: 'event_999',
        ...req.body,
      };
      mockSavedEvent.save = jest.fn().mockResolvedValue(mockSavedEvent);

      Event.mockImplementation(() => mockSavedEvent);

      await eventController.createEvent(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Event created successfully',
          event: mockSavedEvent,
        })
      );
    });

    it('should reject creation if required fields are missing', async () => {
      req.body = { title: 'Missing details' };

      await eventController.createEvent(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toMatch(/Please provide title, description, venue/i);
    });
  });

  describe('getEvents', () => {
    it('should query published events and return list', async () => {
      req.query = { search: 'Tech', category: 'Conference' };

      const mockEvents = [
        { _id: 'e1', title: 'Tech Summit 2026', category: 'Conference' },
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockEvents),
      };

      Event.find.mockReturnValue(mockQuery);

      await eventController.getEvents(req, res, next);

      expect(Event.find).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'published',
          category: 'Conference',
          $or: expect.any(Array),
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 1,
          events: mockEvents,
        })
      );
    });
  });

  describe('getEventById', () => {
    it('should return event details along with occupied seat mapping', async () => {
      req.params.id = 'event_123';

      const mockEventData = {
        _id: 'event_123',
        title: 'Tech Summit 2026',
        ticketTiers: [{ _id: 'tier_1', name: 'VIP', price: 299 }],
      };

      const mockEvent = {
        ...mockEventData,
        toObject: jest.fn().mockReturnValue({
          _id: 'event_123',
          title: 'Tech Summit 2026',
          ticketTiers: [{ _id: 'tier_1', name: 'VIP', price: 299 }],
        }),
      };

      Event.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockEvent),
      });

      SeatHold.find.mockResolvedValue([
        { tierId: 'tier_1', selectedSeats: ['A1', 'A2'] },
      ]);

      Booking.find.mockResolvedValue([
        { tierId: 'tier_1', selectedSeats: ['A3'] },
      ]);

      await eventController.getEventById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          event: expect.objectContaining({
            ticketTiers: expect.arrayContaining([
              expect.objectContaining({
                occupiedSeats: expect.arrayContaining(['A1', 'A2', 'A3']),
              }),
            ]),
          }),
        })
      );
    });

    it('should return 404 when event is not found', async () => {
      req.params.id = 'nonexistent_event';

      Event.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await eventController.getEventById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toMatch(/Event not found/i);
    });
  });

  describe('updateEvent', () => {
    it('should update event when found', async () => {
      req.params.id = 'event_123';
      req.body = { title: 'Updated Title' };

      const mockExistingEvent = {
        _id: 'event_123',
        title: 'Old Title',
        save: jest.fn().mockResolvedValue({ _id: 'event_123', title: 'Updated Title' }),
      };
      Event.findById.mockResolvedValue(mockExistingEvent);

      await eventController.updateEvent(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          event: expect.objectContaining({ title: 'Updated Title' }),
        })
      );
    });
  });

  describe('deleteEvent', () => {
    it('should delete event successfully', async () => {
      req.params.id = 'event_123';

      const mockExistingEvent = {
        _id: 'event_123',
        deleteOne: jest.fn().mockResolvedValue(true),
      };
      Event.findById.mockResolvedValue(mockExistingEvent);

      await eventController.deleteEvent(req, res, next);

      expect(mockExistingEvent.deleteOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Event deleted successfully',
        })
      );
    });
  });
});
