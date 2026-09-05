/**
 * SeatHold Model Schema
 * 
 * Concepts Demonstrated:
 * 1. Time-to-Live (TTL) / Expiration Timestamps: `expiresAt` stores the exact cutoff time (10 mins from creation).
 * 2. Status Lifecycle: 'held' -> 'released' (cron or manual) OR 'confirmed' (after Razorpay payment).
 * 3. Database Indexing: Indexing `{ status: 1, expiresAt: 1 }` for high-performance cron sweeping.
 */

const mongoose = require('mongoose');

const seatHoldSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    tierId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    tierName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Must hold at least 1 seat'],
    },
    pricePerSeat: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['held', 'released', 'confirmed'],
      default: 'held',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Index for efficient cron sweeping of expired holds
seatHoldSchema.index({ status: 1, expiresAt: 1 });

const SeatHold = mongoose.model('SeatHold', seatHoldSchema);

module.exports = SeatHold;
