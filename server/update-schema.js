const db = require('./config/database');

async function applySchemaUpdate() {
  try {
    console.log('Applying schema update...');
    
    // Check if finder_name column exists
    const [columns] = await db.query(
      `SELECT COUNT(*) as cnt FROM information_schema.columns 
       WHERE table_schema = ? AND table_name = 'Items' AND column_name = 'finder_name'`,
      [process.env.DB_NAME]
    );
    
    if (columns[0].cnt === 0) {
      // Add finder_name column
      await db.query(`ALTER TABLE Items ADD COLUMN finder_name VARCHAR(100) NOT NULL AFTER item_name`);
      console.log('✅ Successfully added finder_name column');
    } else {
      console.log('ℹ️ finder_name column already exists');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

applySchemaUpdate();