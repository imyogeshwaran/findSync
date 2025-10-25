-- Create database if not exists
CREATE DATABASE IF NOT EXISTS findsync;
USE findsync;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS Matches;
DROP TABLE IF EXISTS ItemImages;
DROP TABLE IF EXISTS Contacts;
DROP TABLE IF EXISTS Items;
DROP TABLE IF EXISTS Users;

-- Create Users table
CREATE TABLE IF NOT EXISTS Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,   
    name VARCHAR(100) DEFAULT NULL,              
    email VARCHAR(100) UNIQUE NOT NULL,          
    phone VARCHAR(15) DEFAULT NULL,              
    location VARCHAR(100) DEFAULT NULL,          
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Items table
CREATE TABLE IF NOT EXISTS Items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    post_type ENUM('lost', 'found') NOT NULL,
    phone VARCHAR(15) DEFAULT NULL,
    location VARCHAR(100) NOT NULL,
    image_url VARCHAR(255),
    status ENUM('open', 'matched', 'closed') DEFAULT 'open',
    posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
)AUTO_INCREMENT = 101;

-- Create Contacts table
CREATE TABLE IF NOT EXISTS Contacts (
    contact_id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    item_id INT NOT NULL,
    message TEXT,
    contact_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES Items(item_id) ON DELETE CASCADE
)AUTO_INCREMENT = 1001;

-- Create ItemImages table
CREATE TABLE IF NOT EXISTS ItemImages (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    image_data LONGBLOB,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES Items(item_id) ON DELETE CASCADE
)AUTO_INCREMENT = 10001;

-- Create Matches table
CREATE TABLE IF NOT EXISTS Matches (
    match_id INT AUTO_INCREMENT PRIMARY KEY,
    lost_item_id INT NOT NULL,
    found_item_id INT NOT NULL,
    similarity_score DECIMAL(5,2),
    matched_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lost_item_id) REFERENCES Items(item_id),
    FOREIGN KEY (found_item_id) REFERENCES Items(item_id)
)AUTO_INCREMENT = 100001;
