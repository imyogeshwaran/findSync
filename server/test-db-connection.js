const mysql = require('mysql2');
require('dotenv').config();

console.log('Testing database connection with config:', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ? '****' : 'NOT SET',
  database: process.env.DB_NAME
});

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    console.error('Error code:', err.code);
    console.error('Error errno:', err.errno);
    return;
  }
  console.log('✅ Successfully connected to database');
  connection.end();
});
