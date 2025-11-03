-- Add password column if not exists
ALTER TABLE Users 
ADD COLUMN IF NOT EXISTS password VARCHAR(255) DEFAULT NULL;

-- Add mobile column if not exists
ALTER TABLE Users 
ADD COLUMN IF NOT EXISTS mobile VARCHAR(15) DEFAULT NULL;

-- Make email comparisons case-insensitive
ALTER TABLE Users 
MODIFY COLUMN email VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci UNIQUE NOT NULL;