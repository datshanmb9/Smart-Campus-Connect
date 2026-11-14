const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUserStatus,
  getPendingStudents,
  approveStudent,
  rejectStudent,
  suspendUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All user management routes require authentication and Admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/pending-students', getPendingStudents);
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id/status', updateUserStatus);
router.put('/:id/approve', approveStudent);
router.put('/:id/reject', rejectStudent);
router.put('/:id/suspend', suspendUser);

module.exports = router;

