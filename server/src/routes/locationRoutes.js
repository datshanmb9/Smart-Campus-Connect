const express = require('express');
const router = express.Router();
const {
  getAllLocations,
  getLocationById,
  getLocationByQrCode,
  createLocation,
  updateLocation,
  deleteLocation,
} = require('../controllers/locationController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All location operations require authentication
router.use(protect);

router.get('/', getAllLocations);
router.get('/qr/:code', getLocationByQrCode);
router.get('/:id', getLocationById);

// Admin-only management endpoints
router.post('/', authorize('admin'), createLocation);
router.put('/:id', authorize('admin'), updateLocation);
router.delete('/:id', authorize('admin'), deleteLocation);

module.exports = router;

