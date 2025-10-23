# FindSync Backend Server

A Node.js/Express backend server with MySQL database integration for the FindSync lost and found application.

## Features

- ✅ User authentication with Firebase sync
- ✅ JWT token-based authorization
- ✅ MySQL database for persistent storage
- ✅ RESTful API endpoints
- ✅ Missing items management
- ✅ User profile management

## Prerequisites

- Node.js (v14 or higher)
- MySQL Server (v8.0 or higher)
- npm or yarn

## Installation

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure MySQL Database

Make sure MySQL server is running on your system.

**Option 1: Use MySQL Workbench or CLI**

Run the schema.sql file:
```bash
mysql -u root -p < config/schema.sql
```

**Option 2: Automatic initialization**

The server will automatically create tables when started (if they don't exist).

### 3. Environment Variables

The `.env` file is already configured with:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=123123
DB_NAME=findsync
JWT_SECRET=y1o2g3e4s5h6
PORT=5000
```

## Running the Server

### Development Mode (with auto-restart)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### User Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/users/sync` | Sync Firebase user to MySQL | No |
| GET | `/api/users/profile` | Get current user profile | Yes |
| GET | `/api/users/all` | Get all users | Yes |

### Item Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/items/missing` | Get all missing items | No |
| GET | `/api/items/missing/:id` | Get single missing item | No |
| POST | `/api/items/missing` | Create missing item | Yes |
| GET | `/api/items/my-items` | Get user's missing items | Yes |
| PUT | `/api/items/missing/:id` | Update missing item | Yes |
| DELETE | `/api/items/missing/:id` | Delete missing item | Yes |

### Authentication

Protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Database Schema

### users
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `firebase_uid` (VARCHAR, UNIQUE)
- `name` (VARCHAR)
- `email` (VARCHAR, UNIQUE)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### missing_items
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `user_id` (INT, FOREIGN KEY)
- `name` (VARCHAR)
- `description` (TEXT)
- `location` (VARCHAR)
- `mobile` (VARCHAR)
- `image_url` (VARCHAR)
- `category` (VARCHAR)
- `status` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Testing

### Health Check
```bash
curl http://localhost:5000/health
```

### Sync User (Example)
```bash
curl -X POST http://localhost:5000/api/users/sync \
  -H "Content-Type: application/json" \
  -d '{
    "firebase_uid": "test123",
    "name": "Test User",
    "email": "test@example.com"
  }'
```

## Project Structure

```
server/
├── config/
│   ├── database.js       # MySQL connection pool
│   ├── initDatabase.js   # Database initialization
│   └── schema.sql        # Database schema
├── controllers/
│   ├── userController.js # User logic
│   └── itemController.js # Item logic
├── middleware/
│   └── auth.js           # JWT authentication
├── routes/
│   ├── userRoutes.js     # User routes
│   └── itemRoutes.js     # Item routes
├── .env                  # Environment variables
├── package.json          # Dependencies
├── server.js             # Main server file
└── README.md             # This file
```

## Troubleshooting

### MySQL Connection Error
- Ensure MySQL server is running
- Verify credentials in `.env` file
- Check if port 3306 is not blocked

### Database Not Found
- Run the schema.sql file manually
- Or let the server create it automatically on first run

### Port Already in Use
- Change the PORT in `.env` file
- Or stop the process using port 5000

## Support

For issues or questions, please check the main project documentation.
