const mysql = require('mysql2');

let connection;

try {
  if (process.env.DATABASE_URL) {
    // Production (Railway) configuration
    connection = mysql.createConnection(process.env.DATABASE_URL + "&ssl={'rejectUnauthorized':false}");
  } else {
    // Local development configuration
    connection = mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'ySwastik@010',
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