const mysql = require('mysql');

const connection = mysql.createConnection(process.env.DATABASE_URL);

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

module.exports = connection;