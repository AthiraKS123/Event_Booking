/**
 * Expired Seat Holds Background Sweeper Job
 * 
 * Concepts Demonstrated:
 * 1. Background Cron Workers (`node-cron`): Automated scheduled task running every 60 seconds.
 * 2. Idempotent State Restoration: Finds expired seat holds, releases them, and restores seats to event pool atomically.
 */

const cron = require('node-cron');
const SeatHold = require('../models/seatHoldModel');
const Event = require('../models/eventModel');

/**
 * Initialize background cron job
 */
const initExpireHoldsJob = () => {
  // Schedule cron task to run every minute ('* * * * *')
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      // 1. Find all seat holds that are marked 'held' BUT have passed their expiresAt timestamp
      const expiredHolds = await SeatHold.find({
        status: 'held',
        expiresAt: { $lte: now },
      });

      if (expiredHolds.length === 0) {
        return; // No expired holds to process
      }

      console.log(`[Cron Job] Found ${expiredHolds.length} expired seat hold(s). Releasing back to pool...`);

      // 2. Iterate and process each expired hold
      for (const hold of expiredHolds) {
        // Mark hold as released
        hold.status = 'released';
        await hold.save();

        // Atomically re-increment available seats in Event document
        await Event.updateOne(
          { _id: hold.event, 'ticketTiers._id': hold.tierId },
          { $inc: { 'ticketTiers.$.availableSeats': hold.quantity } }
        );

        console.log(`[Cron Job] Released ${hold.quantity} seat(s) for tier '${hold.tierName}' back to Event ID: ${hold.event}`);
      }

      console.log(`[Cron Job] Expired seat holds sweep completed successfully.`);
    } catch (error) {
      console.error(`[Cron Job Error] Failed to sweep expired holds: ${error.message}`);
    }
  });

  console.log('[Cron Job Engine] Expired seat hold sweeper initialized (Runs every 60 seconds).');
};

module.exports = initExpireHoldsJob;
