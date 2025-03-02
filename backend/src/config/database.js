const mysql = require('mysql2');

let connection;

try {
  // Log environment variables for debugging
  console.log('Attempting database connection with:', {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  // Create connection pool
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'railway',
    port: parseInt(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });

  connection = pool.promise();

  // Test the connection
  pool.getConnection((err, tempConnection) => {
    if (err) {
      console.error('Database connection error:', {
        code: err.code,
        message: err.message,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT
      });
      return;
    }
    console.log('Successfully connected to database');
    tempConnection.release();
  });

} catch (error) {
  console.error('Database configuration error:', error);
}

module.exports = connection;