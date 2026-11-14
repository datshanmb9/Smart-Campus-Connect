const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    ticketCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['Registered', 'Attended', 'Cancelled'],
      default: 'Registered',
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Unique Index: strictly prevents duplicate registrations by the same student
eventRegistrationSchema.index({ eventId: 1, studentId: 1 }, { unique: true });

const EventRegistration = mongoose.model('EventRegistration', eventRegistrationSchema);

module.exports = EventRegistration;

