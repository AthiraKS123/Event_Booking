const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    hold: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SeatHold',
      required: true,
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
      min: 1,
    },
    selectedSeats: {
      type: [String],
      default: [],
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    bookingCode: {
      type: String,
      unique: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    isCheckedIn: {
      type: Boolean,
      default: false,
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// Pre-save hook to generate unique Booking Confirmation Code
bookingSchema.pre('save', function (next) {
  if (!this.bookingCode) {
    this.bookingCode = 'EB-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
