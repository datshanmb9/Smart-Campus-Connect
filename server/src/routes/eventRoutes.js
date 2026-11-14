const express = require('express');
const router = express.Router();
const {
  getAllEvents,
  getEventById,
  createEvent,
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
  getEventAttendees,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router.get('/', getAllEvents);
router.get('/my-registrations', authorize('student'), getMyRegistrations);
router.get('/:id', getEventById);
router.get('/:id/attendees', authorize('admin', 'faculty'), getEventAttendees);

router.post('/', authorize('admin', 'faculty'), upload.single('banner'), createEvent);
router.put('/:id', authorize('admin', 'faculty'), upload.single('banner'), updateEvent);
router.delete('/:id', authorize('admin'), deleteEvent);

router.post('/:id/register', authorize('student'), registerForEvent);
router.delete('/:id/register', authorize('student'), cancelRegistration);

module.exports = router;

