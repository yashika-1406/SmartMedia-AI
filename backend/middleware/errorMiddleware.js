/**
 * Error Handling Middleware
 *
 * Catches 404 unhandled routes and provides centralized, clear error responses.
 */

const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Cloudinary specific HTTP error status
  if (err.http_code && typeof err.http_code === 'number') {
    statusCode = err.http_code;
  }

  // Multer-specific error handling
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      err.message = 'File size limit exceeded (maximum 100MB for video, 15MB for image).';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      err.message = 'Unexpected field name. Please upload the file with the field name "file".';
    }
  } else if (err.message && err.message.includes('Invalid file format')) {
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
