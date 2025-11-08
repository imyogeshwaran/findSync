# FindSync Database Setup Guide

## 🗄️ Database Schema Updated

Your database now uses the proper structure with these tables:

### Tables Created:
- **`Users`** - Stores Firebase user data (user_id, firebase_uid, name, email, phone, location)
- **`Items`** - Stores lost/found items (item_id, user_id, item_name, description, category, post_type, location, status)
- **`Contacts`** - For user communications (contact_id, sender_id, receiver_id, item_id, message)
- **`ItemImages`** - For multiple images per item (image_id, item_id, image_url)
- **`Matches`** - For AI matching lost/found items (match_id, lost_item_id, found_item_id, similarity_score)

## 🔧 Setup Instructions

### 1. Install MySQL
- Download from https://dev.mysql.com/downloads/mysql/
- Or use XAMPP/WAMP for easy setup

### 2. Create Database & Tables
```bash
# Connect to MySQL
mysql -u root -p

# Run the setup script
source setup-database.sql
```

### 3. Configure Environment
```bash
# Copy environment template
cp env.example .env

# Edit .env with your MySQL credentials:
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=findsync
JWT_SECRET=your-secure-secret-key
PORT=5000
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Start Services
```bash
# Terminal 1 - Backend
npm run api

# Terminal 2 - Frontend  
npm run dev
```

## 🔐 Firebase Integration

### User Authentication Flow:
1. **Sign Up/Sign In** → Firebase Authentication
2. **User Sync** → Firebase UID + name/email → MySQL Users table
3. **JWT Token** → Generated for API authentication
4. **Item Creation** → Linked to user_id from JWT

### Key Features:
✅ **Firebase UID Mapping** - Each Firebase user gets a MySQL user_id  
✅ **Duplicate Prevention** - Checks firebase_uid before creating new users  
✅ **Data Sync** - Updates name/email from Firebase on each login  
✅ **JWT Authentication** - Secure API access with user_id  
✅ **User-Specific Items** - All items linked to authenticated users  

## 📊 Data Storage

### Users Table:
- `user_id` (Primary Key, Auto Increment)
- `firebase_uid` (Unique Firebase identifier)
- `name` (From Firebase displayName)
- `email` (From Firebase email)
- `phone` (Optional, user can add)
- `location` (Optional, user can add)

### Items Table:
- `item_id` (Primary Key, starts from 101)
- `user_id` (Foreign Key to Users)
- `item_name` (Item title)
- `description` (Item details)
- `category` (Electronics, Accessories, etc.)
- `post_type` (ENUM: 'lost' or 'found')
- `location` (Where item was lost/found)
- `status` (ENUM: 'open', 'matched', 'closed')

## 🚀 Testing

1. **Sign up** with Firebase → Check Users table
2. **Post missing item** → Check Items table (post_type='lost')
3. **Refresh page** → Items persist from database
4. **Sign out/in** → User data maintained

## 🔍 Verification

Check database after operations:
```sql
-- View all users
SELECT * FROM Users;

-- View all items
SELECT * FROM Items;

-- View items with user info
SELECT i.*, u.name as owner_name 
FROM Items i 
JOIN Users u ON i.user_id = u.user_id;
```

Your FindSync app now has full database persistence! 🎉
