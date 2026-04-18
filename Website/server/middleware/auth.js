const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// Middleware to verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists
    const [users] = await pool.query('SELECT id, email, role FROM users WHERE id = ?', [decoded.id]);

    if (users.length === 0) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    // Add user to request object
    req.user = users[0];
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Middleware to restrict access to admin users
exports.restrictTo = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ message: 'Not authorized to access this resource' });
    }
    next();
  };
};