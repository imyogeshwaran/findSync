const db = require('./database');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  try {
    console.log('🔄 Checking database for existing schema...');

    // Never force init if tables exist
    const forceInit = false;

    // Check if the Users table exists in the current database
    const [rows] = await db.query(
      `SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = ? AND table_name = 'Users'`,
      [process.env.DB_NAME]
    );

    // Check if finder_name column exists in Items table
    let finderNameExists = false;
    try {
      const [columns] = await db.query(
        `SELECT COUNT(*) as cnt FROM information_schema.columns 
         WHERE table_schema = ? AND table_name = 'Items' AND column_name = 'finder_name'`,
        [process.env.DB_NAME]
      );
      finderNameExists = columns && columns[0] && columns[0].cnt > 0;
    } catch (err) {
      console.log('Note: Could not check for finder_name column:', err.message);
    }

    const exists = rows && rows[0] && rows[0].cnt > 0;

    if (exists) {
      console.log('ℹ️ Database tables already exist. Applying only schema updates if needed...');
    } else {
      console.log('✅ Running initial schema creation...');
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');

      // Split by semicolon and execute each statement
      const statements = schema.split(';').filter(stmt => stmt.trim());

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await db.query(statement);
          } catch (err) {
            // Log error but continue if it's just a "table exists" error
            if (!err.message.includes('already exists')) {
              throw err;
            }
          }
        }
      }
    }

    // Apply schema fixes
    console.log('✅ Applying schema fixes...');
    const schemaFixPath = path.join(__dirname, 'ensure_schema.sql');
    const schemaFix = fs.readFileSync(schemaFixPath, 'utf8');
    
    const fixStatements = schemaFix.split(';').filter(stmt => stmt.trim());
    
    for (const statement of fixStatements) {
      if (statement.trim()) {
        try {
          await db.query(statement);
        } catch (err) {
          console.warn('Warning: Schema fix error (can be ignored if column exists):', err.message);
        }
      }
    }

    console.log('✅ Database schema initialized successfully');

    // Apply schema updates if needed
    if (!finderNameExists) {
      console.log('🔄 Applying schema updates...');
      const updatePath = path.join(__dirname, 'schema_update.sql');
      if (fs.existsSync(updatePath)) {
        const updates = fs.readFileSync(updatePath, 'utf8');
        const updateStatements = updates.split(';').filter(stmt => stmt.trim());
        
        for (const statement of updateStatements) {
          if (statement.trim()) {
            try {
              await db.query(statement);
              console.log('✅ Applied schema update:', statement.trim().split('\n')[0]);
            } catch (err) {
              console.warn('⚠️ Schema update warning:', err.message);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    throw error;
  }
}

module.exports = initializeDatabase;
