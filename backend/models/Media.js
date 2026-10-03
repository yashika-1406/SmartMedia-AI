/**
 * Media Model
 *
 * Mongoose schema for storing media metadata in MongoDB Atlas.
 * Actual image and video binaries are stored in Cloudinary;
 * MongoDB stores the asset identifiers, dimensions, and operational metadata.
 */

const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      required: [true, 'publicId is required'],
      unique: true,
      trim: true,
    },
    secureUrl: {
      type: String,
      required: [true, 'secureUrl is required'],
      trim: true,
    },
    assetId: {
      type: String,
      trim: true,
    },
    resourceType: {
      type: String,
      required: [true, 'resourceType is required'],
      default: 'image',
      trim: true,
    },
    format: {
      type: String,
      trim: true,
    },
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
    bytes: {
      type: Number,
    },
    originalFilename: {
      type: String,
      trim: true,
    },
    folder: {
      type: String,
      default: 'smartmedia/uploads',
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    taggingStatus: {
      type: String,
      enum: ['completed', 'failed', 'unavailable'],
      default: 'unavailable',
    },
    taggingError: {
      type: String,
      default: null,
    },
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'flagged', 'rejected', 'failed', 'unavailable'],
      default: 'pending',
    },
    moderationKind: {
      type: String,
      default: null,
      trim: true,
    },
    moderationLabels: [
      {
        label: { type: String, trim: true },
        confidence: { type: Number },
      },
    ],
    moderationUpdatedAt: {
      type: Date,
      default: null,
    },
    moderationError: {
      type: String,
      default: null,
    },
    metadata: {
      category: {
        type: String,
        default: 'General',
        trim: true,
      },
      contentType: {
        type: String,
        default: 'image',
        trim: true,
      },
      approvalStatus: {
        type: String,
        default: 'Pending',
        trim: true,
      },
      aiProcessed: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

const Media = mongoose.models.Media || mongoose.model('Media', mediaSchema);

module.exports = Media;
