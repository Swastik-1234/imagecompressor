const sharp = require('sharp');
const axios = require('axios');

class ImageCompressor {
  static async compressImage(imageUrl) {
    try {
      // Download the image
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);

      // Compress the image
      const compressedBuffer = await sharp(buffer)
        .jpeg({ quality: 50 }) // Compress to 50% quality
        .toBuffer();

      // Here you would typically upload the compressed buffer to your storage
      // and return the new URL. For now, we'll return a mock URL
      return `https://compressed-${imageUrl.split('/').pop()}`;
    } catch (error) {
      console.error('Image compression failed:', error);
      throw error;
    }
  }
}

module.exports = ImageCompressor; 