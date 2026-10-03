/**
 * Cloudinary SDK Configuration
 *
 * Configures Cloudinary using environment variables.
 * Credentials must remain strictly on the backend.
 */

const cloudinary = require('cloudinary').v2;

const isCloudinaryConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

const configureCloudinary = () => {
  if (!isCloudinaryConfigured()) {
    console.warn(
      '[Cloudinary] Warning: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET is missing. Please set these in backend/.env'
    );
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  return cloudinary;
};

module.exports = {
  cloudinary,
  configureCloudinary,
  isCloudinaryConfigured,
};
