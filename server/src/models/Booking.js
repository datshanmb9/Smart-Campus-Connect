const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    resourceName: {
      type: String,
      required: [true, 'Resource or room name is required'],
      trim: true,
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: [true, 'Location reference is required'],
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    purpose: {
      type: String,
      required: [true, 'Purpose of reservation is required'],
      trim: true,
    },
    bookingDate: {
      type: Date,
      required: [true, 'Booking date is required'],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required (HH:mm format)'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Please provide valid time in HH:mm 24hr format'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required (HH:mm format)'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Please provide valid time in HH:mm 24hr format'],
    },
    attendeesEstimate: {
      type: Number,
      default: 20,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
      default: 'Pending',
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index to accelerate conflict detection queries
bookingSchema.index({ locationId: 1, bookingDate: 1, status: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;

