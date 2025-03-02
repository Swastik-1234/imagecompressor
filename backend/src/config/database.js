const mysql = require('mysql');

let connection;

try {
  // Log the environment variables (for debugging)
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_NAME: process.env.DB_NAME,
    DB_PORT: process.env.DB_PORT
  });

  // Always use environment variables in production
  connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Swastik@010',
    database: process.env.DB_NAME || 'image_processing_system',
    port: process.env.DB_PORT || 3306
  });

  connection.connect(err => {
    if (err) {
      console.error('Error connecting to database:', err);
      return;
    }
    console.log('Successfully connected to database');
  });

} catch (error) {
  console.error('Database configuration error:', error);
}

module.exports = connection;