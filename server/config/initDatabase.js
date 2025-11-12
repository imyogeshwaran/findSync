console.log('Loading initDatabase module');
const db = require('./database');
const fs = require('fs');
const path = require('path');
console.log('initDatabase module dependencies loaded');

async function initializeDatabase() {
  try {
    console.log('🔄 Checking database for existing schema...');
    console.log('Database config:', {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME
    });

    // Check database connection first
    try {
      const connection = await db.getConnection();
      console.log('✅ Database connection successful');
      connection.release();
    } catch (connErr) {
      console.error('❌ Database connection failed:', connErr.message);
      throw connErr;
    }

    // Check if tables exist
    try {
      const [usersResult] = await db.query('SELECT COUNT(*) as count FROM Users LIMIT 1');
      const [itemsResult] = await db.query('SELECT COUNT(*) as count FROM Items LIMIT 1');
      console.log('✅ Database tables exist');
      console.log('Users table count:', usersResult[0].count);
      console.log('Items table count:', itemsResult[0].count);
    } catch (tableErr) {
      console.log('❌ Database tables do not exist, creating them...');
      
      // Read and execute schema
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Split by semicolon and execute each statement
      const statements = schema.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await db.query(statement);
            console.log('✅ Executed:', statement.trim().split('\n')[0]);
          } catch (err) {
            // Log error but continue if it's just a "table exists" error
            if (!err.message.includes('already exists')) {
              console.error('❌ Error executing statement:', err.message);
              throw err;
            } else {
              console.log('ℹ️  Statement skipped (already exists):', statement.trim().split('\n')[0]);
            }
          }
        }
      }
      
      console.log('✅ Database schema created successfully');
    }

    console.log('✅ Database initialization completed');
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

console.log('Exporting initializeDatabase function');
module.exports = initializeDatabase;
console.log('initializeDatabase function exported');
