const express = require('express');
const router = express.Router();
const {
  createBooking,
  getAllBookings,
  getMyBookings,
  updateBookingStatus,
  cancelBooking,
  getSectionBookingSummary,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.post('/', createBooking);
router.get('/my', getMyBookings);
router.get('/section-summary', authorize('admin'), getSectionBookingSummary);
router.get('/', authorize('admin', 'faculty'), getAllBookings);
router.put('/:id/status', authorize('admin', 'faculty'), updateBookingStatus);
router.put('/:id/cancel', cancelBooking);
router.delete('/:id', cancelBooking);

module.exports = router;

