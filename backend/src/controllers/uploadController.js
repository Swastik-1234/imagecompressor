const { v4: uuidv4 } = require('uuid');
const CSVParser = require('../utils/csvParser');
const pool = require('../config/database');
const ImageProcessor = require('../services/imageProcessingService');

exports.uploadCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const requestId = uuidv4();
    const csvData = await CSVParser.parse(req.file.buffer);

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create processing request
      await connection.execute(
        'INSERT INTO processing_requests (id, status) VALUES (?, ?)',
        [requestId, 'pending']
      );

      // Insert products
      for (const row of csvData) {
        await connection.execute(
          'INSERT INTO products (request_id, serial_number, product_name, input_image_urls) VALUES (?, ?, ?, ?)',
          [requestId, row.serialNumber, row.productName, row.inputImageUrls]
        );
      }

      await connection.commit();
      connection.release();

      // Start async processing
      ImageProcessor.processRequest(requestId);

      res.json({ requestId, message: 'Upload successful' });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process upload' });
  }
}; 