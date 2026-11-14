const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  uploadAvatar,
  removeAvatar,
  changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (requires valid Bearer JWT)
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.post('/upload-avatar', protect, upload.single('avatar'), uploadAvatar);
router.delete('/remove-avatar', protect, removeAvatar);
router.put('/change-password', protect, changePassword);

module.exports = router;

