const mysql = require('mysql2');
require('dotenv').config();

// Create a connection pool
console.log('Creating MySQL connection pool with config:', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ? '****' : 'NOT SET',
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Get promise-based connection
const promisePool = pool.promise();

// Test connection
console.log('Attempting to connect to MySQL database with config:', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ? '****' : 'NOT SET',
  database: process.env.DB_NAME
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err.message);
    console.error('Error code:', err.code);
    console.error('Error errno:', err.errno);
    console.error('Error syscall:', err.syscall);
    console.error('Error fatal:', err.fatal);
  } else {
    console.log('✅ Successfully connected to MySQL database');
    connection.release();
  }
});

// Test a simple query
pool.query('SELECT 1 as test', (err, results) => {
  if (err) {
    console.error('Error executing test query:', err.message);
  } else {
    console.log('✅ Test query successful:', results);
  }
});

module.exports = promisePool;
