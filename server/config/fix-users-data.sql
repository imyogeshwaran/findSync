-- Use the correct database
USE findsync;

-- Update any incomplete users to have their name set properly
UPDATE Users 
SET name = COALESCE(name, 'User') 
WHERE name IS NULL OR name = '';

-- Make sure all emails are in the correct case-insensitive collation
ALTER TABLE Users 
MODIFY COLUMN email VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci UNIQUE NOT NULL;

-- Add mobile and password columns if they don't exist
ALTER TABLE Users
ADD COLUMN IF NOT EXISTS mobile VARCHAR(15) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS password VARCHAR(255) DEFAULT NULL;