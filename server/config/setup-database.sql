-- Database setup script for FindSync
-- Run this in MySQL to create the database and tables

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS findsync;
USE findsync;

-- Users table
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,   -- Firebase UID (unique per user)
    name VARCHAR(100) DEFAULT NULL,              -- Fetched from Firebase (displayName)
    email VARCHAR(100) UNIQUE NOT NULL,          -- Fetched from Firebase
    phone VARCHAR(15) DEFAULT NULL,              -- Optional (can add later)
    location VARCHAR(100) DEFAULT NULL,          -- Optional (user can add in profile)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_firebase_uid (firebase_uid),
    INDEX idx_email (email)
);

-- Items table
CREATE TABLE Items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    post_type ENUM('lost', 'found') NOT NULL,
    location VARCHAR(100) NOT NULL,
    image_url VARCHAR(255),
    status ENUM('open', 'matched', 'closed') DEFAULT 'open',
    posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_post_type (post_type),
    INDEX idx_status (status),
    INDEX idx_posted_at (posted_at)
)AUTO_INCREMENT = 101;

-- Contacts table
CREATE TABLE Contacts (
    contact_id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    item_id INT NOT NULL,
    message TEXT,
    contact_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES Items(item_id) ON DELETE CASCADE,
    INDEX idx_sender_id (sender_id),
    INDEX idx_receiver_id (receiver_id),
    INDEX idx_item_id (item_id)
)AUTO_INCREMENT = 1001;

-- ItemImages table
CREATE TABLE ItemImages (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES Items(item_id) ON DELETE CASCADE,
    INDEX idx_item_id (item_id)
)AUTO_INCREMENT = 10001;

-- Matches table
CREATE TABLE Matches (
    match_id INT AUTO_INCREMENT PRIMARY KEY,
    lost_item_id INT NOT NULL,
    found_item_id INT NOT NULL,
    similarity_score DECIMAL(5,2),
    matched_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lost_item_id) REFERENCES Items(item_id),
    FOREIGN KEY (found_item_id) REFERENCES Items(item_id),
    INDEX idx_lost_item (lost_item_id),
    INDEX idx_found_item (found_item_id)
)AUTO_INCREMENT = 100001;

-- Insert some sample data
INSERT IGNORE INTO Users (firebase_uid, name, email) VALUES 
('sample-uid-1', 'John Doe', 'john@example.com'),
('sample-uid-2', 'Sarah Wilson', 'sarah@example.com');

INSERT IGNORE INTO Items (user_id, item_name, description, category, post_type, location, image_url) VALUES 
(1, 'Black Wallet', 'Leather wallet found near the fountain', 'Accessories', 'found', 'Central Park', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'),
(2, 'iPhone 13', 'Black iPhone with cracked screen', 'Electronics', 'lost', 'City Library', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400');

SELECT 'Database setup completed successfully!' as message;
