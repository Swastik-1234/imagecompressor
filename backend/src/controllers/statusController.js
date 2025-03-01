const connection = require('../config/database');

exports.getResults = async (req, res) => {
  const { requestId } = req.params;

  connection.query(
    `SELECT 
      p.serial_number as 'Sl No',
      p.product_name as 'Product Name',
      p.input_image_urls as 'Input image Urls',
      p.output_image_urls as 'Output Image Urls',
      p.original_sizes,
      p.compressed_sizes,
      p.compression_ratios
    FROM products p
    WHERE p.request_id = ?
    ORDER BY p.serial_number`,
    [requestId],
    (err, results) => {
      if (err) {
        console.error('Results fetch error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Results not found' });
      }

      // Debug log to see what's coming from database
      console.log('Raw database results:', results);

      const formattedResults = results.map(row => {
        // Debug log for each row
        console.log('Processing row:', row);
        
        return {
          'Sl No': row['Sl No'],
          'Product Name': row['Product Name'],
          'Input Image Urls': row['Input image Urls'] ? row['Input image Urls'].split(',').map(url => url.trim()) : [],
          'Output Image Urls': row['Output Image Urls'] ? 
            row['Output Image Urls'].split(',').map(url => `http://localhost:3001${url.trim()}`) : [],
          originalSizes: row.original_sizes ? JSON.parse(row.original_sizes) : [],
          compressedSizes: row.compressed_sizes ? JSON.parse(row.compressed_sizes) : [],
          compressionRatios: row.compression_ratios ? JSON.parse(row.compression_ratios) : []
        };
      });

      // Debug log formatted results
      console.log('Formatted results:', formattedResults);

      res.json({ products: formattedResults });
    }
  );
};

exports.getStatus = async (req, res) => {
  try {
    const { requestId } = req.params;

    connection.query(
      'SELECT status FROM processing_requests WHERE id = ?',
      [requestId],
      (err, rows) => {
        if (err) {
          console.error('Status check error:', err);
          return res.status(500).json({ error: 'Failed to check status' });
        }

        if (rows.length === 0) {
          return res.status(404).json({ error: 'Request not found' });
        }

        res.json({ status: rows[0].status });
      }
    );
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
};