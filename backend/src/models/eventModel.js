/**
 * Event Model & Sub-document Schemas
 * 
 * Concepts Demonstrated:
 * 1. Embedded Sub-documents: `ticketTierSchema` is embedded inside `Event` to ensure atomic updates when seats are held or booked.
 * 2. Mongoose Indexes: Indexing `dateTime` and `category` fields to optimize public search and filtering performance.
 */

const mongoose = require('mongoose');

// Ticket Tier sub-document schema
const ticketTierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ticket tier name is required (e.g. VIP, General, EarlyBird)'],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'Ticket tier price is required'],
    min: [0, 'Price cannot be negative'],
  },
  totalSeats: {
    type: Number,
    required: [true, 'Total seats capacity is required'],
    min: [1, 'Total seats must be at least 1'],
  },
  availableSeats: {
    type: Number,
    min: [0, 'Available seats cannot be negative'],
  },
});

// Pre-save hook on ticketTier sub-documents: default availableSeats to totalSeats if not provided
ticketTierSchema.pre('validate', function (next) {
  if (this.availableSeats === undefined || this.availableSeats === null) {
    this.availableSeats = this.totalSeats;
  }
  next();
});

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      index: true, // Speeds up search queries by title
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
    },
    venue: {
      type: String,
      required: [true, 'Event venue is required'],
      trim: true,
    },
    dateTime: {
      type: Date,
      required: [true, 'Event date and time is required'],
      index: true,
    },
    category: {
      type: String,
      enum: ['Music', 'Tech', 'Conference', 'Workshop', 'Sports', 'Other'],
      default: 'Other',
      index: true,
    },
    bannerImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80',
    },
    ticketTiers: {
      type: [ticketTierSchema],
      validate: [
        function (val) {
          return val.length > 0;
        },
        'Event must have at least one ticket tier',
      ],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['published', 'cancelled', 'completed'],
      default: 'published',
    },
  },
  {
    timestamps: true,
  }
);

// Compound Index for efficient public queries (e.g. status='published' sorted by dateTime)
eventSchema.index({ status: 1, dateTime: 1 });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
