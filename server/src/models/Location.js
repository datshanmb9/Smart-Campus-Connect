const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    qrCode: {
      type: String,
      required: [true, 'QR code identifier is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    buildingName: {
      type: String,
      required: [true, 'Building name is required'],
      trim: true,
    },
    block: {
      type: String,
      required: [true, 'Block/Wing is required'],
      trim: true,
    },
    floor: {
      type: String,
      required: [true, 'Floor is required'],
      trim: true,
    },
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      trim: true,
    },
    roomType: {
      type: String,
      required: [true, 'Room type is required'],
      enum: [
        'Classroom',
        'Computer Lab',
        'Seminar Hall',
        'Auditorium',
        'Library',
        'Restroom',
        'Cafeteria',
        'Faculty Room',
        'Other',
      ],
      default: 'Classroom',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    facilities: [
      {
        type: String,
        trim: true,
      },
    ],
    qrCodeImageUrl: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    approvalAuthority: {
      type: String,
      enum: ['admin', 'faculty'],
      default: 'admin',
    },
    assignedFaculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Location = mongoose.model('Location', locationSchema);

module.exports = Location;

