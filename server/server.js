const express = require('express');
const cors = require('cors');
require('dotenv').config();
console.log('Loading initializeDatabase module...');
const initializeDatabase = require('./config/initDatabase');
console.log('initializeDatabase module loaded');
const path = require('path');
const http = require('http');

console.log('Starting server...');
console.log('Environment variables:', {
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME,
  PORT: process.env.PORT
});

const app = express();
// const server = http.createServer(app);
// const { Server } = require('socket.io');
// const io = new Server(server, {
//   cors: {
//     origin: ['http://localhost:5174', 'http://127.0.0.1:5174', 'http://localhost:5173', 'http://127.0.0.1:5173'],
//     methods: ["GET", "POST"],
//     credentials: true,
//     allowedHeaders: ["my-custom-header"],
//   },
//   pingTimeout: 60000,
//   pingInterval: 25000
// });

// Socket.IO connection handling
// io.on('connection', (socket) => {
//   console.log('Client connected:', socket.id);

//   socket.on('disconnect', (reason) => {
//     console.log('Client disconnected:', socket.id, 'Reason:', reason);
//   });

//   socket.on('error', (error) => {
//     console.error('Socket error:', error);
//   });
// });

// Handle errors at the IO level
// io.engine.on("connection_error", (err) => {
//   console.error('Connection error:', err);
// });
// app.set('io', io);

// Middleware
app.use(cors({
  origin: ['http://localhost:5174', 'http://127.0.0.1:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'Content-Type']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Serve uploaded files from /uploads
const uploadsPath = path.join(__dirname, 'public', 'uploads');
console.log('Serving uploads from:', uploadsPath);

// Debug middleware for all requests
app.use((req, res, next) => {
    console.log('Incoming request:', req.method, req.url);
    next();
});

// Serve static files from uploads directory
app.use('/uploads', (req, res, next) => {
    console.log('Static file request for:', req.url);
    console.log('Full path:', path.join(uploadsPath, req.url));
    next();
}, express.static(uploadsPath));

// Add a route to debug image serving
// app.get('/uploads/:filename', (req, res, next) => {
//     const filePath = path.join(uploadsPath, req.params.filename);
//     console.log('Attempting to serve:', filePath);
//     try {
//         if (require('fs').existsSync(filePath)) {
//             console.log('File exists, serving normally');
//             const stats = require('fs').statSync(filePath);
//             console.log('File stats:', stats);
//             next();
//         } else {
//             console.log('File not found:', filePath);
//             res.status(404).send('Image not found');
//         }
//     } catch (error) {
//         console.error('Error accessing file:', error);
//         res.status(500).send('Error accessing file');
//     }
// });

// Allow popups from auth providers to be closed by the opener in dev
app.use((req, res, next) => {
  // This relaxes COOP to allow popup windows to communicate their closed state back to the opener
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});

// Routes
console.log('Loading route modules...');
console.log('Loading user routes...');
const userRoutes = require('./routes/userRoutes');
console.log('Loading item routes...');
const itemRoutes = require('./routes/itemRoutes');
console.log('Loading contact routes...');
const contactRoutes = require('./routes/contactRoutes');
console.log('Loading auth routes...');
const authRoutes = require('./routes/authRoutes');

console.log('Route modules loaded');

// Test route
app.get('/test', (req, res) => {
    console.log('Test endpoint called');
    res.send('Server is running');
});

// Simple test endpoint to verify CORS
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working', timestamp: new Date().toISOString() });
});

console.log('Connecting API routes...');
console.log('Connecting /api/users routes...');
app.use('/api/users', userRoutes);
console.log('Connecting /api/items routes...');
app.use('/api/items', itemRoutes);
console.log('Connecting /api/contacts routes...');
app.use('/api/contacts', contactRoutes);
console.log('Connecting /api/auth routes...');
app.use('/api/auth', authRoutes);
console.log('✅ All API routes connected');

// Log all registered routes for debugging
app._router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log('Registered route:', r.route.path, Object.keys(r.route.methods));
  }
});

// Health check route
app.get('/health', (req, res) => {
  console.log('Health check endpoint called');
  res.json({ status: 'OK', message: 'Server is running', timestamp: new Date().toISOString() });
});

// CORS test route
app.get('/cors-test', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'CORS is working', 
    origin: req.get('Origin'),
    timestamp: new Date().toISOString() 
  });
});

// Simple ping endpoint
app.get('/ping', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is responding', 
    timestamp: new Date().toISOString() 
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'FindSync API Server',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      items: '/api/items',
      health: '/health'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
const PORT = process.env.PORT || 3005;

async function startServer() {
  console.log('Starting server initialization...');
  try {
    // Initialize database schema
    console.log('Initializing database...');
    await initializeDatabase();
    console.log('✅ Database initialization completed successfully');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    console.error('Continuing server startup without database initialization...');
  }
  
  console.log('Starting HTTP server on port', PORT);
  // Start server
  console.log(`Attempting to start server on port ${PORT}`);
  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Server is running on port ${PORT}`);
    console.log(`📍 API: http://localhost:${PORT}`);
    console.log(`💚 Health: http://localhost:${PORT}/health\n`);
  });
  
  server.on('listening', () => {
    const addr = server.address();
    console.log('Server is listening on:', addr);
    console.log('Server is now listening for connections');
  });
  
  server.on('error', (error) => {
    console.error('Server error:', error);
  });
  
  console.log('Server listen called on port', PORT);
  return server;
}

console.log('Starting server...');

// Add unhandled error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  console.error('Error stack:', err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();
console.log('Server start function called');

module.exports = { app };
