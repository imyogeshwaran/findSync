const express = require('express');
const cors = require('cors');
require('dotenv').config();
const initializeDatabase = require('./config/initDatabase');
const path = require('path');
const http = require('http');

const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5174', 'http://127.0.0.1:5174', 'http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["my-custom-header"],
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', (reason) => {
    console.log('Client disconnected:', socket.id, 'Reason:', reason);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Handle errors at the IO level
io.engine.on("connection_error", (err) => {
  console.error('Connection error:', err);
});
app.set('io', io);

// Middleware
app.use(cors({
  origin: ['http://localhost:5174', 'http://127.0.0.1:5174', 'http://localhost:5173', 'http://127.0.0.1:5173'], // Vite dev server (both default and fallback ports)
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
app.get('/uploads/:filename', (req, res, next) => {
    const filePath = path.join(uploadsPath, req.params.filename);
    console.log('Attempting to serve:', filePath);
    try {
        if (require('fs').existsSync(filePath)) {
            console.log('File exists, serving normally');
            const stats = require('fs').statSync(filePath);
            console.log('File stats:', stats);
            next();
        } else {
            console.log('File not found:', filePath);
            res.status(404).send('Image not found');
        }
    } catch (error) {
        console.error('Error accessing file:', error);
        res.status(500).send('Error accessing file');
    }
});

// Allow popups from auth providers to be closed by the opener in dev
app.use((req, res, next) => {
  // This relaxes COOP to allow popup windows to communicate their closed state back to the opener
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});

// Routes
const userRoutes = require('./routes/userRoutes');
const itemRoutes = require('./routes/itemRoutes');
const contactRoutes = require('./routes/contactRoutes');
const authRoutes = require('./routes/authRoutes');

// Test route
app.get('/test', (req, res) => {
    res.send('Server is running');
});

app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/auth', authRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
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
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Initialize database schema
    await initializeDatabase();
    // Start server
    server.listen(PORT, () => {
      console.log(`\n🚀 Server is running on port ${PORT}`);
      console.log(`📍 API: http://localhost:${PORT}`);
      console.log(`💚 Health: http://localhost:${PORT}/health\n`);
      console.log(`🔌 Socket.IO running on port ${PORT}`);
    });
    // Socket.IO connection event
    io.on('connection', (socket) => {
      console.log('A user connected:', socket.id);
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = { app, server, io };
