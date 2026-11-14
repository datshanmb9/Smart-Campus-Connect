const Notification = require('../models/Notification');

/**
 * Helper to dispatch in-app notifications
 */
const createNotification = async ({
  recipient,
  title,
  message,
  type = 'General',
  relatedEntityId = null,
}) => {
  try {
    const notification = await Notification.create({
      recipient,
      title,
      message,
      type,
      relatedEntityId,
    });
    return notification;
  } catch (error) {
    console.error('Failed to dispatch notification:', error.message);
    return null;
  }
};

module.exports = {
  createNotification,
};

