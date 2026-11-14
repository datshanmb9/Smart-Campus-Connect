const Notification = require('../models/Notification');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * @desc    Get current user's notifications
 * @route   GET /api/notifications
 * @access  Private (Authenticated)
 */
const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    return sendSuccess(res, 'Notifications retrieved successfully', {
      unreadCount,
      total: notifications.length,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark single notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private (Authenticated)
 */
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return sendError(res, 'Notification not found', 404);
    }

    notification.isRead = true;
    await notification.save();

    return sendSuccess(res, 'Notification marked as read', { notification });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all user notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private (Authenticated)
 */
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });

    return sendSuccess(res, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete notification
 * @route   DELETE /api/notifications/:id
 * @access  Private (Authenticated)
 */
const deleteNotification = async (req, res, next) => {
  try {
    const result = await Notification.deleteOne({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (result.deletedCount === 0) {
      return sendError(res, 'Notification not found or unauthorized', 404);
    }

    return sendSuccess(res, 'Notification removed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};

