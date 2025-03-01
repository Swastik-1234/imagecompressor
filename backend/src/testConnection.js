const connection = require('./config/database');

// Test query
connection.query('SHOW TABLES', (err, results) => {
  if (err) {
    console.error('Error executing query:', err);
    return;
  }
  console.log('Database tables:', results);
  
  // Close the connection
  connection.end((err) => {
    if (err) {
      console.error('Error closing connection:', err);
      return;
    }
    console.log('Database connection closed');
  });
}); 