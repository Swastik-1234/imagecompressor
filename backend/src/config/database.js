const mysql = require('mysql2');

let connection;

try {
  // Log environment variables for debugging
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    database: process.env.DB_NAME || 'railway',
    port: parseInt(process.env.DB_PORT) || 3306
  };

  console.log('Full Database Config:', {
    ...dbConfig,
    password: '****' // Hide password in logs
  });

  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD) {
    console.error('Missing required database environment variables');
  }

  // Create connection pool
  const pool = mysql.createPool({
    ...dbConfig,
    password: process.env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });

  connection = pool.promise();

  // Test the connection immediately
  pool.getConnection((err, tempConnection) => {
    if (err) {
      console.error('Database connection error:', {
        code: err.code,
        message: err.message,
        stack: err.stack,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT
      });
      throw err; // Make the error more visible
    }
    console.log('Successfully connected to database');
    tempConnection.release();
  });

} catch (error) {
  console.error('Database configuration error:', {
    message: error.message,
    stack: error.stack,
    code: error.code
  });
  throw error; // Re-throw to make startup fail if DB connection fails
}

module.exports = connection;