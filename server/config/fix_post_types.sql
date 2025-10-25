-- Script to fix post_type values in the database
USE findsync;

-- Set default value for post_type column
ALTER TABLE Items MODIFY COLUMN post_type ENUM('lost', 'found') NOT NULL DEFAULT 'lost';

-- Update items with "found" in description or name to have post_type='found'
UPDATE Items 
SET post_type = 'found' 
WHERE 
  (LOWER(description) LIKE '%found%' OR 
   LOWER(item_name) LIKE '%found%') AND 
  posted_at > NOW() - INTERVAL 7 DAY;

-- Update specific item IDs to be "found" items
-- Add your specific item IDs here
UPDATE Items 
SET post_type = 'found' 
WHERE item_id IN (112, 113, 114, 115, 116, 117, 118, 119, 120);

-- Create a stored procedure to ensure post_type is properly set
DROP PROCEDURE IF EXISTS ensure_post_type;

DELIMITER //
CREATE PROCEDURE ensure_post_type()
BEGIN
  -- Set post_type to 'found' for records that have specific indicators
  UPDATE Items 
  SET post_type = 'found' 
  WHERE 
    (LOWER(description) LIKE '%found%' OR 
     LOWER(item_name) LIKE '%found%' OR
     LOWER(category) LIKE '%found%') AND 
    post_type = 'lost';
END //
DELIMITER ;

-- Create an event to run this procedure daily
DROP EVENT IF EXISTS fix_post_types_daily;

DELIMITER //
CREATE EVENT fix_post_types_daily
ON SCHEDULE EVERY 1 DAY
DO
BEGIN
  CALL ensure_post_type();
END //
DELIMITER ;
