-- Create the hotel_management database if it doesn't exist
CREATE DATABASE IF NOT EXISTS hotel_management;
USE hotel_management;

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('guest', 'admin') DEFAULT 'guest',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Room types table
CREATE TABLE IF NOT EXISTS room_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  price_per_night DECIMAL(10, 2) NOT NULL,
  capacity INT NOT NULL,
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_number VARCHAR(10) NOT NULL UNIQUE,
  room_type_id INT NOT NULL,
  status ENUM('available', 'occupied', 'maintenance') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (room_type_id) REFERENCES room_types(id)
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  room_id INT NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  adults INT NOT NULL DEFAULT 1,
  children INT NOT NULL DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- Contact messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('new', 'read', 'replied') DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample room types
INSERT INTO room_types (name, description, price_per_night, capacity, image_url) VALUES
('Standard Room', 'Comfortable room with basic amenities', 100.00, 2, '/images/standard-room.jpg'),
('Deluxe Room', 'Spacious room with premium amenities', 150.00, 2, '/images/deluxe-room.jpg'),
('Suite', 'Luxury suite with separate living area', 250.00, 4, '/images/suite.jpg'),
('Family Room', 'Large room suitable for families', 200.00, 6, '/images/family-room.jpg');

-- Insert sample rooms
INSERT INTO rooms (room_number, room_type_id, status) VALUES
('101', 1, 'available'),
('102', 1, 'available'),
('201', 2, 'available'),
('202', 2, 'available'),
('301', 3, 'available'),
('401', 4, 'available');