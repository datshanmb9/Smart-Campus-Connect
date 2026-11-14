const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getComplaintMetrics,
  getFacultySummary,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/admin-stats', authorize('admin'), getAdminStats);
router.get('/complaint-metrics', authorize('admin', 'faculty'), getComplaintMetrics);
router.get('/faculty-summary', authorize('faculty'), getFacultySummary);

module.exports = router;

