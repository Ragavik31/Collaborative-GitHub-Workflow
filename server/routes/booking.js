const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// Get available rooms (public route)
router.get('/available-rooms', bookingController.getAvailableRooms);

// Create a new booking (protected route)
router.post('/', protect, bookingController.createBooking);

// Get user's bookings (protected route)
router.get('/my-bookings', protect, bookingController.getUserBookings);

// Cancel booking (protected route)
router.put('/cancel/:bookingId', protect, bookingController.cancelBooking);

module.exports = router;