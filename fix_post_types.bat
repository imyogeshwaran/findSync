@echo off
echo Fixing post_type column in database...
echo.

cd server
node -e "
const db = require('./config/database');

async function fixPostTypeColumn() {
  try {
    console.log('Removing default value from post_type column...');
    await db.query('ALTER TABLE Items ALTER COLUMN post_type DROP DEFAULT');
    console.log('✅ Successfully removed default value from post_type column');
    
    console.log('Verifying column definition...');
    const [columns] = await db.query('SHOW COLUMNS FROM Items WHERE Field = \"post_type\"');
    if (columns.length > 0) {
      console.log('Column definition:', columns[0]);
    }
    
    console.log('✅ Database fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing database:', error.message);
    process.exit(1);
  }
}

fixPostTypeColumn();
"

echo.
echo Database fix completed!
pause