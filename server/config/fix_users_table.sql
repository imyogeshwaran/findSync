-- Modify existing columns
ALTER TABLE Users
  MODIFY COLUMN password VARCHAR(255) DEFAULT NULL;

-- Add mobile column
ALTER TABLE Users ADD COLUMN mobile VARCHAR(15) DEFAULT NULL;