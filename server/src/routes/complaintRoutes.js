const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getAllComplaints,
  getMyComplaints,
  getComplaintById,
  updateComplaintStatus,
  assignComplaint,
} = require('../controllers/complaintController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

// Student submit complaint (with optional image file upload)
router.post('/', upload.single('image'), createComplaint);

// Student fetch their own complaints
router.get('/my', getMyComplaints);

// Admin & Faculty list all complaints
router.get('/', authorize('admin', 'faculty'), getAllComplaints);

// View single complaint & history
router.get('/:id', getComplaintById);

// Admin status update & assignment
router.put('/:id/status', authorize('admin'), updateComplaintStatus);
router.put('/:id/assign', authorize('admin'), assignComplaint);

module.exports = router;

