/**
 * Central API Service
 *
 * Configures Axios instance for all frontend-to-backend communication.
 */

import axios from 'axios';

const rawBaseURL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  !window.location.hostname.includes('127.0.0.1')
    ? 'https://smartmedia-ai.onrender.com/api'
    : 'http://localhost:5000/api');

const baseURL = rawBaseURL.replace(/\/+$/, '');

const api = axios.create({
  baseURL,
  timeout: 60000,
});

// Centralized error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message =
      error.response?.data?.message || error.message || 'An unexpected error occurred';
    
    if (
      error.message === 'Network Error' &&
      baseURL.includes('localhost') &&
      typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost'
    ) {
      message =
        'Backend connection failed: The frontend is deployed but pointing to localhost:5000. Set VITE_API_URL in Vercel to your deployed backend URL.';
    }

    console.error('[API Error]:', message);
    return Promise.reject(new Error(message));
  }
);

/**
 * Upload a media asset (image or video) to the backend, which forwards to Cloudinary
 * @param {File} file - Selected browser File object
 * @param {Function} [onUploadProgress] - Optional callback receiving percent completed (0-100)
 * @returns {Promise<Object>} API response data containing Cloudinary asset metadata
 */
export const uploadMedia = async (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/media/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onUploadProgress(percentCompleted);
      }
    },
  });

  return response.data;
};

// Backwards compatibility alias
export const uploadImage = uploadMedia;

/**
 * Fetch all media records from MongoDB Atlas
 * @returns {Promise<{ success: boolean, count: number, media: Array }>}
 */
export const getMedia = async () => {
  const response = await api.get('/media');
  return response.data;
};

/**
 * Fetch a single media record by MongoDB ObjectId
 * @param {string} id 
 * @returns {Promise<{ success: boolean, media: Object }>}
 */
export const getMediaById = async (id) => {
  const response = await api.get(`/media/${id}`);
  return response.data;
};

/**
 * Request AI analysis and tagging for an existing media asset
 * @param {string} id - MongoDB ObjectId
 * @returns {Promise<{ success: boolean, message: string, media: Object, tags: Array, taggingStatus: string }>}
 */
export const analyzeMedia = async (id) => {
  const response = await api.post(`/media/${id}/analyze`);
  return response.data;
};

/**
 * Search media assets by AI tags, filename, or public ID via Cloudinary Search API
 * @param {string} query - Search keyword
 * @returns {Promise<{ success: boolean, query: string, count: number, media: Array }>}
 */
export const searchMedia = async (query) => {
  const response = await api.get('/media/search', {
    params: { q: query },
  });
  return response.data;
};

/**
 * Request Cloudinary AI content moderation on an asset
 * @param {string} id - MongoDB ObjectId
 * @returns {Promise<{ success: boolean, message: string, media: Object, moderationStatus: string, moderationKind: string, moderationLabels: Array }>}
 */
export const moderateMedia = async (id) => {
  const response = await api.post(`/media/${id}/moderate`);
  return response.data;
};

/**
 * Fetch latest moderation status from Cloudinary for an asset
 * @param {string} id - MongoDB ObjectId
 * @returns {Promise<{ success: boolean, media: Object, moderationStatus: string, moderationKind: string, moderationLabels: Array }>}
 */
export const getMediaModeration = async (id) => {
  const response = await api.get(`/media/${id}/moderation`);
  return response.data;
};

/**
 * Synchronize Cloudinary structured metadata for an asset
 * @param {string} id - MongoDB ObjectId
 * @returns {Promise<{ success: boolean, message: string, media: Object, metadata: Object }>}
 */
export const syncMetadata = async (id) => {
  const response = await api.patch(`/media/${id}/metadata`);
  return response.data;
};

/**
 * Generate a content-aware smart crop URL for a media asset (Phase 8)
 * @param {string} id - MongoDB ObjectId
 * @param {string} preset - One of 'square' | 'portrait' | 'story' | 'landscape' | 'thumbnail'
 * @returns {Promise<{ success: boolean, preset: string, presetInfo: Object, url: string, centerCropUrl: string, originalUrl: string }>}
 */
export const getSmartCrop = async (id, preset = 'square') => {
  const response = await api.post(`/media/${id}/crop`, { preset });
  return response.data;
};

/**
 * Request AI background removal for a media asset (Phase 9)
 * @param {string} id - MongoDB ObjectId
 * @returns {Promise<{ success: boolean, mediaId: string, publicId: string, originalUrl: string, backgroundRemovedUrl: string, format: string, status: string }>}
 */
export const removeBackground = async (id) => {
  const response = await api.post(`/media/${id}/remove-background`);
  return response.data;
};

/**
 * Request unified transformation for a media asset (Phase 11)
 * Combines smart cropping, optional background removal, and optimized delivery.
 * @param {string} id - MongoDB ObjectId
 * @param {Object} options
 * @param {string} [options.preset='square'] - Allowed preset: 'square' | 'portrait' | 'landscape' | 'story' | 'thumbnail'
 * @param {boolean} [options.removeBackground=false] - Whether to remove background
 * @returns {Promise<{ success: boolean, mediaId: string, publicId: string, originalUrl: string, preset: string, presetInfo: Object, removeBackground: boolean, transformedUrl: string, format: string, status: string }>}
 */
export const transformMedia = async (id, { preset = 'square', removeBackground = false } = {}) => {
  const response = await api.post(`/media/${id}/transform`, { preset, removeBackground });
  return response.data;
};

/**
 * Delete a media asset from MongoDB Atlas and Cloudinary
 * @param {string} id - MongoDB ObjectId
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const deleteMedia = async (id) => {
  const response = await api.delete(`/media/${id}`);
  return response.data;
};

export default api;

