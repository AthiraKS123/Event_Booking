/**
 * Event Controller Handlers
 * 
 * Concepts Demonstrated:
 * 1. Read/Write Query Operations with Mongoose: Filtering, text search regex, and field population (`populate`).
 * 2. Input Sanitization & Default Values for Nested Arrays (`ticketTiers`).
 */

const Event = require('../models/eventModel');
const SeatHold = require('../models/seatHoldModel');
const Booking = require('../models/bookingModel');

/**
 * @desc    Create a new event (Admin only)
 * @route   POST /api/admin/events
 * @access  Private/Admin
 */
const createEvent = async (req, res, next) => {
  try {
    const { title, description, venue, dateTime, category, bannerImage, ticketTiers } = req.body;

    if (!title || !description || !venue || !dateTime || !ticketTiers || !ticketTiers.length) {
      res.status(400);
      return next(new Error('Please provide title, description, venue, dateTime, and at least one ticket tier'));
    }

    const formattedTiers = ticketTiers.map((tier) => ({
      name: tier.name,
      price: Number(tier.price),
      totalSeats: Number(tier.totalSeats),
      availableSeats: tier.availableSeats !== undefined ? Number(tier.availableSeats) : Number(tier.totalSeats),
    }));

    const event = new Event({
      title,
      description,
      venue,
      dateTime,
      category: category || 'Other',
      bannerImage,
      ticketTiers: formattedTiers,
      createdBy: req.user.id,
    });

    const createdEvent = await event.save();

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event: createdEvent,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all published events (Public with filtering & search)
 * @route   GET /api/events
 * @access  Public
 */
const getEvents = async (req, res, next) => {
  try {
    const { category, search, sort, timeframe } = req.query;
    const filter = { status: 'published' };

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      filter.$or = [
        { title: searchRegex },
        { venue: searchRegex },
        { description: searchRegex },
      ];
    }

    // Timeframe filtering
    const now = new Date();
    if (timeframe === 'weekend') {
      // Upcoming weekend (Friday to Sunday)
      const dayOfWeek = now.getDay();
      const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
      const friday = new Date(now);
      friday.setDate(now.getDate() + daysUntilFriday);
      friday.setHours(0, 0, 0, 0);

      const sunday = new Date(friday);
      sunday.setDate(friday.getDate() + 2);
      sunday.setHours(23, 59, 59, 999);

      filter.dateTime = { $gte: now, $lte: sunday };
    } else if (timeframe === 'month') {
      const nextMonth = new Date(now);
      nextMonth.setDate(now.getDate() + 30);
      filter.dateTime = { $gte: now, $lte: nextMonth };
    }

    let query = Event.find(filter).populate('createdBy', 'name email');

    // Sorting
    if (sort === 'date_desc') {
      query = query.sort({ dateTime: -1 });
    } else if (sort === 'price_asc') {
      query = query.sort({ 'ticketTiers.0.price': 1 });
    } else if (sort === 'price_desc') {
      query = query.sort({ 'ticketTiers.0.price': -1 });
    } else {
      // Default: date_asc (Upcoming first)
      query = query.sort({ dateTime: 1 });
    }

    const events = await query;

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single event by ID (Public)
 * @route   GET /api/events/:id
 * @access  Public
 */
const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name email');

    if (!event) {
      res.status(404);
      return next(new Error('Event not found'));
    }

    // Find all active holds for this event
    const activeHolds = await SeatHold.find({
      event: event._id,
      status: 'held',
      expiresAt: { $gt: new Date() },
    });

    // Find all confirmed bookings for this event
    const confirmedBookings = await Booking.find({
      event: event._id,
      status: 'confirmed',
    });

    const occupiedSeatsByTier = {};
    activeHolds.forEach((h) => {
      const tierIdStr = h.tierId.toString();
      if (!occupiedSeatsByTier[tierIdStr]) occupiedSeatsByTier[tierIdStr] = [];
      if (h.selectedSeats && h.selectedSeats.length > 0) {
        occupiedSeatsByTier[tierIdStr].push(...h.selectedSeats);
      }
    });

    confirmedBookings.forEach((b) => {
      const tierIdStr = b.tierId.toString();
      if (!occupiedSeatsByTier[tierIdStr]) occupiedSeatsByTier[tierIdStr] = [];
      if (b.selectedSeats && b.selectedSeats.length > 0) {
        occupiedSeatsByTier[tierIdStr].push(...b.selectedSeats);
      }
    });

    const eventObj = event.toObject();
    eventObj.ticketTiers = eventObj.ticketTiers.map((t) => ({
      ...t,
      occupiedSeats: occupiedSeatsByTier[t._id.toString()] || [],
    }));

    res.status(200).json({
      success: true,
      event: eventObj,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an event (Admin only)
 * @route   PUT /api/admin/events/:id
 * @access  Private/Admin
 */
const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      res.status(404);
      return next(new Error('Event not found'));
    }

    Object.assign(event, req.body);
    const updatedEvent = await event.save();

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      event: updatedEvent,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an event (Admin only)
 * @route   DELETE /api/admin/events/:id
 * @access  Private/Admin
 */
const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      res.status(404);
      return next(new Error('Event not found'));
    }

    await event.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
};
