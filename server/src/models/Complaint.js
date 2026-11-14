const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      default: null,
    },
    manualLocation: {
      buildingName: { type: String, default: '' },
      roomNumber: { type: String, default: '' },
      landmark: { type: String, default: '' },
    },
    category: {
      type: String,
      required: [true, 'Complaint category is required'],
      enum: [
        'Electrical',
        'Projector',
        'Computer/Lab',
        'Wi-Fi/Network',
        'Furniture',
        'Water/Plumbing',
        'Cleaning/Maintenance',
        'Other',
        'Projector & AV',
        'Electrical & Lighting',
        'Lab PC / Hardware',
        'Furniture & Desk',
        'Sanitation & Restroom',
        'Plumbing',
        'Air Conditioning / Fan',
        'Other Campus Facility',
      ],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Complaint title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Detailed description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    imageUrl: {
      type: String,
      default: '',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Rejected'],
      default: 'Pending',
      index: true,
    },
    assignedTo: {
      staffName: { type: String, default: '' },
      staffPhone: { type: String, default: '' },
      department: { type: String, default: '' },
      assignedDate: { type: Date, default: null },
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Complaint = mongoose.model('Complaint', complaintSchema);

module.exports = Complaint;

