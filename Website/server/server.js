const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import database connection
const { testConnection } = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/booking');
const contactRoutes = require('./routes/contact');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the outer layer
app.use(express.static(path.join(__dirname, '..')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/contact', contactRoutes);

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'home.html'));
});

// Catch-all route for other pages
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', 'home.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Test database connection
  const dbConnected = await testConnection();
  if (dbConnected) {
    console.log('Database connection successful');
  } else {
    console.error('Database connection failed');
  }
});