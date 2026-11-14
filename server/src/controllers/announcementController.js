const Announcement = require('../models/Announcement');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * @desc    Get announcements scoped to current user's audience
 * @route   GET /api/announcements
 * @access  Private (Authenticated)
 */
const getAllAnnouncements = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const query = {};

    // Role-based target audience scoping
    if (req.user.role === 'student') {
      query.targetAudience = { $in: ['All', 'Students'] };
    } else if (req.user.role === 'faculty') {
      query.targetAudience = { $in: ['All', 'Faculty'] };
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { content: new RegExp(search, 'i') },
      ];
    }

    const announcements = await Announcement.find(query)
      .sort({ isImportant: -1, createdAt: -1 })
      .populate('author', 'fullName email department role');

    return sendSuccess(res, 'Announcements retrieved successfully', {
      total: announcements.length,
      announcements,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single announcement by ID
 * @route   GET /api/announcements/:id
 * @access  Private (Authenticated)
 */
const getAnnouncementById = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id).populate(
      'author',
      'fullName email department role'
    );

    if (!announcement) {
      return sendError(res, 'Announcement not found', 404);
    }

    return sendSuccess(res, 'Announcement retrieved successfully', { announcement });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new official campus announcement
 * @route   POST /api/announcements
 * @access  Private (Admin, Faculty)
 */
const createAnnouncement = async (req, res, next) => {
  try {
    const {
      title,
      content,
      category = 'General',
      isImportant = false,
      targetAudience = 'All',
      attachmentUrl = '',
      expiresAt,
    } = req.body;

    if (!title || !content) {
      return sendError(res, 'Please provide both announcement title and content', 400);
    }

    const announcement = await Announcement.create({
      title: title.trim(),
      content: content.trim(),
      category,
      isImportant: isImportant === true || isImportant === 'true',
      author: req.user._id,
      targetAudience,
      attachmentUrl,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    const populated = await Announcement.findById(announcement._id).populate(
      'author',
      'fullName email department'
    );

    return sendSuccess(res, 'Announcement published successfully', { announcement: populated }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update announcement
 * @route   PUT /api/announcements/:id
 * @access  Private (Admin only)
 */
const updateAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return sendError(res, 'Announcement not found', 404);
    }

    const fields = ['title', 'content', 'category', 'isImportant', 'targetAudience', 'attachmentUrl', 'expiresAt'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        announcement[f] = req.body[f];
      }
    });

    const updated = await announcement.save();

    return sendSuccess(res, 'Announcement updated successfully', { announcement: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete announcement
 * @route   DELETE /api/announcements/:id
 * @access  Private (Admin only)
 */
const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return sendError(res, 'Announcement not found', 404);
    }

    await Announcement.deleteOne({ _id: announcement._id });

    return sendSuccess(res, 'Announcement deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};

