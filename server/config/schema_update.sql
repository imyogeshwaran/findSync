-- Add finder_name column to Items table
ALTER TABLE Items ADD COLUMN finder_name VARCHAR(100) NOT NULL AFTER item_name;

-- Modify phone column to be NOT NULL
ALTER TABLE Items MODIFY COLUMN phone VARCHAR(15) NOT NULL;

