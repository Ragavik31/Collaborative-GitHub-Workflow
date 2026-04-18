const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { protect, restrictTo } = require('../middleware/auth');

// Submit a contact form message (public route)
router.post('/', contactController.submitContactForm);

// Get all contact messages (admin only)
router.get('/', protect, restrictTo('admin'), contactController.getAllMessages);

// Update message status (admin only)
router.put('/:messageId', protect, restrictTo('admin'), contactController.updateMessageStatus);

module.exports = router;