-- Fix post_type column to remove default value
-- This script should be run to fix the existing database

USE findsync;

-- Remove the default value from post_type column
ALTER TABLE Items ALTER COLUMN post_type DROP DEFAULT;

-- Verify the change
SHOW COLUMNS FROM Items WHERE Field = 'post_type';