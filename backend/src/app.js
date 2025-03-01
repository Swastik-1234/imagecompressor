const express = require('express');
const multer = require('multer');
const cors = require('cors');
const mysql = require('mysql');
const csv = require('csv-parse');
require('dotenv').config();
const path = require('path');
const ImageCompressor = require('./utils/imageCompressor');
const uploadController = require('./controllers/uploadController');
const statusController = require('./controllers/statusController');

const app = express();
const PORT = process.env.PORT || 3002;
app.use('/compressed', express.static(path.join(__dirname, '../public/compressed')));

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Database configuration
const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'ySwastik@010',
  database: process.env.DB_NAME || 'image_processing_system'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Routes
app.post('/api/upload', upload.single('file'), uploadController.uploadCSV);
app.get('/api/status/:requestId', statusController.getStatus);
app.get('/api/results/:requestId', statusController.getResults);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const newPort = PORT + 1;
    console.log(`Port ${PORT} is busy, trying port ${newPort}`);
    app.listen(newPort, () => {
      console.log(`Server now running on port ${newPort}`);
    });
  } else {
    console.error('Server error:', err);
  }
});

module.exports = app;