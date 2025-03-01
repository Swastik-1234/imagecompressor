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
        responseType: 'arraybuffer'
      });

      // Get original size in KB
      const originalSize = (response.data.length / 1024).toFixed(2);
      console.log('Original size:', originalSize, 'KB');

      // Compress image
      const compressedBuffer = await sharp(response.data)
        .jpeg({ quality: 80 })  // Adjust quality as needed (0-100)
        .toBuffer();

      // Get compressed size in KB
      const compressedSize = (compressedBuffer.length / 1024).toFixed(2);
      console.log('Compressed size:', compressedSize, 'KB');

      // Calculate compression ratio
      const compressionRatio = (((response.data.length - compressedBuffer.length) / response.data.length) * 100).toFixed(2);
      console.log('Compression ratio:', compressionRatio, '%');

      // Save compressed image
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const outputDir = path.join(__dirname, '../../public/compressed');
      const outputPath = path.join(outputDir, filename);

      // Create directory if it doesn't exist
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Save file
      await fs.promises.writeFile(outputPath, compressedBuffer);

      // Return results
      return {
        url: `/compressed/${filename}`,
        originalSize: parseFloat(originalSize),
        compressedSize: parseFloat(compressedSize),
        compressionRatio: parseFloat(compressionRatio)
      };

    } catch (error) {
      console.error('Error compressing image:', error);
      throw new Error(`Failed to compress image: ${error.message}`);
    }
  }
}

module.exports = ImageCompressor;