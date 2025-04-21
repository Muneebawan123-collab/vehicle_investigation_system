/**
 * Utility functions for handling image and file URLs consistently across the application
 */

/**
 * Formats a file or image URL to ensure it uses relative paths
 * @param {string} url - The URL to format
 * @returns {string} Formatted URL
 */
export const formatFileUrl = (url) => {
  if (!url) return null;
  
  // If the URL is already a complete URL (starts with http), use it as is
  if (url.startsWith('http')) {
    return url;
  }
  
  // If it's a file path that contains 'uploads', convert to a relative URL
  if (url.includes('/uploads/')) {
    // Extract the filename part
    const parts = url.split('/uploads/');
    const filename = parts[parts.length - 1];
    
    // Use a relative URL path
    return `/uploads/${filename}`;
  }
  
  // Otherwise return as is
  return url;
};

/**
 * Creates a blob URL for a blob or file and downloads it
 * @param {Blob} blob - The blob or file data
 * @param {string} filename - The filename to use for the download
 */
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

/**
 * Gets the file extension from a filename or URL
 * @param {string} filename - The filename or URL
 * @returns {string} The file extension (without the dot)
 */
export const getFileExtension = (filename) => {
  if (!filename) return '';
  return filename.split('.').pop().toLowerCase();
};

/**
 * Get a human-readable file size
 * @param {number} bytes - The file size in bytes
 * @returns {string} Human-readable file size (e.g., "2.5 MB")
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}; 