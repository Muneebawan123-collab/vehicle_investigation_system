import { 
  FileOutlined, 
  FilePdfOutlined, 
  FileImageOutlined, 
  FileExcelOutlined, 
  FileWordOutlined, 
  FileZipOutlined,
  FileUnknownOutlined
} from '@ant-design/icons';

/**
 * Formats a file size in bytes to a human-readable string
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places to show
 * @returns {string} - Formatted file size string (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0 || bytes === undefined || bytes === null) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Returns the appropriate icon component for a file type
 * @param {string} fileType - The file type/extension (e.g., "pdf", "jpg")
 * @returns {React.Component} - The icon component for the file type
 */
export const getFileTypeIcon = (fileType) => {
  if (!fileType) return FileUnknownOutlined;
  
  const type = fileType.toLowerCase();
  
  // Image files
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(type)) {
    return FileImageOutlined;
  }
  
  // PDF files
  if (type === 'pdf') {
    return FilePdfOutlined;
  }
  
  // Word documents
  if (['doc', 'docx', 'rtf'].includes(type)) {
    return FileWordOutlined;
  }
  
  // Excel files
  if (['xls', 'xlsx', 'csv'].includes(type)) {
    return FileExcelOutlined;
  }
  
  // Archive files
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(type)) {
    return FileZipOutlined;
  }
  
  // Default file icon
  return FileOutlined;
};

/**
 * Gets the MIME type based on file extension
 * @param {string} filename - The filename or extension
 * @returns {string} - The MIME type
 */
export const getMimeType = (filename) => {
  if (!filename) return 'application/octet-stream';
  
  const ext = filename.split('.').pop().toLowerCase();
  
  const mimeTypes = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    txt: 'text/plain',
    csv: 'text/csv'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}; 