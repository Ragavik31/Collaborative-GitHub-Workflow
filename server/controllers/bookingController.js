const { pool } = require('../config/db');

// Get all available rooms
exports.getAvailableRooms = async (req, res) => {
  try {
    const { checkIn, checkOut, adults, children } = req.query;
    
    // Validate input
    if (!checkIn || !checkOut) {
      return res.status(400).json({ message: 'Please provide check-in and check-out dates' });
    }

    // Get available rooms that are not booked during the specified period
    const [availableRooms] = await pool.query(`
      SELECT r.id, r.room_number, rt.name, rt.description, rt.price_per_night, rt.capacity, rt.image_url
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.id
      WHERE r.status = 'available'
      AND r.id NOT IN (
        SELECT b.room_id
        FROM bookings b
        WHERE (b.check_in_date <= ? AND b.check_out_date >= ?)
        OR (b.check_in_date <= ? AND b.check_out_date >= ?)
        OR (b.check_in_date >= ? AND b.check_out_date <= ?)
      )
      ORDER BY rt.price_per_night ASC
    `, [checkOut, checkIn, checkIn, checkOut, checkIn, checkOut]);

    // Filter by capacity if provided
    let filteredRooms = availableRooms;
    if (adults || children) {
      const totalGuests = (parseInt(adults) || 0) + (parseInt(children) || 0);
      filteredRooms = availableRooms.filter(room => room.capacity >= totalGuests);
    }

    res.status(200).json({
      count: filteredRooms.length,
      rooms: filteredRooms
    });
  } catch (error) {
    console.error('Error fetching available rooms:', error);
    res.status(500).json({ message: 'Server error while fetching available rooms' });
  }
};

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const { roomId, checkInDate, checkOutDate, adults, children, guestName, guestEmail } = req.body;

    // Validate input
    if (!roomId || !checkInDate || !checkOutDate || !adults) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if room exists and is available
    const [rooms] = await pool.query(`
      SELECT r.id, rt.price_per_night
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.id
      WHERE r.id = ? AND r.status = 'available'
    `, [roomId]);

    if (rooms.length === 0) {
      return res.status(404).json({ message: 'Room not found or not available' });
    }

    // Check if room is already booked for the selected dates
    const [existingBookings] = await pool.query(`
      SELECT id FROM bookings
      WHERE room_id = ?
      AND (
        (check_in_date <= ? AND check_out_date >= ?)
        OR (check_in_date <= ? AND check_out_date >= ?)
        OR (check_in_date >= ? AND check_out_date <= ?)
      )
      AND status IN ('pending', 'confirmed')
    `, [roomId, checkOutDate, checkInDate, checkInDate, checkOutDate, checkInDate, checkOutDate]);

    if (existingBookings.length > 0) {
      return res.status(400).json({ message: 'Room is already booked for the selected dates' });
    }

    // Calculate total price
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const totalPrice = rooms[0].price_per_night * nights;

    // Create booking
    const [result] = await pool.query(`
      INSERT INTO bookings (room_id, check_in_date, check_out_date, adults, children, guest_name, guest_email, total_price, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [roomId, checkInDate, checkOutDate, adults, children || 0, guestName, guestEmail, totalPrice]);

    res.status(201).json({
      message: 'Booking created successfully',
      bookingId: result.insertId,
      totalPrice
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Server error while creating booking' });
  }
};

// Get user's bookings
exports.getUserBookings = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ message: 'Please provide email address' });
    }

    const [bookings] = await pool.query(`
      SELECT b.id, b.check_in_date, b.check_out_date, b.adults, b.children, b.total_price, b.status,
             r.room_number, rt.name as room_type, rt.image_url
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      JOIN room_types rt ON r.room_type_id = rt.id
      WHERE b.guest_email = ?
      ORDER BY b.created_at DESC
    `, [email]);

    res.status(200).json({
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ message: 'Server error while fetching bookings' });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    // Check if booking exists and belongs to the user
    const [bookings] = await pool.query(
      'SELECT * FROM bookings WHERE id = ? AND user_id = ?',
      [bookingId, userId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if booking can be cancelled (not already completed or cancelled)
    if (bookings[0].status === 'completed' || bookings[0].status === 'cancelled') {
      return res.status(400).json({ message: `Booking cannot be cancelled as it is already ${bookings[0].status}` });
    }

    // Update booking status to cancelled
    await pool.query(
      'UPDATE bookings SET status = "cancelled" WHERE id = ?',
      [bookingId]
    );

    res.status(200).json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ message: 'Server error while cancelling booking' });
  }
};