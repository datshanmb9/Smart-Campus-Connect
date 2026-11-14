const LostFoundItem = require('../models/LostFoundItem');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { createNotification } = require('../utils/notificationHelper');

/**
 * @desc    Report a lost or found campus item
 * @route   POST /api/lost-found
 * @access  Private (Authenticated)
 */
const createItem = async (req, res, next) => {
  try {
    const {
      type,
      title,
      category,
      description,
      location,
      itemDate,
      isContactVisible = false,
    } = req.body;

    if (!type || !title || !category || !description || !location || !itemDate) {
      return sendError(res, 'Please provide all required fields for lost & found item', 400);
    }

    let imageUrl = req.body.imageUrl || '';
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const item = await LostFoundItem.create({
      type,
      postedBy: req.user._id,
      title: title.trim(),
      category,
      description: description.trim(),
      location: location.trim(),
      itemDate: new Date(itemDate),
      imageUrl,
      isContactVisible: isContactVisible === 'true' || isContactVisible === true,
      status: 'Active',
    });

    const populatedItem = await LostFoundItem.findById(item._id).populate(
      'postedBy',
      'fullName email department phone'
    );

    return sendSuccess(res, `${type} item post created successfully`, { item: populatedItem }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all lost and found items with search and filters
 * @route   GET /api/lost-found
 * @access  Private (Authenticated)
 */
const getAllItems = async (req, res, next) => {
  try {
    const { type, category, status = 'Active', search } = req.query;
    const query = {};

    if (type) query.type = type;
    if (category) query.category = category;
    if (status && status !== 'All') query.status = status;

    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { location: new RegExp(search, 'i') },
      ];
    }

    const items = await LostFoundItem.find(query)
      .sort({ createdAt: -1 })
      .populate('postedBy', 'fullName email department phone');

    // Protect contact info if isContactVisible is false and user is not admin
    const sanitizedItems = items.map((item) => {
      const obj = item.toObject();
      const isOwner = req.user && obj.postedBy && obj.postedBy._id.toString() === req.user._id.toString();
      const isAdmin = req.user && req.user.role === 'admin';

      if (!obj.isContactVisible && !isOwner && !isAdmin && obj.postedBy) {
        delete obj.postedBy.phone;
        delete obj.postedBy.email;
      }
      return obj;
    });

    return sendSuccess(res, 'Lost & Found items retrieved successfully', {
      total: sanitizedItems.length,
      items: sanitizedItems,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get items posted by current user
 * @route   GET /api/lost-found/my
 * @access  Private (Authenticated)
 */
const getMyItems = async (req, res, next) => {
  try {
    const items = await LostFoundItem.find({ postedBy: req.user._id })
      .sort({ createdAt: -1 })
      .populate('claimer', 'fullName email department phone');

    return sendSuccess(res, 'Your posted items retrieved successfully', {
      total: items.length,
      items,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single item details
 * @route   GET /api/lost-found/:id
 * @access  Private (Authenticated)
 */
const getItemById = async (req, res, next) => {
  try {
    const item = await LostFoundItem.findById(req.params.id)
      .populate('postedBy', 'fullName email department phone')
      .populate('claimer', 'fullName email department phone');

    if (!item) {
      return sendError(res, 'Item not found', 404);
    }

    const obj = item.toObject();
    const isOwner = req.user && obj.postedBy && obj.postedBy._id.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.role === 'admin';

    if (!obj.isContactVisible && !isOwner && !isAdmin && obj.postedBy) {
      delete obj.postedBy.phone;
      delete obj.postedBy.email;
    }

    return sendSuccess(res, 'Item details retrieved successfully', { item: obj });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit claim request for a found item
 * @route   PUT /api/lost-found/:id/claim
 * @access  Private (Student, Authenticated)
 */
const claimItem = async (req, res, next) => {
  try {
    const { claimNotes } = req.body;

    if (!claimNotes) {
      return sendError(res, 'Please provide details or proof to substantiate your claim', 400);
    }

    const item = await LostFoundItem.findById(req.params.id);
    if (!item) {
      return sendError(res, 'Item not found', 404);
    }

    if (item.status !== 'Active') {
      return sendError(res, `Cannot claim: item is already marked as ${item.status}`, 400);
    }

    if (item.postedBy.toString() === req.user._id.toString()) {
      return sendError(res, 'You cannot claim an item you posted yourself', 400);
    }

    item.status = 'Claim Pending';
    item.claimer = req.user._id;
    item.claimNotes = claimNotes.trim();
    await item.save();

    // Notify the person who posted the item
    await createNotification({
      recipient: item.postedBy,
      title: 'Claim Submitted on Found Item',
      message: `${req.user.fullName} has submitted a claim for "${item.title}". Check your dashboard.`,
      type: 'LostFoundUpdate',
      relatedEntityId: item._id,
    });

    return sendSuccess(res, 'Claim submitted successfully. The finder has been notified.', {
      item,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update item status (Active, Claim Pending, Resolved/Returned, Closed)
 * @route   PUT /api/lost-found/:id/status
 * @access  Private (Admin or Item Owner)
 */
const updateItemStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['Active', 'Claim Pending', 'Resolved/Returned', 'Closed'].includes(status)) {
      return sendError(res, 'Invalid status value', 400);
    }

    const item = await LostFoundItem.findById(req.params.id);
    if (!item) {
      return sendError(res, 'Item not found', 404);
    }

    const isOwner = item.postedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return sendError(res, 'Unauthorized: Only the poster or an admin can update this post', 403);
    }

    item.status = status;
    await item.save();

    return sendSuccess(res, `Item status updated to ${status}`, { item });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete lost/found post
 * @route   DELETE /api/lost-found/:id
 * @access  Private (Admin or Item Owner)
 */
const deleteItem = async (req, res, next) => {
  try {
    const item = await LostFoundItem.findById(req.params.id);
    if (!item) {
      return sendError(res, 'Item not found', 404);
    }

    const isOwner = item.postedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return sendError(res, 'Unauthorized to delete this post', 403);
    }

    await LostFoundItem.deleteOne({ _id: item._id });

    return sendSuccess(res, 'Lost and found listing removed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createItem,
  getAllItems,
  getMyItems,
  getItemById,
  claimItem,
  updateItemStatus,
  deleteItem,
};

