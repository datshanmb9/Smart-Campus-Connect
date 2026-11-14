const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Local disk storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    let ext = path.extname(file.originalname || '').toLowerCase();
    if (!ext) {
      if (file.mimetype === 'image/png') ext = '.png';
      else if (file.mimetype === 'image/webp') ext = '.webp';
      else ext = '.jpg';
    }
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// File filter (images only)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(jpeg|jpg|png|webp|gif)$/i;
  const ext = path.extname(file.originalname || '').toLowerCase();
  const isMimeValid = !file.mimetype || file.mimetype.startsWith('image/') || file.mimetype === 'application/octet-stream';

  if ((ext && allowedExtensions.test(ext)) || (file.mimetype && file.mimetype.startsWith('image/'))) {
    return cb(null, true);
  } else {
    cb(new Error('Only valid image files (JPG, PNG, WEBP, GIF) are allowed'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter,
});

module.exports = upload;

