@echo off
echo =============================================
echo FindSync Post Type Fix Utility
echo =============================================
echo This script will fix the post_type values in the database
echo and ensure that "found" items display correctly.
echo.

echo Updating database schema...
mysql -u root -p < server\config\fix_post_types.sql

echo.
echo Database schema updated.
echo.
echo Starting backend server...
cd server
start cmd /k "node server.js"
cd ..
echo.
echo Starting frontend server...
cd findSync
start cmd /k "npm start"
echo.
echo =============================================
echo DONE! Both servers are now running.
echo.
echo 1. Look for the "Fix Database" button at the top of the page
echo 2. Click it to apply fixes to existing items
echo 3. Try creating a new "found" item - it should work correctly now
echo =============================================

pause
