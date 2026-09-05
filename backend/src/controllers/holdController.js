/**
 * Seat Holding Controller
 * 
 * Concepts Demonstrated:
 * 1. Atomic Concurrency Lock: Using `findOneAndUpdate` with `{ 'ticketTiers.availableSeats': { $gte: quantity } }`
 *    and `{ $inc: { 'ticketTiers.$.availableSeats': -quantity } }` to guarantee zero double bookings under heavy traffic.
 * 2. Naive vs Atomic Comparison (Educative Comments).
 */

const Event = require('../models/eventModel');
const SeatHold = require('../models/seatHoldModel');

// Hold duration in minutes (10 minutes)
const HOLD_DURATION_MINUTES = 10;

/**
 * @desc    Atomically hold N seats/tickets for 10 minutes
 * @route   POST /api/bookings/hold
 * @access  Private (Authenticated User)
 */
const holdSeats = async (req, res, next) => {
  try {
    const { eventId, tierId, quantity } = req.body;
    const requestedQuantity = Number(quantity);

    // 1. Basic Input Validation
    if (!eventId || !tierId || !requestedQuantity || requestedQuantity < 1) {
      res.status(400);
      return next(new Error('Please provide valid eventId, tierId, and quantity (min 1)'));
    }

    // 2. Fetch event details to verify tier metadata & price
    const event = await Event.findById(eventId);
    if (!event || event.status !== 'published') {
      res.status(404);
      return next(new Error('Event not found or not currently active'));
    }

    const tier = event.ticketTiers.id(tierId);
    if (!tier) {
      res.status(404);
      return next(new Error('Ticket tier not found for this event'));
    }

    /*
     * -----------------------------------------------------------------------
     * 🔴 NAIVE BUGGY APPROACH (DO NOT USE IN PRODUCTION):
     * 
     * if (tier.availableSeats >= requestedQuantity) {
     *    tier.availableSeats -= requestedQuantity;
     *    await event.save(); // ❌ Vulnerable to race conditions under parallel requests!
     * }
     * -----------------------------------------------------------------------
     * 🟢 ATOMIC CONCURRENCY APPROACH (USED HERE):
     * 
     * We issue 1 single indivisible operation to MongoDB:
     * Condition: Match tier ONLY IF availableSeats >= requestedQuantity
     * Action: Atomically decrement availableSeats by requestedQuantity
     * -----------------------------------------------------------------------
     */
    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: eventId,
        status: 'published',
        ticketTiers: {
          $elemMatch: {
            _id: tierId,
            availableSeats: { $gte: requestedQuantity }, // 🔒 Enforces capacity check on the EXACT matching tier
          },
        },
      },
      {
        $inc: { 'ticketTiers.$.availableSeats': -requestedQuantity }, // 🔒 Atomic Decrement
      },
      { new: true }
    );

    // If updatedEvent is null, another concurrent request grabbed the seats first!
    if (!updatedEvent) {
      res.status(400);
      return next(new Error(`Not enough seats available for tier '${tier.name}'. Only ${tier.availableSeats} left.`));
    }

    // 3. Calculate Expiration Timestamp (Current time + 10 minutes)
    const expiresAt = new Date(Date.now() + HOLD_DURATION_MINUTES * 60 * 1000);
    const totalAmount = tier.price * requestedQuantity;

    // 4. Create the SeatHold record
    const seatHold = new SeatHold({
      user: req.user.id,
      event: eventId,
      tierId: tier._id,
      tierName: tier.name,
      quantity: requestedQuantity,
      pricePerSeat: tier.price,
      totalAmount,
      status: 'held',
      expiresAt,
    });

    const savedHold = await seatHold.save();

    res.status(201).json({
      success: true,
      message: `Successfully held ${requestedQuantity} seat(s) for ${HOLD_DURATION_MINUTES} minutes`,
      hold: {
        id: savedHold._id,
        eventId: savedHold.event,
        eventTitle: event.title,
        tierName: savedHold.tierName,
        quantity: savedHold.quantity,
        totalAmount: savedHold.totalAmount,
        expiresAt: savedHold.expiresAt,
        status: savedHold.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Manually cancel an active seat hold & release seats back to event pool
 * @route   DELETE /api/bookings/hold/:holdId
 * @access  Private (Authenticated User)
 */
const cancelHold = async (req, res, next) => {
  try {
    const { holdId } = req.params;

    // 1. Find active hold belonging to logged in user
    const hold = await SeatHold.findOne({
      _id: holdId,
      user: req.user.id,
      status: 'held',
    });

    if (!hold) {
      res.status(404);
      return next(new Error('Active seat hold not found or already released/confirmed'));
    }

    // 2. Atomically mark hold as released
    hold.status = 'released';
    await hold.save();

    // 3. Atomically add held seats back to the Event's availableSeats pool
    await Event.updateOne(
      { _id: hold.event, 'ticketTiers._id': hold.tierId },
      { $inc: { 'ticketTiers.$.availableSeats': hold.quantity } } // 🔒 Atomic Re-increment
    );

    res.status(200).json({
      success: true,
      message: 'Seat hold manually cancelled and seats returned to event pool',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all active seat holds for logged-in user
 * @route   GET /api/bookings/hold/my
 * @access  Private (Authenticated User)
 */
const getMyHolds = async (req, res, next) => {
  try {
    const activeHolds = await SeatHold.find({
      user: req.user.id,
      status: 'held',
      expiresAt: { $gt: new Date() }, // Exclude holds past expiration date
    }).populate('event', 'title venue dateTime bannerImage');

    res.status(200).json({
      success: true,
      count: activeHolds.length,
      holds: activeHolds,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  holdSeats,
  cancelHold,
  getMyHolds,
};
