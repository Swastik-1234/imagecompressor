const express = require('express');
const multer = require('multer');
const cors = require('cors');
const mysql = require('mysql2');
const csv = require('csv-parse');
require('dotenv').config();
const path = require('path');
const ImageCompressor = require('./utils/imageCompressor');
const upload = require('./config/multer');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: [
    'https://frontend-imagecompression1-git-main-swastiks-projects-4c1663a0.vercel.app',
    'http://localhost:3000'  // Keep this for local development
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Serve static files
app.use('/compressed', express.static(path.join(__dirname, '../public/compressed')));

// Database connection
const connection = require('./config/database');

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Routes
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Process the CSV file
    const results = [];
    const parser = csv.parse({ columns: true });

    parser.on('readable', () => {
      let record;
      while ((record = parser.read())) {
        results.push(record);
      }
    });

    parser.on('error', (err) => {
      console.error('CSV parsing error:', err);
      res.status(400).json({ error: 'Error parsing CSV file' });
    });

    parser.on('end', () => {
      res.json({ message: 'File uploaded successfully', data: results });
    });

    parser.write(req.file.buffer);
    parser.end();

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Error processing upload' });
  }
});

app.get('/api/status/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const [rows] = await connection.query(
      'SELECT status FROM requests WHERE id = ?',
      [requestId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    res.json({ status: rows[0].status });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Error checking status' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});

// Start server only if database connection is successful
const startServer = async () => {
  try {
    // Test database connection
    await connection.query('SELECT 1');
    console.log('Database connection successful');

    // Start the server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;