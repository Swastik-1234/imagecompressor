const pool = require('../config/database');
const ImageProcessor = require('../services/imageProcessingService');
const CSVGenerator = require('../utils/csvGenerator');

exports.getStatus = async (req, res) => {
  try {
    const { requestId } = req.params;

    const [rows] = await pool.execute(
      'SELECT status FROM processing_requests WHERE id = ?',
      [requestId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json({ status: rows[0].status });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
};

exports.getResults = async (req, res) => {
  try {
    const { requestId } = req.params;
    const format = req.query.format || 'json'; // Support both JSON and CSV

    const [request] = await pool.execute(
      'SELECT status FROM processing_requests WHERE id = ?',
      [requestId]
    );

    if (request.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request[0].status !== 'completed') {
      return res.status(400).json({ error: 'Processing not completed yet' });
    }

    const results = await ImageProcessor.getProcessedResults(requestId);

    if (format === 'csv') {
      const csv = await CSVGenerator.generateOutputCSV(results);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=results-${requestId}.csv`);
      return res.send(csv);
    }

    res.json(results);
  } catch (error) {
    console.error('Results fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
}; 