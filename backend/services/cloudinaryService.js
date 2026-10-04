/**
 * Cloudinary Service Layer
 *
 * Centralized service for interacting with Cloudinary API:
 * - Media Upload (Phase 1)
 * - AI Auto-Tagging (Phase 4)
 * - Search API (Phase 5)
 * - Content Moderation (Phase 7)
 * - Smart Crop & Background Removal (Phase 8-9)
 * - Image Transformations (Phase 10)
 * - Optimized Delivery (Phase 11)
 */

const { Readable } = require('stream');
const { cloudinary } = require('../config/cloudinary');

/**
 * Normalizes raw Cloudinary moderation array into our application format
 *
 * @param {Array} moderationArray - Cloudinary resource.moderation array
 * @returns {Object} { moderationStatus, moderationKind, moderationLabels, moderationUpdatedAt, moderationError }
 */
const extractModerationData = (moderationArray) => {
  if (!Array.isArray(moderationArray) || moderationArray.length === 0) {
    return {
      moderationStatus: 'pending',
      moderationKind: 'aws_rek',
      moderationLabels: [],
      moderationUpdatedAt: new Date(),
      moderationError: null,
    };
  }

  // Find aws_rek or first available moderation record
  const entry = moderationArray.find((m) => m.kind === 'aws_rek') || moderationArray[0];
  const rawStatus = (entry.status || '').toLowerCase();

  let moderationStatus = 'pending';
  if (rawStatus === 'approved') moderationStatus = 'approved';
  else if (rawStatus === 'rejected') moderationStatus = 'rejected';
  else if (rawStatus === 'flagged') moderationStatus = 'flagged';
  else if (rawStatus === 'failed') moderationStatus = 'failed';
  else if (rawStatus === 'pending') moderationStatus = 'pending';

  // Normalize labels if provided in the response
  const rawLabels =
    entry.response?.moderation_labels ||
    entry.response?.ModerationLabels ||
    [];
  const moderationLabels = Array.isArray(rawLabels)
    ? rawLabels.map((lbl) => ({
        label: lbl.label || lbl.Name || lbl.name || 'Unspecified',
        confidence:
          typeof lbl.confidence === 'number'
            ? lbl.confidence
            : typeof lbl.Confidence === 'number'
            ? lbl.Confidence
            : null,
      }))
    : [];

  return {
    moderationStatus,
    moderationKind: entry.kind || 'aws_rek',
    moderationLabels,
    moderationUpdatedAt: entry.updated_at ? new Date(entry.updated_at) : new Date(),
    moderationError: null,
  };
};

const cloudinaryService = {
  /**
   * Upload an image buffer to Cloudinary using upload_stream
   * Includes AI Auto-Tagging (Phase 4) and Content Moderation (Phase 6)
   * Stored in the logical folder 'smartmedia/uploads'
   *
   * @param {Buffer} buffer - File buffer from Multer memory storage
   * @param {Object} [options={}] - Optional upload parameters
   * @returns {Promise<Object>} Cloudinary API result with extracted tags and moderationData
   */
  uploadImage: async (buffer, options = {}) => {
    const baseUploadOptions = {
      folder: 'smartmedia/uploads',
      resource_type: 'image',
      use_filename: true,
      unique_filename: true,
      ...options,
    };

    const streamUploader = (opts) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          opts,
          (error, result) => {
            if (error) {
              return reject(error);
            }
            resolve(result);
          }
        );

        const readable = Readable.from(buffer);
        readable.pipe(uploadStream);
      });
    };

    // 1. Attempt upload with both Cloudinary AI auto-tagging (confidence 0.6) and AWS Rekognition Moderation
    try {
      const result = await streamUploader({
        ...baseUploadOptions,
        categorization: 'google_tagging',
        auto_tagging: 0.6,
        moderation: 'aws_rek',
      });

      const tags = Array.isArray(result.tags) ? result.tags : [];
      const moderationData = extractModerationData(result.moderation);
      return {
        ...result,
        tags,
        taggingStatus: 'completed',
        taggingError: null,
        ...moderationData,
      };
    } catch (primaryError) {
      const errMessage = primaryError.message || primaryError.error?.message || '';
      const isAddonUnavailable =
        primaryError.http_code === 420 ||
        primaryError.error?.http_code === 420 ||
        errMessage.toLowerCase().includes('subscription') ||
        errMessage.toLowerCase().includes('google auto tagging');

      if (isAddonUnavailable) {
        console.warn(
          '[Cloudinary AI Tagging] Google Auto Tagging add-on not active (HTTP 420). Preserving upload with moderation only.'
        );
        try {
          const fallbackResult = await streamUploader({
            ...baseUploadOptions,
            moderation: 'aws_rek',
          });
          const moderationData = extractModerationData(fallbackResult.moderation);
          return {
            ...fallbackResult,
            tags: [],
            taggingStatus: 'unavailable',
            taggingError:
              'Google Auto Tagging add-on is not active. Enable the free tier in Cloudinary Console under Settings > Add-ons.',
            ...moderationData,
          };
        } catch (modFallbackError) {
          // If moderation also failed (e.g. resolution < 80px), upload without add-ons
          const bareResult = await streamUploader(baseUploadOptions);
          return {
            ...bareResult,
            tags: [],
            taggingStatus: 'unavailable',
            taggingError:
              'Google Auto Tagging add-on is not active. Enable the free tier in Cloudinary Console under Settings > Add-ons.',
            moderationStatus: 'failed',
            moderationKind: 'aws_rek',
            moderationLabels: [],
            moderationUpdatedAt: new Date(),
            moderationError: modFallbackError.message || 'Moderation unavailable for this asset.',
          };
        }
      }

      // If error is specific to moderation (e.g. image < 80x80 pixels), retry without moderation
      if (errMessage.toLowerCase().includes('moderation') || errMessage.toLowerCase().includes('resolution for aws_rek')) {
        console.warn(`[Cloudinary Moderation] Moderation requirement failed: ${errMessage}. Uploading with tagging only.`);
        try {
          const taggingOnlyResult = await streamUploader({
            ...baseUploadOptions,
            categorization: 'google_tagging',
            auto_tagging: 0.6,
          });
          const tags = Array.isArray(taggingOnlyResult.tags) ? taggingOnlyResult.tags : [];
          return {
            ...taggingOnlyResult,
            tags,
            taggingStatus: 'completed',
            taggingError: null,
            moderationStatus: 'failed',
            moderationKind: 'aws_rek',
            moderationLabels: [],
            moderationUpdatedAt: new Date(),
            moderationError: errMessage,
          };
        } catch (subErr) {
          // Fallback to bare upload
          const bareResult = await streamUploader(baseUploadOptions);
          return {
            ...bareResult,
            tags: [],
            taggingStatus: 'failed',
            taggingError: subErr.message,
            moderationStatus: 'failed',
            moderationKind: 'aws_rek',
            moderationLabels: [],
            moderationUpdatedAt: new Date(),
            moderationError: errMessage,
          };
        }
      }

      // If it is another upload error, rethrow
      throw primaryError;
    }
  },

  /**
   * Phase 12: Unified upload method for image and video media
   *
   * @param {Buffer} buffer - File buffer from Multer memory storage
   * @param {Object} [options={}] - Upload options including resourceType and originalFilename
   * @returns {Promise<Object>} Cloudinary API result
   */
  uploadMedia: async (buffer, options = {}) => {
    const resourceType = options.resourceType === 'video' ? 'video' : 'image';
    if (resourceType === 'video') {
      return cloudinaryService.uploadVideo(buffer, options);
    }
    return cloudinaryService.uploadImage(buffer, options);
  },

  /**
   * Phase 12: Upload a video buffer to Cloudinary using upload_stream
   * Uses resource_type: 'video'
   * Stored in the logical folder 'smartmedia/uploads'
   *
   * @param {Buffer} buffer - File buffer from Multer memory storage
   * @param {Object} [options={}] - Optional upload parameters
   * @returns {Promise<Object>} Cloudinary API result with video metadata
   */
  uploadVideo: async (buffer, options = {}) => {
    const baseUploadOptions = {
      folder: 'smartmedia/uploads',
      resource_type: 'video',
      use_filename: true,
      unique_filename: true,
      ...options,
    };

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        baseUploadOptions,
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve({
            ...result,
            resource_type: 'video',
            duration: typeof result.duration === 'number' ? result.duration : null,
            frame_rate: typeof result.frame_rate === 'number' ? result.frame_rate : null,
            video_codec: result.video?.codec || result.video_codec || null,
            audio_codec: result.audio?.codec || result.audio_codec || null,
            tags: Array.isArray(result.tags) ? result.tags : [],
            taggingStatus: 'unavailable',
            moderationStatus: 'approved',
          });
        }
      );

      const readable = Readable.from(buffer);
      readable.pipe(uploadStream);
    });
  },

  /**
   * Analyze an already-stored Cloudinary asset using Admin API update
   * Without downloading or re-uploading the media binary
   *
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<Object>} Result containing tags and taggingStatus
   */
  analyzeImage: async (publicId) => {
    try {
      const result = await cloudinary.api.update(publicId, {
        categorization: 'google_tagging',
        auto_tagging: 0.6,
      });

      const tags = Array.isArray(result.tags) ? result.tags : [];
      return {
        success: true,
        tags,
        taggingStatus: 'completed',
        taggingError: null,
        message: `Successfully analyzed asset. ${tags.length} tag(s) assigned.`,
        data: result,
      };
    } catch (error) {
      const errMessage = error.error?.message || error.message || '';
      const isAddonUnavailable =
        error.error?.http_code === 420 ||
        error.http_code === 420 ||
        errMessage.toLowerCase().includes('subscription') ||
        errMessage.toLowerCase().includes('google auto tagging');

      if (isAddonUnavailable) {
        return {
          success: false,
          tags: [],
          taggingStatus: 'unavailable',
          taggingError:
            'Google Auto Tagging add-on is not active on this Cloudinary cloud. Activate the free tier in Cloudinary Console under Settings > Add-ons to auto-tag assets.',
          message:
            'Cloudinary AI tagging is unavailable: Google Auto Tagging add-on is not subscribed. Please enable the free add-on in Cloudinary Console (Settings > Add-ons).',
        };
      }

      return {
        success: false,
        tags: [],
        taggingStatus: 'failed',
        taggingError: errMessage,
        message: `Cloudinary analysis failed: ${errMessage}`,
      };
    }
  },

  /**
   * Request content moderation on an already stored Cloudinary asset
   * Uses Admin API update without re-uploading the media binary
   *
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<Object>} Result containing moderation status and details
   */
  moderateImage: async (publicId) => {
    try {
      // Use uploader.explicit for inline synchronous moderation on existing asset
      let result;
      try {
        result = await cloudinary.uploader.explicit(publicId, {
          type: 'upload',
          moderation: 'aws_rek',
        });
      } catch (expErr) {
        // Fallback to api.update if explicit encounters any restriction
        result = await cloudinary.api.update(publicId, {
          moderation: 'aws_rek',
        });
      }

      const moderationData = extractModerationData(result.moderation);
      return {
        success: true,
        ...moderationData,
        message: `Cloudinary AI moderation complete: ${moderationData.moderationStatus}.`,
        data: result,
      };
    } catch (error) {
      const errMessage = error.error?.message || error.message || '';
      console.error('[Cloudinary Moderation Error]:', errMessage);
      return {
        success: false,
        moderationStatus: 'failed',
        moderationKind: 'aws_rek',
        moderationLabels: [],
        moderationUpdatedAt: new Date(),
        moderationError: errMessage,
        message: `Cloudinary moderation failed: ${errMessage}`,
      };
    }
  },

  /**
   * Fetch current moderation status from Cloudinary resource metadata
   *
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<Object>} Latest moderation status
   */
  getModerationStatus: async (publicId) => {
    try {
      const result = await cloudinary.api.resource(publicId, {
        moderation: true,
      });

      const moderationData = extractModerationData(result.moderation);
      return {
        success: true,
        ...moderationData,
        data: result,
      };
    } catch (error) {
      const errMessage = error.error?.message || error.message || '';
      return {
        success: false,
        moderationStatus: 'failed',
        moderationKind: 'aws_rek',
        moderationLabels: [],
        moderationUpdatedAt: new Date(),
        moderationError: errMessage,
      };
    }
  },

  /**
   * Search media assets using Cloudinary Search API
   * Searches tags, original filename, and public ID
   *
   * @param {string} query - Validated search query
   * @param {Object} [options={}] - Search options (max_results, etc.)
   * @returns {Promise<{ resources: Array, total_count: number }>}
   */
  searchMedia: async (query, options = {}) => {
    if (!query || typeof query !== 'string' || !query.trim()) {
      return { resources: [], total_count: 0 };
    }

    const cleanQ = query.trim().slice(0, 100);
    // Sanitize query by removing characters that would break Lucene / Cloudinary search expressions
    const sanitized = cleanQ
      .replace(/[:*?^~()[\]{}"'\\\/<>!|&+]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!sanitized) {
      return { resources: [], total_count: 0 };
    }

    // Build Cloudinary search expression focusing on AI tags, filename, and public ID
    let expression;
    if (sanitized.includes(' ')) {
      const words = sanitized.split(' ').filter(Boolean);
      const tagClauses = words.map((w) => `tags:${w}*`).join(' OR ');
      expression = `tags:"${sanitized}" OR (${tagClauses}) OR "${sanitized}"`;
    } else {
      expression = `tags:${sanitized}* OR filename:${sanitized}* OR public_id:${sanitized}* OR ${sanitized}`;
    }

    const maxResults = Math.min(Number(options.max_results) || 50, 100);

    const result = await cloudinary.search
      .expression(expression)
      .with_field('tags')
      .max_results(maxResults)
      .execute();

    return {
      resources: result.resources || [],
      total_count: result.total_count || 0,
      next_cursor: result.next_cursor || null,
    };
  },

  getOptimizedUrl: (publicId, transformations = {}) => {
    return cloudinary.url(publicId, {
      fetch_format: 'auto',
      quality: 'auto',
      ...transformations,
    });
  },

  deleteMedia: async (publicId, resourceType = 'image') => {
    return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  },

  /**
   * Deterministic category mapping based on AI tags
   * Priority: Fashion > Animals > Technology > Food > People > Outdoor > General
   */
  buildMetadata: (media = {}) => {
    const tags = Array.isArray(media.tags) ? media.tags.map((t) => String(t).toLowerCase()) : [];

    const CATEGORY_RULES = [
      {
        category: 'Fashion',
        keywords: [
          'blazer',
          'coat',
          'shirt',
          'dress',
          'clothing',
          'fashion',
          'jacket',
          'suit',
          'jeans',
          'trousers',
          'skirt',
          'apparel',
          'necktie',
          'footwear',
          'shoe',
        ],
      },
      {
        category: 'Animals',
        keywords: [
          'dog',
          'cat',
          'animal',
          'bird',
          'pet',
          'canine',
          'canidae',
          'carnivores',
          'puppy',
          'kitten',
          'wildlife',
          'golden retriever',
        ],
      },
      {
        category: 'Technology',
        keywords: [
          'laptop',
          'computer',
          'phone',
          'electronics',
          'technology',
          'gadget',
          'screen',
          'keyboard',
          'electronic device',
          'personal computer',
          'hardware',
          'display device',
        ],
      },
      {
        category: 'Food',
        keywords: [
          'food',
          'meal',
          'dish',
          'plate',
          'fruit',
          'vegetable',
          'coffee',
          'beverage',
          'cuisine',
          'lunch',
          'dinner',
          'breakfast',
        ],
      },
      {
        category: 'People',
        keywords: [
          'person',
          'people',
          'man',
          'woman',
          'portrait',
          'child',
          'crowd',
          'face',
          'human',
        ],
      },
      {
        category: 'Outdoor',
        keywords: [
          'outdoor',
          'nature',
          'tree',
          'grass',
          'road',
          'sky',
          'mountain',
          'landscape',
          'water',
          'plant',
          'forest',
        ],
      },
    ];

    let category = 'General';
    for (const rule of CATEGORY_RULES) {
      const match = rule.keywords.some((kw) =>
        tags.some((tag) => {
          if (tag === kw) return true;
          const words = tag.split(/[\s_-]+/);
          return words.includes(kw);
        })
      );
      if (match) {
        category = rule.category;
        break;
      }
    }

    // Determine approval status
    const modStatus = (media.moderationStatus || '').toLowerCase();
    let approvalStatus = 'Pending';
    if (modStatus === 'approved') approvalStatus = 'Approved';
    else if (modStatus === 'flagged') approvalStatus = 'Flagged';
    else if (modStatus === 'rejected') approvalStatus = 'Rejected';
    else if (modStatus === 'failed') approvalStatus = 'Failed';

    // Content type
    const contentType = media.resourceType || 'image';

    // AI Processed
    const aiProcessed = media.taggingStatus === 'completed';

    return {
      category,
      contentType,
      approvalStatus,
      aiProcessed,
    };
  },

  /**
   * Idempotently ensure that required Cloudinary structured metadata fields exist
   * Creates missing fields via Admin API
   */
  ensureMetadataFields: async () => {
    try {
      const existing = await cloudinary.api.list_metadata_fields();
      const existingIds = new Set((existing.metadata_fields || []).map((f) => f.external_id));

      const requiredFields = [
        { external_id: 'category', label: 'Category', type: 'string' },
        { external_id: 'content_type', label: 'Content Type', type: 'string' },
        { external_id: 'approval_status', label: 'Approval Status', type: 'string' },
        { external_id: 'ai_processed', label: 'AI Processed', type: 'string' },
      ];

      for (const field of requiredFields) {
        if (!existingIds.has(field.external_id)) {
          console.log(`[Cloudinary Metadata] Initializing field: ${field.external_id}`);
          try {
            await cloudinary.api.add_metadata_field(field);
          } catch (createErr) {
            // Ignore if field was created concurrently
            if (!createErr.message?.includes('already exists') && createErr.http_code !== 409) {
              console.warn(`[Cloudinary Metadata] Warning creating ${field.external_id}:`, createErr.message);
            }
          }
        }
      }
      return { success: true };
    } catch (error) {
      console.warn('[Cloudinary Metadata] Warning during ensureMetadataFields:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update structured metadata on a real Cloudinary asset
   *
   * @param {string} publicId - Cloudinary public ID
   * @param {Object} metadata - Normalized application metadata
   * @returns {Promise<Object>} Cloudinary API response
   */
  updateStructuredMetadata: async (publicId, metadata = {}) => {
    if (!publicId) {
      throw new Error('publicId is required to update structured metadata');
    }

    const cldMetadata = {
      category: metadata.category || 'General',
      content_type: metadata.contentType || 'image',
      approval_status: metadata.approvalStatus || 'Pending',
      ai_processed: metadata.aiProcessed ? 'true' : 'false',
    };

    try {
      const result = await cloudinary.uploader.update_metadata(cldMetadata, [publicId]);
      return {
        success: true,
        cldMetadata,
        result,
      };
    } catch (error) {
      console.error(`[Cloudinary Metadata Error] Failed to update metadata for ${publicId}:`, error.message);
      throw error;
    }
  },

  /**
   * Phase 8: Content-Aware Smart Crop Presets
   */
  CROP_PRESETS: {
    square: {
      name: 'Square',
      aspectRatio: '1:1',
      width: 800,
      height: 800,
      description: 'Profile & Social Feed',
    },
    portrait: {
      name: 'Portrait',
      aspectRatio: '4:5',
      width: 800,
      height: 1000,
      description: 'Portrait & Feed Post',
    },
    story: {
      name: 'Story',
      aspectRatio: '9:16',
      width: 720,
      height: 1280,
      description: 'Story, Reels & Mobile',
    },
    landscape: {
      name: 'Landscape',
      aspectRatio: '16:9',
      width: 1280,
      height: 720,
      description: 'Banner & Desktop Header',
    },
    thumbnail: {
      name: 'Thumbnail',
      aspectRatio: '1:1',
      width: 400,
      height: 400,
      description: 'Compact Preview & Avatar',
    },
  },

  /**
   * Generates a derived Content-Aware Smart Crop URL for a Cloudinary asset
   * Uses c_fill and g_auto (automatic content-aware gravity)
   * Also generates a standard center-crop URL (g_center) for comparison
   *
   * @param {string} publicId - Cloudinary asset public ID
   * @param {string} presetKey - Preset identifier
   * @returns {Object} { preset, presetInfo, url, centerCropUrl }
   */
  generateSmartCrop: (publicId, presetKey = 'square') => {
    const key = String(presetKey || 'square').toLowerCase();
    const preset = cloudinaryService.CROP_PRESETS[key];
    if (!preset) {
      throw new Error(
        `Invalid crop preset "${presetKey}". Allowed presets: ${Object.keys(
          cloudinaryService.CROP_PRESETS
        ).join(', ')}`
      );
    }

    // Generate AI Content-Aware Smart Crop URL using g_auto and c_fill chained with f_auto and q_auto
    const smartCropUrl = cloudinary.url(publicId, {
      transformation: [
        {
          crop: 'fill',
          gravity: 'auto',
          width: preset.width,
          height: preset.height,
        },
        { fetch_format: 'auto' },
        { quality: 'auto' },
      ],
      secure: true,
    });

    // Generate comparison Center Crop URL using g_center and c_fill chained with f_auto and q_auto
    const centerCropUrl = cloudinary.url(publicId, {
      transformation: [
        {
          crop: 'fill',
          gravity: 'center',
          width: preset.width,
          height: preset.height,
        },
        { fetch_format: 'auto' },
        { quality: 'auto' },
      ],
      secure: true,
    });

    return {
      preset: key,
      presetInfo: preset,
      url: smartCropUrl,
      centerCropUrl,
    };
  },

  /**
   * Phase 9: AI Background Removal (Phase 10 Optimized)
   * Generates a derived transparent PNG delivery URL using Cloudinary AI Background Removal
   * with q_auto compression while safeguarding alpha-channel transparency.
   *
   * @param {string} publicId - Cloudinary asset public ID
   * @returns {Object} { publicId, format: 'png', url: string }
   */
  generateBackgroundRemovalUrl: (publicId) => {
    if (!publicId) {
      throw new Error('publicId is required for background removal');
    }

    const backgroundRemovedUrl = cloudinary.url(publicId, {
      format: 'png',
      transformation: [
        { effect: 'background_removal' },
        { quality: 'auto' },
      ],
      secure: true,
    });

    return {
      publicId,
      format: 'png',
      url: backgroundRemovedUrl,
    };
  },

  /**
   * Phase 11: Unified Transformation Studio
   * Combines Content-Aware Smart Crop, optional AI Background Removal, and Optimized Delivery
   *
   * @param {string} publicId - Cloudinary asset public ID
   * @param {Object} options
   * @param {string} [options.preset='square'] - Preset key from CROP_PRESETS
   * @param {boolean} [options.removeBackground=false] - Whether to apply AI background removal
   * @returns {Object} { preset, presetInfo, removeBackground, format, url }
   */
  generateUnifiedTransformation: (publicId, options = {}) => {
    if (!publicId) {
      throw new Error('publicId is required for transformation');
    }

    const presetKey = String(options.preset || 'square').toLowerCase();
    const preset = cloudinaryService.CROP_PRESETS[presetKey];
    if (!preset) {
      throw new Error(
        `Invalid preset "${presetKey}". Allowed presets: ${Object.keys(
          cloudinaryService.CROP_PRESETS
        ).join(', ')}`
      );
    }

    const removeBackground = Boolean(options.removeBackground);
    const transformations = [];

    // 1. Optional Background Removal (Phase 9)
    if (removeBackground) {
      transformations.push({ effect: 'background_removal' });
    }

    // 2. Content-Aware Smart Cropping with automatic gravity (Phase 8)
    transformations.push({
      crop: 'fill',
      gravity: 'auto',
      width: preset.width,
      height: preset.height,
    });

    // 3. Delivery Optimization (Phase 10)
    // If background removal is active, output as png to preserve alpha transparency with q_auto
    // Otherwise, apply f_auto and q_auto
    if (removeBackground) {
      transformations.push({ quality: 'auto' });
      const url = cloudinary.url(publicId, {
        format: 'png',
        transformation: transformations,
        secure: true,
      });

      return {
        preset: presetKey,
        presetInfo: preset,
        removeBackground: true,
        format: 'png',
        url,
      };
    } else {
      transformations.push({ fetch_format: 'auto' });
      transformations.push({ quality: 'auto' });

      const url = cloudinary.url(publicId, {
        transformation: transformations,
        secure: true,
      });

      return {
        preset: presetKey,
        presetInfo: preset,
        removeBackground: false,
        format: 'auto',
        url,
      };
    }
  },

  /**
   * Phase 12: Video Transformation Presets Allowlist
   */
  VIDEO_PRESETS: {
    web_optimized: {
      name: 'Web Optimized',
      description: 'Optimized delivery for streaming and web browsers',
      transformation: [
        { fetch_format: 'auto' },
        { quality: 'auto' },
      ],
    },
    social_square: {
      name: 'Social Square',
      aspectRatio: '1:1',
      width: 720,
      height: 720,
      description: 'Square 1:1 post format for social feeds',
      transformation: [
        { crop: 'fill', width: 720, height: 720, aspect_ratio: '1:1' },
        { fetch_format: 'auto' },
        { quality: 'auto' },
      ],
    },
    portrait_reel: {
      name: 'Portrait Reel',
      aspectRatio: '9:16',
      width: 720,
      height: 1280,
      description: 'Vertical 9:16 format for Reels, Shorts & Stories',
      transformation: [
        { crop: 'fill', width: 720, height: 1280, aspect_ratio: '9:16' },
        { fetch_format: 'auto' },
        { quality: 'auto' },
      ],
    },
    landscape_hd: {
      name: 'Landscape HD',
      aspectRatio: '16:9',
      width: 1280,
      height: 720,
      description: 'Standard 16:9 HD widescreen display',
      transformation: [
        { crop: 'fill', width: 1280, height: 720, aspect_ratio: '16:9' },
        { fetch_format: 'auto' },
        { quality: 'auto' },
      ],
    },
    preview_clip: {
      name: 'Preview Clip',
      description: 'Short 6-second teaser preview',
      transformation: [
        { start_offset: '0', duration: '6' },
        { fetch_format: 'auto' },
        { quality: 'auto' },
      ],
    },
  },

  /**
   * Phase 12: Generates a derived video transformation URL
   *
   * @param {string} publicId - Cloudinary asset public ID
   * @param {string} presetKey - One of allowlisted VIDEO_PRESETS
   * @returns {Object} { preset, presetInfo, url, format }
   */
  generateVideoTransformation: (publicId, presetKey = 'web_optimized') => {
    if (!publicId) {
      throw new Error('publicId is required for video transformation');
    }

    const key = String(presetKey || 'web_optimized').toLowerCase();
    const preset = cloudinaryService.VIDEO_PRESETS[key];
    if (!preset) {
      throw new Error(
        `Invalid video preset "${presetKey}". Allowed presets: ${Object.keys(
          cloudinaryService.VIDEO_PRESETS
        ).join(', ')}`
      );
    }

    const url = cloudinary.url(publicId, {
      resource_type: 'video',
      transformation: preset.transformation,
      secure: true,
    });

    return {
      preset: key,
      presetInfo: preset,
      url,
      format: 'auto',
    };
  },

  /**
   * Phase 12: Generates a Cloudinary video frame thumbnail / poster URL
   *
   * @param {string} publicId - Cloudinary video asset public ID
   * @param {Object} [options={}] - Options like width, crop
   * @returns {string} Cloudinary image URL for video poster frame
   */
  getVideoThumbnail: (publicId, options = {}) => {
    if (!publicId) return '';
    const width = options.width || 600;
    return cloudinary.url(publicId, {
      resource_type: 'video',
      format: 'jpg',
      transformation: [
        { crop: options.crop || 'limit', width, start_offset: options.start_offset || '0' },
        { quality: 'auto' },
      ],
      secure: true,
    });
  },
};

module.exports = cloudinaryService;
