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
//
const app = express();
const PORT = process.env.PORT || 3001;
app.use('/compressed', express.static(path.join(__dirname, '../public/compressed')));

// Enable CORS
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
let connection;

if (process.env.DATABASE_URL) {
  // Production (Railway) configuration
  connection = mysql.createConnection(process.env.DATABASE_URL + "?ssl=true");
} else {
  // Local development configuration
  connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Swastik@010',
    database: 'image_processing_system',
    port: 3306
  });
}

// Handle connection errors
connection.connect(err => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Successfully connected to database');
});

// Handle disconnects
connection.on('error', function(err) {
  console.error('Database error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    connection.connect();
  } else {
    throw err;
  }
});

// Routes
app.post('/api/upload', upload.single('file'), uploadController.uploadCSV);
app.get('/api/status/:requestId', statusController.getStatus);
app.get('/api/results/:requestId', statusController.getResults);

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;