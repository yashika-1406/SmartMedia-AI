/**
 * Media Formatting Utilities
 */

/**
 * Format bytes into readable string (e.g. 245 KB, 2.4 MB)
 * @param {number} bytes 
 * @returns {string}
 */
export const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Format date string into readable date (e.g. Oct 1, 2026)
 * @param {string|Date} dateStr 
 * @param {boolean} includeTime 
 * @returns {string}
 */
export const formatDate = (dateStr, includeTime = false) => {
  if (!dateStr) return 'Unknown date';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Invalid date';
    const options = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      ...(includeTime && { hour: 'numeric', minute: '2-digit' }),
    };
    return d.toLocaleDateString(undefined, options);
  } catch {
    return String(dateStr);
  }
};
