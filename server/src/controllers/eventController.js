const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { createNotification } = require('../utils/notificationHelper');

/**
 * @desc    Get all active campus events
 * @route   GET /api/events
 * @access  Private (Authenticated)
 */
const getAllEvents = async (req, res, next) => {
  try {
    const { category, status = 'Upcoming', search } = req.query;
    const query = {};

    if (category) query.category = category;
    if (status && status !== 'All') query.status = status;

    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { venue: new RegExp(search, 'i') },
      ];
    }

    const events = await Event.find(query)
      .sort({ eventDate: 1 })
      .populate('organizer', 'fullName email department');

    return sendSuccess(res, 'Events retrieved successfully', {
      total: events.length,
      events,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single event by ID
 * @route   GET /api/events/:id
 * @access  Private (Authenticated)
 */
const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      'organizer',
      'fullName email department phone'
    );

    if (!event) {
      return sendError(res, 'Event not found', 404);
    }

    // Check if the current user is registered for this event
    let isUserRegistered = false;
    let userRegistration = null;

    if (req.user && req.user.role === 'student') {
      userRegistration = await EventRegistration.findOne({
        eventId: event._id,
        studentId: req.user._id,
      });
      isUserRegistered = !!userRegistration;
    }

    return sendSuccess(res, 'Event details retrieved successfully', {
      event,
      isUserRegistered,
      userRegistration,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new campus event or workshop
 * @route   POST /api/events
 * @access  Private (Admin, Faculty)
 */
const createEvent = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      venue,
      eventDate,
      startTime,
      endTime,
      registrationDeadline,
      maxParticipants = 100,
      bannerImageUrl,
    } = req.body;

    if (!title || !description || !venue || !eventDate || !startTime || !endTime || !registrationDeadline) {
      return sendError(res, 'Please provide all required event fields', 400);
    }

    let resolvedBanner = bannerImageUrl || '';
    if (req.file) {
      resolvedBanner = `/uploads/${req.file.filename}`;
    }

    const event = await Event.create({
      title: title.trim(),
      description: description.trim(),
      category: category || 'Workshop',
      organizer: req.user._id,
      venue: venue.trim(),
      eventDate: new Date(eventDate),
      startTime,
      endTime,
      registrationDeadline: new Date(registrationDeadline),
      maxParticipants: Number(maxParticipants),
      bannerImageUrl: resolvedBanner || undefined,
      status: 'Upcoming',
    });

    return sendSuccess(res, 'Campus event created successfully', { event }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Register student for an event
 * @route   POST /api/events/:id/register
 * @access  Private (Student)
 */
const registerForEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return sendError(res, 'Event not found', 404);
    }

    if (event.status !== 'Upcoming') {
      return sendError(res, `Cannot register: Event is currently marked as ${event.status}`, 400);
    }

    // Check registration deadline
    if (new Date() > new Date(event.registrationDeadline)) {
      return sendError(res, 'Registration deadline has passed for this event', 400);
    }

    // Check if event is full
    if (event.currentRegistrationsCount >= event.maxParticipants) {
      return sendError(res, 'This event is fully booked. Maximum participants reached', 400);
    }

    // Check for duplicate registration
    const existingRegistration = await EventRegistration.findOne({
      eventId: event._id,
      studentId: req.user._id,
    });

    if (existingRegistration) {
      return sendError(res, 'You are already registered for this event', 400);
    }

    const ticketCode = `EVT-REG-${Date.now().toString().slice(-6)}`;

    const registration = await EventRegistration.create({
      eventId: event._id,
      studentId: req.user._id,
      ticketCode,
      status: 'Registered',
    });

    // Increment count
    event.currentRegistrationsCount += 1;
    await event.save();

    // Notify student
    await createNotification({
      recipient: req.user._id,
      title: 'Event Registration Confirmed',
      message: `You are registered for "${event.title}". Your ticket code is ${ticketCode}.`,
      type: 'EventReminder',
      relatedEntityId: event._id,
    });

    return sendSuccess(
      res,
      `Successfully registered for ${event.title}`,
      { registration, ticketCode },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel student event registration
 * @route   DELETE /api/events/:id/register
 * @access  Private (Student)
 */
const cancelRegistration = async (req, res, next) => {
  try {
    const registration = await EventRegistration.findOne({
      eventId: req.params.id,
      studentId: req.user._id,
    });

    if (!registration) {
      return sendError(res, 'No registration found for this event', 404);
    }

    await EventRegistration.deleteOne({ _id: registration._id });

    // Decrement count
    const event = await Event.findById(req.params.id);
    if (event && event.currentRegistrationsCount > 0) {
      event.currentRegistrationsCount -= 1;
      await event.save();
    }

    return sendSuccess(res, 'Event registration cancelled successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all events registered by the current student
 * @route   GET /api/events/my-registrations
 * @access  Private (Student)
 */
const getMyRegistrations = async (req, res, next) => {
  try {
    const registrations = await EventRegistration.find({ studentId: req.user._id })
      .sort({ registrationDate: -1 })
      .populate('eventId');

    return sendSuccess(res, 'Your event registrations retrieved successfully', {
      total: registrations.length,
      registrations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get attendee list for an event
 * @route   GET /api/events/:id/attendees
 * @access  Private (Admin, Faculty)
 */
const getEventAttendees = async (req, res, next) => {
  try {
    const registrations = await EventRegistration.find({ eventId: req.params.id })
      .sort({ registrationDate: 1 })
      .populate('studentId', 'fullName email registrationNumber department phone');

    return sendSuccess(res, 'Event attendees retrieved successfully', {
      total: registrations.length,
      attendees: registrations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an event
 * @route   PUT /api/events/:id
 * @access  Private (Admin, Faculty)
 */
const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return sendError(res, 'Event not found', 404);
    }

    const fields = [
      'title',
      'description',
      'category',
      'venue',
      'eventDate',
      'startTime',
      'endTime',
      'registrationDeadline',
      'maxParticipants',
      'status',
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        event[field] = req.body[field];
      }
    });

    if (req.file) {
      event.bannerImageUrl = `/uploads/${req.file.filename}`;
    }

    const updatedEvent = await event.save();

    return sendSuccess(res, 'Event updated successfully', { event: updatedEvent });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an event
 * @route   DELETE /api/events/:id
 * @access  Private (Admin only)
 */
const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return sendError(res, 'Event not found', 404);
    }

    await EventRegistration.deleteMany({ eventId: event._id });
    await Event.deleteOne({ _id: event._id });

    return sendSuccess(res, 'Event and associated registrations deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
  getEventAttendees,
  updateEvent,
  deleteEvent,
};

