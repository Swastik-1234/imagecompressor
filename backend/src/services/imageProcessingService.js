const ImageCompressor = require('../utils/imageCompressor');
const connection = require('../config/database');
const WebhookService = require('./webhookService');

class ImageProcessor {
  static async processImages(requestId, products) {
    try {
      console.log('Starting image processing for request:', requestId);

      // Update status to processing
      await new Promise((resolve, reject) => {
        connection.query(
          'UPDATE processing_requests SET status = ? WHERE id = ?',
          ['processing', requestId],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      // Process each product
      for (const product of products) {
        if (!product || !product['Input image Urls']) {
          console.error('Invalid product data:', product);
          continue;
        }

        const inputUrls = product['Input image Urls'].split(',').map(url => url.trim());
        const results = [];
        const originalSizes = [];
        const compressedSizes = [];
        const compressionRatios = [];

        // Process each image URL
        for (const url of inputUrls) {
          try {
            console.log('Processing URL:', url);
            const result = await ImageCompressor.compressImage(url);
            results.push(result.url);
            originalSizes.push(result.originalSize);
            compressedSizes.push(result.compressedSize);
            compressionRatios.push(result.compressionRatio);
          } catch (error) {
            console.error('Error processing image:', url, error);
          }
        }

        // Update product with results
        await new Promise((resolve, reject) => {
          connection.query(
            `UPDATE products SET 
              output_image_urls = ?,
              original_sizes = ?,
              compressed_sizes = ?,
              compression_ratios = ?
            WHERE request_id = ? AND serial_number = ?`,
            [
              results.join(','),
              JSON.stringify(originalSizes),
              JSON.stringify(compressedSizes),
              JSON.stringify(compressionRatios),
              requestId,
              product['Sl No']
            ],
            (err) => {
              if (err) {
                console.error('Database update error:', err);
                reject(err);
              } else resolve();
            }
          );
        });
      }

      // Update status to completed
      await new Promise((resolve, reject) => {
        connection.query(
          'UPDATE processing_requests SET status = ? WHERE id = ?',
          ['completed', requestId],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      // Get all processed results
      const [processedResults] = await new Promise((resolve, reject) => {
        connection.query(
          `SELECT * FROM products WHERE request_id = ?`,
          [requestId],
          (err, results) => {
            if (err) reject(err);
            else resolve([results]);
          }
        );
      });

      // Trigger webhook with complete results
      await WebhookService.trigger(requestId, {
        status: 'completed',
        processedAt: new Date(),
        results: processedResults
      });

      console.log('Processing completed and webhook triggered for request:', requestId);

    } catch (error) {
      console.error('Error processing images:', error);
      
      // Update status to failed
      await new Promise((resolve, reject) => {
        connection.query(
          'UPDATE processing_requests SET status = ? WHERE id = ?',
          ['failed', requestId],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      // Trigger webhook with error status
      await WebhookService.trigger(requestId, {
        status: 'failed',
        error: error.message,
        processedAt: new Date()
      });

      throw error;
    }
  }
}

module.exports = ImageProcessor;