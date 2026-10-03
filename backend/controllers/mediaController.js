/**
 * Media Controller
 *
 * Handles HTTP requests and coordinates Cloudinary uploads with MongoDB persistence.
 */

const mongoose = require('mongoose');
const Media = require('../models/Media');
const cloudinaryService = require('../services/cloudinaryService');
const { isCloudinaryConfigured } = require('../config/cloudinary');
const { getDBStatus } = require('../config/database');

const mediaController = {
  /**
   * POST /api/media/upload
   * Phase 2: Uploads image to Cloudinary and persists metadata record to MongoDB Atlas
   */
  uploadMedia: async (req, res, next) => {
    try {
      // 1. Verify file was provided by Multer
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file uploaded. Please attach an image in the "file" field.',
        });
      }

      // 2. Verify Cloudinary credentials are configured
      if (!isCloudinaryConfigured()) {
        return res.status(500).json({
          success: false,
          message:
            'Cloudinary credentials are not configured. Please define CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env',
        });
      }

      // 3. Verify Database connection is active before processing
      if (!getDBStatus()) {
        return res.status(503).json({
          success: false,
          message: 'Database is disconnected. Please ensure MONGODB_URI is configured and connected before uploading.',
        });
      }

      // 4. Upload image buffer to Cloudinary
      const cloudinaryResult = await cloudinaryService.uploadImage(req.file.buffer, {
        original_filename: req.file.originalname,
      });

      // 4b. Phase 7: Build structured metadata and synchronize to Cloudinary
      const builtMetadata = cloudinaryService.buildMetadata({
        resourceType: cloudinaryResult.resource_type || 'image',
        tags: cloudinaryResult.tags || [],
        taggingStatus: cloudinaryResult.taggingStatus || 'unavailable',
        moderationStatus: cloudinaryResult.moderationStatus || 'pending',
      });

      try {
        await cloudinaryService.ensureMetadataFields();
        await cloudinaryService.updateStructuredMetadata(cloudinaryResult.public_id, builtMetadata);
      } catch (metaErr) {
        console.warn('[MediaController] Non-fatal warning syncing metadata to Cloudinary on upload:', metaErr.message);
      }

      // 5. Persist media metadata document to MongoDB Atlas
      let savedMedia;
      try {
        const mediaDoc = new Media({
          publicId: cloudinaryResult.public_id,
          secureUrl: cloudinaryResult.secure_url,
          assetId: cloudinaryResult.asset_id,
          resourceType: cloudinaryResult.resource_type || 'image',
          format: cloudinaryResult.format,
          width: cloudinaryResult.width,
          height: cloudinaryResult.height,
          bytes: cloudinaryResult.bytes,
          originalFilename: cloudinaryResult.original_filename || req.file.originalname,
          folder: cloudinaryResult.folder || 'smartmedia/uploads',
          tags: cloudinaryResult.tags || [],
          taggingStatus: cloudinaryResult.taggingStatus || 'unavailable',
          taggingError: cloudinaryResult.taggingError || null,
          moderationStatus: cloudinaryResult.moderationStatus || 'pending',
          moderationKind: cloudinaryResult.moderationKind || 'aws_rek',
          moderationLabels: cloudinaryResult.moderationLabels || [],
          moderationUpdatedAt: cloudinaryResult.moderationUpdatedAt || new Date(),
          moderationError: cloudinaryResult.moderationError || null,
          metadata: builtMetadata,
        });

        savedMedia = await mediaDoc.save();
      } catch (dbError) {
        console.error('[MediaController DB Error] Failed to persist media record in MongoDB:', dbError.message);
        return res.status(500).json({
          success: false,
          message: 'Media uploaded to Cloudinary, but database persistence failed.',
          cloudinaryAsset: {
            publicId: cloudinaryResult.public_id,
            secureUrl: cloudinaryResult.secure_url,
          },
          error: dbError.message,
        });
      }

      // 6. Return persisted MongoDB media record with Phase 1 compatibility aliases
      return res.status(201).json({
        success: true,
        message: 'Media uploaded successfully',
        media: savedMedia,
        data: savedMedia,
        tags: savedMedia.tags,
        taggingStatus: savedMedia.taggingStatus,
        taggingError: savedMedia.taggingError,
        moderationStatus: savedMedia.moderationStatus,
        moderationKind: savedMedia.moderationKind,
        moderationLabels: savedMedia.moderationLabels,
        metadata: savedMedia.metadata,
        public_id: savedMedia.publicId,
        secure_url: savedMedia.secureUrl,
        width: savedMedia.width,
        height: savedMedia.height,
        format: savedMedia.format,
        resource_type: savedMedia.resourceType,
        bytes: savedMedia.bytes,
        created_at: savedMedia.createdAt,
      });
    } catch (error) {
      console.error('[MediaController Error]:', error);
      next(error);
    }
  },

  /**
   * GET /api/media
   * Phase 2: Retrieve all persisted media records from MongoDB, sorted newest first
   */
  getAllMedia: async (req, res, next) => {
    try {
      if (!getDBStatus()) {
        return res.status(503).json({
          success: false,
          message: 'Database connection unavailable. Please check MONGODB_URI in backend/.env',
        });
      }

      const mediaList = await Media.find().sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: mediaList.length,
        media: mediaList,
      });
    } catch (error) {
      console.error('[MediaController Error] getAllMedia failed:', error);
      next(error);
    }
  },

  /**
   * GET /api/media/:id
   * Phase 2: Retrieve a single media document by its MongoDB ObjectId
   */
  getMediaById: async (req, res, next) => {
    try {
      const { id } = req.params;

      // Validate MongoDB ObjectId format
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: `Invalid media ID format: "${id}". Must be a valid MongoDB ObjectId.`,
        });
      }

      if (!getDBStatus()) {
        return res.status(503).json({
          success: false,
          message: 'Database connection unavailable. Please check MONGODB_URI in backend/.env',
        });
      }

      const media = await Media.findById(id);

      if (!media) {
        return res.status(404).json({
          success: false,
          message: `Media record with ID "${id}" not found.`,
        });
      }

      return res.status(200).json({
        success: true,
        media,
      });
    } catch (error) {
      console.error('[MediaController Error] getMediaById failed:', error);
      next(error);
    }
  },

  /**
   * POST /api/media/:id/analyze
   * Phase 4: Analyze an already-stored Cloudinary asset without downloading or re-uploading
   */
  analyzeMedia: async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: `Invalid media ID format: "${id}". Must be a valid MongoDB ObjectId.`,
        });
      }

      if (!getDBStatus()) {
        return res.status(503).json({
          success: false,
          message: 'Database connection unavailable. Please check MONGODB_URI in backend/.env',
        });
      }

      const media = await Media.findById(id);
      if (!media) {
        return res.status(404).json({
          success: false,
          message: `Media record with ID "${id}" not found.`,
        });
      }

      // Analyze existing asset via Cloudinary Admin API update
      const analysisResult = await cloudinaryService.analyzeImage(media.publicId);

      // Persist extracted tags and status to MongoDB
      media.tags = analysisResult.tags || [];
      media.taggingStatus = analysisResult.taggingStatus;
      media.taggingError = analysisResult.taggingError || null;

      // Phase 7: Refresh and synchronize structured metadata
      const updatedMetadata = cloudinaryService.buildMetadata(media);
      media.metadata = updatedMetadata;
      try {
        await cloudinaryService.updateStructuredMetadata(media.publicId, updatedMetadata);
      } catch (metaErr) {
        console.warn('[MediaController] Metadata sync warning during analyzeMedia:', metaErr.message);
      }

      await media.save();

      if (!analysisResult.success && analysisResult.taggingStatus === 'unavailable') {
        return res.status(422).json({
          success: false,
          taggingStatus: 'unavailable',
          message: analysisResult.message,
          error: analysisResult.taggingError,
          media,
        });
      }

      if (!analysisResult.success) {
        return res.status(500).json({
          success: false,
          taggingStatus: 'failed',
          message: analysisResult.message,
          error: analysisResult.taggingError,
          media,
        });
      }

      return res.status(200).json({
        success: true,
        message: analysisResult.message || 'AI analysis completed successfully.',
        media,
        tags: media.tags,
        taggingStatus: media.taggingStatus,
        metadata: media.metadata,
      });
    } catch (error) {
      console.error('[MediaController Error] analyzeMedia failed:', error);
      next(error);
    }
  },

  /**
   * POST /api/media/:id/moderate
   * Phase 6: Automatic AI Content Moderation for existing/selected media
   * Calls Cloudinary Admin API to evaluate asset with AWS Rekognition Moderation
   */
  moderateMedia: async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: `Invalid media ID format: "${id}". Must be a valid MongoDB ObjectId.`,
        });
      }

      if (!getDBStatus()) {
        return res.status(503).json({
          success: false,
          message: 'Database connection unavailable. Please check MONGODB_URI in backend/.env',
        });
      }

      const media = await Media.findById(id);
      if (!media) {
        return res.status(404).json({
          success: false,
          message: `Media record with ID "${id}" not found.`,
        });
      }

      // Request moderation on existing asset from Cloudinary
      const modResult = await cloudinaryService.moderateImage(media.publicId);

      // Persist normalized moderation state to MongoDB
      media.moderationStatus = modResult.moderationStatus;
      media.moderationKind = modResult.moderationKind;
      media.moderationLabels = modResult.moderationLabels || [];
      media.moderationUpdatedAt = modResult.moderationUpdatedAt || new Date();
      media.moderationError = modResult.moderationError || null;

      // Phase 7: Refresh and synchronize structured metadata
      const updatedMetadata = cloudinaryService.buildMetadata(media);
      media.metadata = updatedMetadata;
      try {
        await cloudinaryService.updateStructuredMetadata(media.publicId, updatedMetadata);
      } catch (metaErr) {
        console.warn('[MediaController] Metadata sync warning during moderateMedia:', metaErr.message);
      }

      await media.save();

      return res.status(200).json({
        success: true,
        message: modResult.message || `Moderation complete: ${media.moderationStatus}`,
        media,
        moderationStatus: media.moderationStatus,
        moderationKind: media.moderationKind,
        moderationLabels: media.moderationLabels,
        metadata: media.metadata,
      });
    } catch (error) {
      console.error('[MediaController Error] moderateMedia failed:', error);
      next(error);
    }
  },

  /**
   * GET /api/media/:id/moderation
   * Phase 6: Fetch/sync latest moderation status from Cloudinary
   */
  getMediaModerationStatus: async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: `Invalid media ID format: "${id}". Must be a valid MongoDB ObjectId.`,
        });
      }

      if (!getDBStatus()) {
        return res.status(503).json({
          success: false,
          message: 'Database connection unavailable. Please check MONGODB_URI in backend/.env',
        });
      }

      const media = await Media.findById(id);
      if (!media) {
        return res.status(404).json({
          success: false,
          message: `Media record with ID "${id}" not found.`,
        });
      }

      // Fetch latest moderation from Cloudinary resource metadata
      const modResult = await cloudinaryService.getModerationStatus(media.publicId);

      if (modResult.success) {
        media.moderationStatus = modResult.moderationStatus;
        media.moderationKind = modResult.moderationKind;
        media.moderationLabels = modResult.moderationLabels || [];
        media.moderationUpdatedAt = modResult.moderationUpdatedAt || new Date();
        media.moderationError = modResult.moderationError || null;
        await media.save();
      }

      return res.status(200).json({
        success: true,
        media,
        moderationStatus: media.moderationStatus,
        moderationKind: media.moderationKind,
        moderationLabels: media.moderationLabels,
      });
    } catch (error) {
      console.error('[MediaController Error] getMediaModerationStatus failed:', error);
      next(error);
    }
  },

  /**
   * PATCH /api/media/:id/metadata
   * Phase 7: Synchronize structured metadata for an existing media asset
   * Derives metadata from media document, ensures Cloudinary fields exist,
   * updates the real Cloudinary asset, and updates the MongoDB record.
   */
  updateMediaMetadata: async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: `Invalid media ID format: "${id}". Must be a valid MongoDB ObjectId.`,
        });
      }

      if (!getDBStatus()) {
        return res.status(503).json({
          success: false,
          message: 'Database connection unavailable. Please check MONGODB_URI in backend/.env',
        });
      }

      const media = await Media.findById(id);
      if (!media) {
        return res.status(404).json({
          success: false,
          message: `Media record with ID "${id}" not found.`,
        });
      }

      // 1. Build normalized metadata using deterministic tag/type/moderation mapping
      const builtMetadata = cloudinaryService.buildMetadata(media);

      // 2. Ensure Cloudinary metadata fields exist before updating
      await cloudinaryService.ensureMetadataFields();

      // 3. Update structured metadata on real Cloudinary asset
      try {
        await cloudinaryService.updateStructuredMetadata(media.publicId, builtMetadata);
      } catch (cldErr) {
        console.error('[MediaController Error] Cloudinary update_metadata failed:', cldErr.message);
        return res.status(502).json({
          success: false,
          message: `Failed to update structured metadata on Cloudinary: ${cldErr.message}`,
        });
      }

      // 4. Update MongoDB record only after Cloudinary succeeds
      media.metadata = builtMetadata;
      await media.save();

      return res.status(200).json({
        success: true,
        message: 'Structured metadata synchronized successfully',
        media,
        metadata: media.metadata,
      });
    } catch (error) {
      console.error('[MediaController Error] updateMediaMetadata failed:', error);
      next(error);
    }
  },

  /**
   * POST /api/media/:id/crop and GET /api/media/:id/crop
   * Phase 8: Content-Aware Smart Cropping
   * Generates a derived Cloudinary transformation URL using c_fill and g_auto.
   * Validates preset against allowlist; does not alter the original asset or database record.
   */
  getSmartCrop: async (req, res, next) => {
    try {
      const { id } = req.params;
      const presetKey = req.body?.preset || req.query?.preset || 'square';

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: `Invalid media ID format: "${id}". Must be a valid MongoDB ObjectId.`,
        });
      }

      if (!getDBStatus()) {
        return res.status(503).json({
          success: false,
          message: 'Database connection unavailable. Please check MONGODB_URI in backend/.env',
        });
      }

      const media = await Media.findById(id);
      if (!media) {
        return res.status(404).json({
          success: false,
          message: `Media record with ID "${id}" not found.`,
        });
      }

      // Validate preset against allowlist
      const normalizedPreset = String(presetKey).toLowerCase().trim();
      const allowedPresets = Object.keys(cloudinaryService.CROP_PRESETS);
      if (!allowedPresets.includes(normalizedPreset)) {
        return res.status(400).json({
          success: false,
          message: `Invalid crop preset "${presetKey}". Allowed presets: ${allowedPresets.join(', ')}`,
          allowedPresets,
        });
      }

      // Generate Cloudinary Content-Aware Smart Crop URL (derived URL, original asset unchanged)
      const cropResult = cloudinaryService.generateSmartCrop(media.publicId, normalizedPreset);

      return res.status(200).json({
        success: true,
        mediaId: media._id,
        publicId: media.publicId,
        originalUrl: media.secureUrl,
        preset: cropResult.preset,
        presetInfo: cropResult.presetInfo,
        url: cropResult.url,
        centerCropUrl: cropResult.centerCropUrl,
      });
    } catch (error) {
      console.error('[MediaController Error] getSmartCrop failed:', error);
      next(error);
    }
  },

  /**
   * POST /api/media/:id/remove-background
   * Phase 9: AI Background Removal
   * Generates a derived transparent PNG URL using Cloudinary's AI background removal engine.
   * Preserves original asset and MongoDB document intact.
   */
  removeBackground: async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: `Invalid media ID format: "${id}". Must be a valid MongoDB ObjectId.`,
        });
      }

      if (!getDBStatus()) {
        return res.status(503).json({
          success: false,
          message: 'Database connection unavailable. Please check MONGODB_URI in backend/.env',
        });
      }

      const media = await Media.findById(id);
      if (!media) {
        return res.status(404).json({
          success: false,
          message: `Media record with ID "${id}" not found.`,
        });
      }

      // Confirm resource type is image
      if (media.resourceType && media.resourceType !== 'image') {
        return res.status(400).json({
          success: false,
          message: 'Background removal is only supported for image assets.',
        });
      }

      // Generate Cloudinary background-removed transformation URL
      const removalResult = cloudinaryService.generateBackgroundRemovalUrl(media.publicId);

      return res.status(200).json({
        success: true,
        mediaId: media._id,
        publicId: media.publicId,
        originalUrl: media.secureUrl,
        backgroundRemovedUrl: removalResult.url,
        format: removalResult.format,
        status: 'completed',
        message: 'Background removed successfully',
      });
    } catch (error) {
      console.error('[MediaController Error] removeBackground failed:', error);
      next(error);
    }
  },

  /**
   * POST /api/media/:id/transform
   * Phase 11: Unified Transformation Studio
   * Generates a derived transformed Cloudinary URL combining:
   * - Preset dimensions & content-aware smart cropping (g_auto, c_fill)
   * - Optional AI background removal (e_background_removal)
   * - Delivery optimization (f_auto + q_auto, or PNG + q_auto when transparent)
   * Preserves original asset and MongoDB document intact.
   */
  transformMedia: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { preset = 'square', removeBackground = false } = req.body || {};

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: `Invalid media ID format: "${id}". Must be a valid MongoDB ObjectId.`,
        });
      }

      if (!getDBStatus()) {
        return res.status(503).json({
          success: false,
          message: 'Database connection unavailable. Please check MONGODB_URI in backend/.env',
        });
      }

      const media = await Media.findById(id);
      if (!media) {
        return res.status(404).json({
          success: false,
          message: `Media record with ID "${id}" not found.`,
        });
      }

      // Confirm resource type is image
      if (media.resourceType && media.resourceType !== 'image') {
        return res.status(400).json({
          success: false,
          message: 'Transformation studio is only supported for image assets.',
        });
      }

      // Validate preset against allowlist
      const cleanPreset = String(preset || 'square').toLowerCase();
      if (!cloudinaryService.CROP_PRESETS[cleanPreset]) {
        return res.status(400).json({
          success: false,
          message: `Invalid preset "${preset}". Allowed presets: ${Object.keys(
            cloudinaryService.CROP_PRESETS
          ).join(', ')}`,
        });
      }

      const isBgRemoval = Boolean(removeBackground);

      // Generate unified transformation URL via cloudinaryService
      const transformResult = cloudinaryService.generateUnifiedTransformation(media.publicId, {
        preset: cleanPreset,
        removeBackground: isBgRemoval,
      });

      return res.status(200).json({
        success: true,
        mediaId: media._id,
        publicId: media.publicId,
        originalUrl: media.secureUrl,
        preset: cleanPreset,
        presetInfo: transformResult.presetInfo,
        removeBackground: isBgRemoval,
        transformedUrl: transformResult.url,
        format: transformResult.format,
        status: 'completed',
        message: 'Transformation generated successfully',
      });
    } catch (error) {
      console.error('[MediaController Error] transformMedia failed:', error);
      next(error);
    }
  },

  /**
   * GET /api/media/search?q=<query>
   * Phase 5: Intelligent Media Search
   * Queries Cloudinary Search API across AI tags, filename, and public ID,
   * then maps matching Cloudinary assets back to existing MongoDB Media records.
   */
  searchMedia: async (req, res, next) => {
    try {
      const rawQuery = req.query.q;

      // Handle missing, empty, or whitespace-only queries gracefully
      if (rawQuery === undefined || rawQuery === null) {
        return res.status(200).json({
          success: true,
          query: '',
          count: 0,
          media: [],
        });
      }

      const cleanQuery = String(rawQuery).trim().slice(0, 100);

      if (!cleanQuery) {
        return res.status(200).json({
          success: true,
          query: '',
          count: 0,
          media: [],
        });
      }

      // Verify Cloudinary credentials are configured
      if (!isCloudinaryConfigured()) {
        return res.status(500).json({
          success: false,
          message: 'Cloudinary credentials are not configured.',
        });
      }

      // Verify Database connection
      if (!getDBStatus()) {
        return res.status(503).json({
          success: false,
          message: 'Database connection unavailable. Please check MONGODB_URI in backend/.env',
        });
      }

      // 1. Execute Cloudinary Search API
      const searchResult = await cloudinaryService.searchMedia(cleanQuery);
      const resources = searchResult.resources || [];

      if (resources.length === 0) {
        return res.status(200).json({
          success: true,
          query: cleanQuery,
          count: 0,
          media: [],
        });
      }

      // 2. Extract Cloudinary public_ids
      const publicIds = resources.map((r) => r.public_id).filter(Boolean);

      // 3. Map Cloudinary public_ids to existing MongoDB Media documents
      const mongoDocs = await Media.find({ publicId: { $in: publicIds } });

      // 4. Preserve Cloudinary Search result ordering
      const mediaMap = new Map(mongoDocs.map((doc) => [doc.publicId, doc]));
      const orderedMedia = publicIds
        .map((publicId) => mediaMap.get(publicId))
        .filter(Boolean);

      return res.status(200).json({
        success: true,
        query: cleanQuery,
        count: orderedMedia.length,
        media: orderedMedia,
      });
    } catch (error) {
      console.error('[MediaController Error] searchMedia failed:', error.message || error);
      return res.status(500).json({
        success: false,
        message: 'Unable to search media. Please try again later.',
        query: req.query.q ? String(req.query.q).trim() : '',
      });
    }
  },

  /**
   * DELETE /api/media/:id
   */
  deleteMedia: async (req, res, next) => {
    try {
      res.status(501).json({
        success: false,
        message: 'Media delete endpoint placeholder.',
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = mediaController;
