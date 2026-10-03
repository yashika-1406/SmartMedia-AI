/**
 * Media Routes
 *
 * Defines API endpoints for media management.
 * Routes remain lightweight and delegate directly to mediaController.
 */

const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const upload = require('../middleware/uploadMiddleware');

// Media upload endpoint (Phase 1)
router.post('/upload', upload.single('file'), mediaController.uploadMedia);

// Media listing and search endpoints (Phase 3 & 5)
router.get('/', mediaController.getAllMedia);
router.get('/search', mediaController.searchMedia);
router.get('/:id', mediaController.getMediaById);
router.get('/:id/moderation', mediaController.getMediaModerationStatus);
router.post('/:id/analyze', mediaController.analyzeMedia);
router.post('/:id/moderate', mediaController.moderateMedia);
router.patch('/:id/metadata', mediaController.updateMediaMetadata);
router.post('/:id/crop', mediaController.getSmartCrop);
router.get('/:id/crop', mediaController.getSmartCrop);
router.post('/:id/remove-background', mediaController.removeBackground);
router.post('/:id/transform', mediaController.transformMedia);
router.delete('/:id', mediaController.deleteMedia);

module.exports = router;
