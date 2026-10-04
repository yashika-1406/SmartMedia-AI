/**
 * Upload Middleware
 *
 * Configures Multer for handling incoming multipart/form-data.
 * Uses memory storage to pipe file buffers directly to Cloudinary without local disk storage.
 * Supports both images (up to 15MB) and videos (up to 100MB).
 */

const multer = require('multer');

// In-memory buffer storage (prevents local disk accumulation)
const storage = multer.memoryStorage();

const IMAGE_MAX_SIZE = 15 * 1024 * 1024; // 15MB for images
const VIDEO_MAX_SIZE = 100 * 1024 * 1024; // 100MB for videos

const SUPPORTED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

const SUPPORTED_VIDEO_MIMES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

// File filter restricting uploads to valid image and video mime types
const fileFilter = (req, file, cb) => {
  const mimetype = (file.mimetype || '').toLowerCase();
  const isImage = mimetype.startsWith('image/') || SUPPORTED_IMAGE_MIMES.includes(mimetype);
  const isVideo = mimetype.startsWith('video/') || SUPPORTED_VIDEO_MIMES.includes(mimetype);

  if (isImage || isVideo) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file format. Supported formats: images (JPEG, PNG, WebP, GIF, SVG) and videos (MP4, MOV, WebM).'
      ),
      false
    );
  }
};

const multerInstance = multer({
  storage,
  limits: {
    fileSize: VIDEO_MAX_SIZE, // 100MB top-level buffer limit
    files: 1, // Single media asset upload per request
  },
  fileFilter,
});

/**
 * Middleware wrapper enforcing media-specific upload size thresholds
 */
const uploadMiddleware = (req, res, next) => {
  multerInstance.single('file')(req, res, (err) => {
    if (err) {
      return next(err);
    }

    if (req.file) {
      const mimetype = (req.file.mimetype || '').toLowerCase();
      const isImage = mimetype.startsWith('image/');
      const isVideo = mimetype.startsWith('video/');

      if (isImage && req.file.size > IMAGE_MAX_SIZE) {
        return res.status(400).json({
          success: false,
          message: 'Image exceeds 15 MB limit.',
        });
      }

      if (isVideo && req.file.size > VIDEO_MAX_SIZE) {
        return res.status(400).json({
          success: false,
          message: 'Video exceeds 100 MB limit.',
        });
      }
    }

    next();
  });
};

uploadMiddleware.single = (field) => uploadMiddleware;

module.exports = uploadMiddleware;

