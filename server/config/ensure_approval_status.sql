-- Ensure approval_status column exists in Items table
ALTER TABLE Items 
ADD COLUMN IF NOT EXISTS approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending';

-- Update existing items without approval_status to 'approved' so they show up
UPDATE Items 
SET approval_status = 'approved' 
WHERE approval_status IS NULL OR approval_status = '';
