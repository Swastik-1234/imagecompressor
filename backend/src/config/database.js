const mysql = require('mysql2');

let connection;

try {
  // Get environment
  const isProduction = process.env.NODE_ENV === 'production';

  // Set configuration based on environment
  const dbConfig = {
    host: isProduction ? process.env.DB_HOST : 'localhost',
    user: isProduction ? process.env.DB_USER : 'root',
    password: isProduction ? process.env.DB_PASSWORD : 'Swastik@010',
    database: isProduction ? process.env.DB_NAME : 'image_processing_system',
    port: parseInt(process.env.DB_PORT) || 3306,
    ssl: isProduction ? {
      rejectUnauthorized: false
    } : false
  };

  console.log('Database Config:', {
    ...dbConfig,
    password: '****' // Hide password in logs
  });

  // Create connection pool
  const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0
  });

  connection = pool.promise();

  // Test the connection
  pool.getConnection((err, tempConnection) => {
    if (err) {
      console.error('Database connection error:', {
        code: err.code,
        message: err.message,
        stack: err.stack,
        host: dbConfig.host,
        user: dbConfig.user,
        database: dbConfig.database
      });
      throw err;
    }
    console.log('Successfully connected to database');
    tempConnection.release();
  });

} catch (error) {
  console.error('Database configuration error:', error);
  throw error;
}

module.exports = connection;