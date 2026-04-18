const { pool } = require('../config/db');

// Submit a contact form message
exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate input
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Insert message into database
    const [result] = await pool.query(
      'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [name, email, subject, message]
    );

    res.status(201).json({
      message: 'Message sent successfully',
      messageId: result.insertId
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({ message: 'Server error while submitting contact form' });
  }
};

// Get all contact messages (admin only)
exports.getAllMessages = async (req, res) => {
  try {
    const [messages] = await pool.query(
      'SELECT * FROM contact_messages ORDER BY created_at DESC'
    );

    res.status(200).json({
      count: messages.length,
      messages
    });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({ message: 'Server error while fetching contact messages' });
  }
};

// Update message status (admin only)
exports.updateMessageStatus = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status } = req.body;

    // Validate input
    if (!status || !['new', 'read', 'replied'].includes(status)) {
      return res.status(400).json({ message: 'Please provide a valid status' });
    }

    // Update message status
    const [result] = await pool.query(
      'UPDATE contact_messages SET status = ? WHERE id = ?',
      [status, messageId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.status(200).json({ message: 'Message status updated successfully' });
  } catch (error) {
    console.error('Error updating message status:', error);
    res.status(500).json({ message: 'Server error while updating message status' });
  }
};