const fs = require('fs').promises;
const path = require('path');
const db = require('./config/database');

async function applySchemaUpdate() {
  try {
    console.log('Checking if Messages table exists...');
    
    // Check if Messages table exists
    const [tables] = await db.query(
      `SELECT TABLE_NAME 
       FROM information_schema.tables 
       WHERE table_schema = DATABASE()
       AND table_name = 'Messages'`
    );

    if (tables.length > 0) {
      console.log('Messages table already exists, skipping creation');
      return;
    }

    console.log('Creating Messages table...');
    
    // Read and execute the schema update SQL
    const schemaPath = path.join(__dirname, 'config', 'chat_schema_update.sql');
    const schemaSQL = await fs.readFile(schemaPath, 'utf8');
    
    // Split into individual statements
    const statements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Execute each statement
    for (const sql of statements) {
      await db.query(sql);
      console.log('Executed:', sql.substring(0, 60) + '...');
    }

    console.log('✅ Successfully created Messages table and indexes');
  } catch (err) {
    console.error('Failed to apply schema update:', err);
    throw err;
  }
}

// Run the update
applySchemaUpdate()
  .then(() => {
    console.log('Schema update completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Schema update failed:', err);
    process.exit(1);
  });