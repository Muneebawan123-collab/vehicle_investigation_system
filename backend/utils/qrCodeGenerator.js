const QRCode = require('qrcode');

/**
 * Generates a QR code for a vehicle
 * @param {string} vehicleId - The vehicle ID to encode in the QR code
 * @param {string} baseUrl - The base URL for the frontend (defaults to empty)
 * @returns {Promise<string>} A data URL containing the QR code as a base64 encoded image
 */
const generateVehicleQRCode = async (vehicleId, baseUrl = '') => {
  try {
    // Make sure we have a valid vehicle ID
    if (!vehicleId) {
      throw new Error('Vehicle ID is required');
    }
    
    // Clean up baseUrl if provided
    let cleanBaseUrl = baseUrl;
    if (cleanBaseUrl && cleanBaseUrl.endsWith('/')) {
      cleanBaseUrl = cleanBaseUrl.slice(0, -1);
    }
    
    // Generate the URL that the QR code will point to
    // Note: Using absolute URL if baseUrl is provided, otherwise use relative URL
    const vehicleUrl = cleanBaseUrl 
      ? `${cleanBaseUrl}/vehicles/scan/${vehicleId}` 
      : `/vehicles/scan/${vehicleId}`;
    
    console.log('Generating QR code for URL:', vehicleUrl);
    
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(vehicleUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generates a QR code for a vehicle as a Buffer
 * @param {string} vehicleId - The vehicle ID to encode in the QR code
 * @param {string} baseUrl - The base URL for the frontend (defaults to empty)
 * @returns {Promise<Buffer>} A buffer containing the QR code image data
 */
const generateVehicleQRCodeBuffer = async (vehicleId, baseUrl = '') => {
  try {
    // Make sure we have a valid vehicle ID
    if (!vehicleId) {
      throw new Error('Vehicle ID is required');
    }
    
    // Clean up baseUrl if provided
    let cleanBaseUrl = baseUrl;
    if (cleanBaseUrl && cleanBaseUrl.endsWith('/')) {
      cleanBaseUrl = cleanBaseUrl.slice(0, -1);
    }
    
    // Generate the URL that the QR code will point to
    // Note: Using absolute URL if baseUrl is provided, otherwise use relative URL
    const vehicleUrl = cleanBaseUrl 
      ? `${cleanBaseUrl}/vehicles/scan/${vehicleId}` 
      : `/vehicles/scan/${vehicleId}`;
    
    console.log('Generating QR code buffer for URL:', vehicleUrl);
    
    // Generate QR code as buffer
    const qrCodeBuffer = await QRCode.toBuffer(vehicleUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    return qrCodeBuffer;
  } catch (error) {
    console.error('Error generating QR code buffer:', error);
    throw new Error('Failed to generate QR code buffer');
  }
};

module.exports = {
  generateVehicleQRCode,
  generateVehicleQRCodeBuffer
}; 