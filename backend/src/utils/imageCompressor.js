const sharp = require('sharp');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

class ImageCompressor {
  static async compressImage(url) {
    try {
      console.log('Starting compression for:', url);

      // Download image
      const response = await axios({
        url,
        responseType: 'arraybuffer',
        timeout: 30000
      });

      // Get original size in KB
      const originalSize = response.data.length;
      console.log('Original size:', originalSize);

      // Compress image
      const compressedBuffer = await sharp(response.data)
        .jpeg({ quality: 80 })
        .toBuffer();

      // Get compressed size
      const compressedSize = compressedBuffer.length;
      console.log('Compressed size:', compressedSize);

      // Calculate compression ratio
      const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);
      console.log('Compression ratio:', compressionRatio, '%');

      // Convert to base64
      const base64Data = `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;

      return {
        url: base64Data,
        originalSize,
        compressedSize,
        compressionRatio
      };

    } catch (error) {
      console.error('Error compressing image:', error);
      throw error;
    }
  }
}

module.exports = ImageCompressor;