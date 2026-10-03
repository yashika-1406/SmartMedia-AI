/**
 * Upload Middleware
 *
 * Configures Multer for handling incoming multipart/form-data.
 * Uses memory storage to pipe file buffers directly to Cloudinary without local disk storage.
 */

const multer = require('multer');

// In-memory buffer storage (prevents local disk accumulation)
const storage = multer.memoryStorage();

// File filter restricting uploads to valid image mime types
const fileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only image files (JPEG, PNG, WebP, GIF, SVG) are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB file size limit
    files: 1, // Phase 1: single image upload
  },
  fileFilter,
});

module.exports = upload;
