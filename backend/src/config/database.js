const mysql = require('mysql2');

let connection;

try {
  // Log environment variables for debugging
  console.log('Database Config:', {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  // Create connection pool
  connection = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'railway',
    port: parseInt(process.env.DB_PORT) || 3306
  });

  // Test the connection
  connection.getConnection((err, tempConnection) => {
    if (err) {
      console.error('Error connecting to database:', err);
      return;
    }
    console.log('Successfully connected to database');
    tempConnection.release();
  });

} catch (error) {
  console.error('Database configuration error:', error);
}

module.exports = connection;