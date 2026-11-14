const mongoose = require('mongoose');

const lostFoundItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Item post type is required'],
      enum: ['Lost', 'Found'],
      index: true,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Item title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Electronics',
        'ID Cards',
        'Books/Notes',
        'Keys',
        'Wallets/Bags',
        'Clothing',
        'Personal Belongings',
        'Other',
      ],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [800, 'Description cannot exceed 800 characters'],
    },
    location: {
      type: String,
      required: [true, 'Campus location where lost/found is required'],
      trim: true,
    },
    itemDate: {
      type: Date,
      required: [true, 'Date when item was lost or found is required'],
    },
    imageUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Active', 'Claim Pending', 'Resolved/Returned', 'Closed'],
      default: 'Active',
      index: true,
    },
    claimer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    claimNotes: {
      type: String,
      default: '',
    },
    isContactVisible: {
      type: Boolean,
      default: false, // Privacy protection by default
    },
  },
  {
    timestamps: true,
  }
);

const LostFoundItem = mongoose.model('LostFoundItem', lostFoundItemSchema);

module.exports = LostFoundItem;

