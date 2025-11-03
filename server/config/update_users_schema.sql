-- Make password field nullable and add mobile field
ALTER TABLE Users MODIFY COLUMN password VARCHAR(255) DEFAULT NULL;
ALTER TABLE Users ADD COLUMN mobile VARCHAR(15) DEFAULT NULL AFTER email;