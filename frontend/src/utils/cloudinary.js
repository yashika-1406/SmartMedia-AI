/**
 * Cloudinary Delivery Optimization Helper (Phase 10)
 *
 * Generates Cloudinary CDN delivery URLs optimized with f_auto and q_auto
 * along with sensible dimension limits, without altering original stored assets.
 */

/**
 * Generates an optimized Cloudinary delivery URL
 *
 * @param {Object|string} media - Media document object or Cloudinary secure URL string
 * @param {Object} [options] - Optimization configuration
 * @param {number} [options.width] - Maximum delivery width (e.g. 600 for card, 1600 for details)
 * @param {string} [options.crop='limit'] - Crop / resize mode ('limit', 'scale', 'fill', etc.)
 * @param {string} [options.format='auto'] - Delivery format ('auto' for f_auto, or 'png' to preserve transparency)
 * @param {string} [options.quality='auto'] - Delivery quality ('auto' for q_auto)
 * @param {boolean} [options.preserveFormat=false] - If true, avoids f_auto to preserve explicit transparency
 * @returns {string} Optimized delivery URL, or fallback to raw secureUrl
 */
export function getOptimizedUrl(media, options = {}) {
  const rawUrl = typeof media === 'string' ? media : media?.secureUrl || media?.url || '';

  if (!rawUrl || typeof rawUrl !== 'string') {
    return '';
  }

  // Fallback if not a Cloudinary upload URL
  const uploadIndex = rawUrl.indexOf('/upload/');
  if (uploadIndex === -1) {
    return rawUrl;
  }

  const {
    width,
    crop = 'limit',
    format = 'auto',
    quality = 'auto',
    preserveFormat = false,
  } = options;

  const prefix = rawUrl.slice(0, uploadIndex + 8); // includes '/upload/'
  const rest = rawUrl.slice(uploadIndex + 8);

  // Check if transparency preservation is requested or detected
  const isTransparent =
    preserveFormat ||
    format === 'png' ||
    rest.includes('e_background_removal') ||
    media?.format === 'png';

  const components = [];

  // 1. Dimensional resizing component if specified and not already present
  if (width && !rest.includes(`w_${width}`)) {
    components.push(`c_${crop},w_${width}`);
  }

  // 2. Format component: separate f_auto or preserve explicit format
  if (!isTransparent && format && !rest.includes('f_auto') && !rest.includes('f_')) {
    components.push(`f_${format}`);
  }

  // 3. Quality component: separate q_auto
  if (quality && !rest.includes('q_auto') && !rest.includes('q_')) {
    components.push(`q_${quality}`);
  }

  if (components.length === 0) {
    return rawUrl;
  }

  const transformationPath = components.join('/');
  return `${prefix}${transformationPath}/${rest}`;
}

/**
 * Generates responsive srcset for an image asset
 * @param {Object|string} media
 * @param {number[]} widths - e.g. [400, 800, 1200]
 * @returns {string} srcset string
 */
export function getOptimizedSrcSet(media, widths = [400, 800, 1200]) {
  return widths
    .map((w) => `${getOptimizedUrl(media, { width: w })} ${w}w`)
    .join(', ');
}
