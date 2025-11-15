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

// Ensure approval_status column exists in Items table (run asynchronously)
setTimeout(async () => {
  try {
    console.log('Running database migrations...');
    
    // Check if column exists
    const [columns] = await promisePool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'Items' AND COLUMN_NAME = 'approval_status'`
    );
    
    if (columns.length === 0) {
      console.log('approval_status column not found, adding it...');
      await promisePool.query(`
        ALTER TABLE Items 
        ADD COLUMN approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'
      `);
      console.log('✅ approval_status column added to Items table');
    } else {
      console.log('✅ approval_status column already exists');
    }
    
    // Update existing items without approval_status to 'approved'
    const [updateResult] = await promisePool.query(`
      UPDATE Items 
      SET approval_status = 'approved' 
      WHERE approval_status IS NULL OR approval_status = ''
    `);
    console.log('✅ Database migration complete. Updated rows:', updateResult.affectedRows);
    
    // Normalize category names in database
    console.log('Running category normalization migration...');
    const categoryUpdates = [
      { old: 'electronic_gadget', new: 'Electronic Gadget' },
      { old: 'electronics', new: 'Electronic Gadget' },
      { old: 'electronics gadgets', new: 'Electronic Gadget' },
      { old: 'electronics gadget', new: 'Electronic Gadget' },
      { old: 'accessory', new: 'Accessories' },
      { old: 'doc', new: 'Documents' },
      { old: 'document', new: 'Documents' },
      { old: 'other', new: 'Others' }
    ];
    
    for (const update of categoryUpdates) {
      const [result] = await promisePool.query(`
        UPDATE Items 
        SET category = ? 
        WHERE LOWER(category) = LOWER(?)
      `, [update.new, update.old]);
      if (result.affectedRows > 0) {
        console.log(`✅ Updated ${result.affectedRows} items: ${update.old} → ${update.new}`);
      }
    }
    console.log('✅ Category normalization migration complete');
  } catch (err) {
    console.warn('⚠️ Database migration error:', err.message);
  }
}, 2000);

module.exports = promisePool;
