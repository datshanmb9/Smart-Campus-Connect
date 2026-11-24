const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Cloudinary storage engine – images go to the 'smart-campus-complaints' folder
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'smart-campus-complaints',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 1200, quality: 'auto', fetch_format: 'auto' }],
  },
});

// File filter (images only)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(jpeg|jpg|png|webp|gif)$/i;
  const ext = require('path').extname(file.originalname || '').toLowerCase();
  const isMimeValid =
    !file.mimetype ||
    file.mimetype.startsWith('image/') ||
    file.mimetype === 'application/octet-stream';

  if (
    (ext && allowedExtensions.test(ext)) ||
    (file.mimetype && file.mimetype.startsWith('image/'))
  ) {
    return cb(null, true);
  } else {
    cb(new Error('Only valid image files (JPG, PNG, WEBP, GIF) are allowed'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB limit
  },
  fileFilter,
});

module.exports = upload;
