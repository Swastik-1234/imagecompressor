const mysql = require('mysql');

let connection;

try {
  // Log environment variables for debugging
  console.log('Database Config:', {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  // Create connection with explicit configuration
  connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'railway',
    port: parseInt(process.env.DB_PORT) || 3306,
    insecureAuth: true,
    authPlugins: {
      mysql_native_password: () => ({
        password: process.env.DB_PASSWORD
      })
    }
  });

  // Handle connection
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