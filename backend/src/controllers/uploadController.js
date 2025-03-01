const csv = require('csv-parse');
const { v4: uuidv4 } = require('uuid');
const ImageProcessor = require('../services/imageProcessingService');
const WebhookService = require('../services/webhookService');
const connection = require('../config/database');

exports.uploadCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { webhookUrl } = req.body;
    const requestId = uuidv4();
    const fileContent = req.file.buffer.toString();
    
    // Parse CSV
    csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    }, async (err, products) => {
      if (err) {
        console.error('CSV parsing error:', err);
        return res.status(400).json({ error: 'Invalid CSV format' });
      }

      console.log('Parsed CSV products:', products); // Debug log

      try {
        // Create processing request
        await new Promise((resolve, reject) => {
          connection.query(
            'INSERT INTO processing_requests (id, status) VALUES (?, ?)',
            [requestId, 'pending'],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });

        // Store webhook URL if provided
        if (webhookUrl) {
          await WebhookService.create(requestId, webhookUrl);
        }

        // Insert products
        for (const product of products) {
          console.log('Processing product:', product); // Debug log
          
          // Make sure to use the exact column name from your CSV
          const inputUrls = product['Input image Urls'] || product['Input Image Urls'];
          
          if (!inputUrls) {
            console.error('No input URLs found for product:', product);
            continue;
          }

          await new Promise((resolve, reject) => {
            connection.query(
              'INSERT INTO products (request_id, serial_number, product_name, input_image_urls) VALUES (?, ?, ?, ?)',
              [
                requestId,
                product['Sl No'],
                product['Product Name'],
                inputUrls  // Use the extracted URLs
              ],
              (err) => {
                if (err) {
                  console.error('Product insert error:', err);
                  reject(err);
                }
                else resolve();
              }
            );
          });
        }

        // Start processing images asynchronously
        ImageProcessor.processImages(requestId, products).catch(err => {
          console.error('Image processing error:', err);
          connection.query(
            'UPDATE processing_requests SET status = ? WHERE id = ?',
            ['failed', requestId]
          );
        });

        // Return request ID immediately
        res.json({
          message: 'Upload successful',
          requestId: requestId
        });

      } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database operation failed' });
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process upload' });
  }
};