const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function fixDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'findsync',
      multipleStatements: true
    });

    console.log('Connected to database');

    // Read and execute the SQL file
    const sqlPath = path.join(__dirname, 'fix_users_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await connection.query(sql);
    console.log('Successfully updated Users table schema');

    await connection.end();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error fixing database:', error);
    process.exit(1);
  }
}

fixDatabase();