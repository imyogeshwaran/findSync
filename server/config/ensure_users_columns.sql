-- Check if password column exists and add if missing
SELECT COUNT(*) INTO @password_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'Users' 
AND COLUMN_NAME = 'password';

SET @add_password_sql = IF(@password_exists = 0,
    'ALTER TABLE Users ADD COLUMN password VARCHAR(255) DEFAULT NULL',
    'ALTER TABLE Users MODIFY COLUMN password VARCHAR(255) DEFAULT NULL'
);
PREPARE stmt FROM @add_password_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if mobile column exists and add if missing (only if phone doesn't exist)
SELECT COUNT(*) INTO @mobile_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'Users' 
AND COLUMN_NAME = 'mobile';

SELECT COUNT(*) INTO @phone_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'Users' 
AND COLUMN_NAME = 'phone';

SET @add_mobile_sql = IF(@mobile_exists = 0 AND @phone_exists = 0,
    'ALTER TABLE Users ADD COLUMN mobile VARCHAR(15) DEFAULT NULL',
    'SELECT "mobile or phone column already exists" AS message'
);
PREPARE stmt FROM @add_mobile_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;