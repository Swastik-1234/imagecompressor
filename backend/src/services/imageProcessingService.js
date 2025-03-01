const pool = require('../config/database');
const ImageCompressor = require('../utils/imageCompressor');
const WebhookService = require('./webhookService');

class ImageProcessor {
  static async processRequest(requestId) {
    try {
      // Update status to processing
      await pool.execute(
        'UPDATE processing_requests SET status = ? WHERE id = ?',
        ['processing', requestId]
      );

      // Get all products for this request
      const [products] = await pool.execute(
        'SELECT * FROM products WHERE request_id = ?',
        [requestId]
      );

      for (const product of products) {
        const inputUrls = product.input_image_urls.split(',');
        const outputUrls = [];

        // Process each image
        for (const url of inputUrls) {
          const compressedUrl = await ImageCompressor.compressImage(url.trim());
          outputUrls.push(compressedUrl);
        }

        // Update product with processed images
        await pool.execute(
          'UPDATE products SET output_image_urls = ? WHERE id = ?',
          [outputUrls.join(','), product.id]
        );
      }

      // Update status to completed
      await pool.execute(
        'UPDATE processing_requests SET status = ? WHERE id = ?',
        ['completed', requestId]
      );

      // Trigger webhook
      await WebhookService.notify(requestId);
    } catch (error) {
      console.error('Processing error:', error);
      await pool.execute(
        'UPDATE processing_requests SET status = ? WHERE id = ?',
        ['failed', requestId]
      );
    }
  }
}

module.exports = ImageProcessor; 