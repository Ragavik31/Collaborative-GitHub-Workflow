import express from "express";
import mysql from "mysql2";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "../Website")));

// ==================== DB CONFIG (FINAL FIX) ====================

// ✅ Connection pool (stable)
const db = mysql.createPool({
  host: "db",
  user: "user",
  password: "user123",
  database: "hotel_management",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ✅ Retry connection (IMPORTANT)
const checkDBConnection = () => {
  db.getConnection((err, conn) => {
    if (err) {
      console.log("⏳ Waiting for MySQL...", err.code);
      setTimeout(checkDBConnection, 3000);
    } else {
      console.log("✅ MySQL Connected Successfully");
      conn.release();
    }
  });
};

// Wait before first try (VERY IMPORTANT)
setTimeout(checkDBConnection, 8000);

// ==================== API ROUTES ====================

// Get all rooms
app.get("/api/rooms", (req, res) => {
  const { page = 1, limit = 10, q = "", status = "" } = req.query;
  const offset = (page - 1) * limit;

  let where = "WHERE 1=1";
  let params = [];

  if (q) {
    where += " AND (number LIKE ? OR type LIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }
  if (status) {
    where += " AND status=?";
    params.push(status);
  }

  db.query(`SELECT COUNT(*) AS total FROM rooms ${where}`, params, (err, countResult) => {
    if (err) return res.status(500).json({ error: err.message });

    db.query(
      `SELECT * FROM rooms ${where} LIMIT ?, ?`,
      [...params, Number(offset), Number(limit)],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ total: countResult[0].total, rows });
      }
    );
  });
});

// Add room
app.post("/api/rooms", (req, res) => {
  const { number, type, capacity, price_per_night, status } = req.body;

  if (!number || !type || !capacity || !price_per_night) {
    return res.status(400).json({ error: "Missing room details" });
  }

  db.query(
    "INSERT INTO rooms (number, type, capacity, price_per_night, status) VALUES (?, ?, ?, ?, ?)",
    [number, type, capacity, price_per_night, status || "available"],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "✅ Room added successfully", roomId: result.insertId });
    }
  );
});

// Delete room
app.delete("/api/rooms/:id", (req, res) => {
  db.query("DELETE FROM rooms WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "✅ Room deleted" });
  });
});

// Update room status
app.patch("/api/rooms/:id/status", (req, res) => {
  const { status } = req.body;

  if (!status || !["available", "booked", "maintenance"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  db.query("UPDATE rooms SET status=? WHERE id=?", [status, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "✅ Room status updated", status });
  });
});

// ================= BOOKINGS =================

// Get bookings
app.get("/api/bookings", (req, res) => {
  const { page = 1, limit = 10, q = "" } = req.query;
  const offset = (page - 1) * limit;

  let where = "WHERE 1=1";
  let params = [];

  if (q) {
    where += " AND (b.guest_name LIKE ? OR b.guest_phone LIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }

  db.query(`SELECT COUNT(*) AS total FROM bookings b ${where}`, params, (err, countResult) => {
    if (err) return res.status(500).json({ error: err.message });

    db.query(
      `SELECT b.*, r.number AS room_number, r.type AS room_type
       FROM bookings b 
       JOIN rooms r ON b.room_id = r.id
       ${where} LIMIT ?, ?`,
      [...params, Number(offset), Number(limit)],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ total: countResult[0].total, rows });
      }
    );
  });
});

// Add booking
app.post("/api/bookings", (req, res) => {
  const { guest_name, room_id, check_in, check_out } = req.body;

  if (!guest_name || !room_id || !check_in || !check_out) {
    return res.status(400).json({ error: "Missing booking details" });
  }

  db.query(
    "INSERT INTO bookings (guest_name, room_id, check_in, check_out) VALUES (?, ?, ?, ?)",
    [guest_name, room_id, check_in, check_out],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "✅ Booking created", id: result.insertId });
    }
  );
});

// ================= STAFF =================

// Get staff
app.get("/api/staff", (req, res) => {
  db.query("SELECT * FROM staff", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add staff
app.post("/api/staff", (req, res) => {
  const { name, role } = req.body;

  if (!name || !role) {
    return res.status(400).json({ error: "Missing staff details" });
  }

  db.query(
    "INSERT INTO staff (name, role) VALUES (?, ?)",
    [name, role],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "✅ Staff added", id: result.insertId });
    }
  );
});

// ================= FRONTEND =================

// fallback route
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../Website/home.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});