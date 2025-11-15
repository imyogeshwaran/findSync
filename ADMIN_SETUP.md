# Admin Dashboard Setup Guide

## Overview
This guide explains how to set up and use the admin dashboard for FindSync.

## Prerequisites
- Node.js and npm installed
- MySQL database running
- Server and client dependencies installed

## Setup Instructions

### 1. Database Setup
The admin table is automatically created when the server starts (via `schema.sql`). However, you need to insert the admin user credentials.

### 2. Create Admin User

Run the setup script to create/update the admin user:

```bash
cd server
node setup-admin.js
```

This will:
- Create the admin table if it doesn't exist
- Hash the admin password using bcrypt
- Insert or update the admin user with credentials:
  - **Admin ID**: 10101
  - **Username**: admin1
  - **Email**: yogeshwaran.ps2023@vitstudent.ac.in
  - **Password**: #narawhsegoY05

### 3. Start the Server

```bash
cd server
npm run dev
```

The server will start on `http://localhost:3005`

### 4. Start the Client

In a new terminal:

```bash
cd client
npm run dev
```

The client will start on `http://localhost:5174`

## Using the Admin Dashboard

### Login

1. Navigate to `http://localhost:5174`
2. On the login page, check the **"Admin Login"** checkbox
3. Enter the admin credentials:
   - **Email**: yogeshwaran.ps2023@vitstudent.ac.in
   - **Password**: #narawhsegoY05
4. Click **Login**

### Dashboard Features

#### Dashboard Tab
- **Total Users**: Shows count of all registered users
- **Total Items**: Shows count of all items (lost/found)
- **Recent Users**: Displays the 5 most recently joined users
- **Recent Items**: Displays the 5 most recently posted items

#### Users Tab
- View all users in the system
- See user details: ID, Name, Email, Mobile, Join Date
- Delete users with confirmation dialog

#### Items Tab
- View all items in the system
- See item details: ID, Name, Status, User ID, Creation Date
- Delete items with confirmation dialog

### Logout
Click the **Logout** button in the top-right corner to exit the admin dashboard.

## API Endpoints

### Admin Login
```
POST /api/admin/login
Content-Type: application/json

{
  "email": "yogeshwaran.ps2023@vitstudent.ac.in",
  "password": "#narawhsegoY05"
}

Response:
{
  "success": true,
  "token": "jwt_token_here",
  "admin": {
    "admin_id": 10101,
    "username": "admin1",
    "email": "yogeshwaran.ps2023@vitstudent.ac.in",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Dashboard Stats (Protected)
```
GET /api/admin/dashboard/stats
Authorization: Bearer <jwt_token>

Response:
{
  "stats": {
    "totalUsers": 10,
    "totalItems": 25,
    "recentUsers": [...],
    "recentItems": [...]
  }
}
```

### Get All Users (Protected)
```
GET /api/admin/users
Authorization: Bearer <jwt_token>

Response:
{
  "users": [...]
}
```

### Get All Items (Protected)
```
GET /api/admin/items
Authorization: Bearer <jwt_token>

Response:
{
  "items": [...]
}
```

### Delete User (Protected)
```
DELETE /api/admin/users/:userId
Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "message": "User deleted successfully"
}
```

### Delete Item (Protected)
```
DELETE /api/admin/items/:itemId
Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "message": "Item deleted successfully"
}
```

## File Structure

### Backend
- `server/controllers/adminController.js` - Admin business logic
- `server/routes/adminRoutes.js` - Admin API routes
- `server/setup-admin.js` - Admin user setup script
- `server/config/schema.sql` - Database schema (includes admin table)

### Frontend
- `client/src/components/AdminDashboard.jsx` - Admin dashboard UI
- `client/src/components/signin-form.jsx` - Updated with admin login
- `client/src/App.jsx` - Updated with admin routing

## Security Notes

1. **JWT Token**: Admin authentication uses JWT tokens stored in localStorage
2. **Password Hashing**: Admin passwords are hashed using bcrypt
3. **Token Verification**: All protected endpoints verify the JWT token and admin role
4. **CORS**: Admin API endpoints are protected with CORS configuration

## Troubleshooting

### Admin login fails
- Ensure the admin user exists in the database
- Run `node setup-admin.js` to create/update the admin user
- Check that the email and password are correct

### Dashboard shows no data
- Ensure the server is running on `http://localhost:3005`
- Check browser console for API errors
- Verify database connection is working

### Token expired
- Logout and login again
- JWT tokens expire after 7 days

## Changing Admin Password

To change the admin password:

1. Edit `server/setup-admin.js` and change the `password` field
2. Run `node setup-admin.js`

Or manually update in database:
```sql
UPDATE admin SET password_hash = '<new_hashed_password>' WHERE admin_id = 10101;
```

## Adding More Admins

To add another admin user, modify `server/setup-admin.js` or insert directly into database:

```sql
INSERT INTO admin (username, email, password_hash) 
VALUES ('admin2', 'admin2@example.com', '<hashed_password>');
```

Use bcrypt to hash the password before inserting.
