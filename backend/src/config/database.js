const mysql = require('mysql2');

let connection;

try {
  if (process.env.DATABASE_URL) {
    // Production (Railway) configuration
    const connectionString = process.env.DATABASE_URL;
    const config = {
      host: connectionString.split('@')[1].split(':')[0],
      user: connectionString.split('://')[1].split(':')[0],
      password: connectionString.split(':')[2].split('@')[0],
      database: connectionString.split('/').pop(),
      port: parseInt(connectionString.split(':').pop()),
      ssl: {
        rejectUnauthorized: false
      }
    };
    connection = mysql.createConnection(config);
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

} catch (error) {
  console.error('Database configuration error:', error);
}

module.exports = connection;