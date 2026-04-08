const pool = require("../config/database");
const fs = require('fs');

const bookingController = {
  create: async (req, res) => {
    let connection;
    try {
      if (req.user.role !== 'user') {
        return res.status(403).json({ message: "Only passengers can book tickets" });
      }

      connection = await pool.getConnection();
      await connection.beginTransaction();

      const { trip_instance_id, seat_ids, total_price, payment_method, pickup_point, dropoff_point } = req.body;

      // 1. Check if seats are available
      const [seats] = await connection.query(
        "SELECT id FROM seats WHERE id IN (?) AND status = 'available' AND trip_instance_id = ?",
        [seat_ids, trip_instance_id]
      );

      if (seats.length !== seat_ids.length) {
        throw new Error("One or more selected seats are no longer available");
      }

      // 2. Create booking
      const [bookingResult] = await connection.execute(
        "INSERT INTO bookings (user_id, trip_instance_id, total_price, status, pickup_point, dropoff_point) VALUES (?, ?, ?, 'pending', ?, ?)",
        [req.user.id, trip_instance_id, total_price, pickup_point, dropoff_point]
      );
      const bookingId = bookingResult.insertId;

      // 3. Mark seats as booked & Create booking details
      for (const seatId of seat_ids) {
        await connection.execute(
          "UPDATE seats SET status = 'booked' WHERE id = ?",
          [seatId]
        );
        await connection.execute(
          "INSERT INTO booking_details (booking_id, seat_id, price) VALUES (?, ?, ?)",
          [bookingId, seatId, total_price / seat_ids.length]
        );
      }

      // 4. Create payment (Simulation)
      await connection.execute(
        "INSERT INTO payments (booking_id, method, status, payment_time) VALUES (?, ?, 'completed', NOW())",
        [bookingId, payment_method]
      );

      // 5. Update booking status & set paid_at
      await connection.execute(
        "UPDATE bookings SET status = 'confirmed', paid_at = NOW() WHERE id = ?",
        [bookingId]
      );

      await connection.commit();
      res.status(201).json({ message: "Booking confirmed", bookingId });

    } catch (error) {
      if (connection) await connection.rollback();
      console.error(error);
      fs.appendFileSync('debug.log', `[${new Date().toISOString()}] Booking error: ${error.stack}\n`);
      res.status(500).json({ message: "Booking failed", error: error.message });
    } finally {
      if (connection) connection.release();
    }
  },

  cancel: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const { id } = req.params;

      // Check time constraint
      const [bookings] = await pool.execute(
        `SELECT b.*, ti.departure_datetime 
         FROM bookings b 
         JOIN trip_instances ti ON b.trip_instance_id = ti.id 
         WHERE b.id = ?`,
        [id]
      );

      if (bookings.length === 0) throw new Error("Booking not found");
      const booking = bookings[0];

      if (booking.status === 'cancelled') throw new Error("Already cancelled");

      const hoursUntilDeparture = (new Date(booking.departure_datetime) - new Date()) / (1000 * 60 * 60);

      if (hoursUntilDeparture <= 24) {
        throw new Error("Direct cancellation only allowed more than 24 hours before departure");
      }

      // Update booking
      await connection.execute(
        "UPDATE bookings SET status = 'cancelled', cancelled_at = NOW(), cancelled_by = 'user' WHERE id = ?",
        [id]
      );

      // Free seats
      const [details] = await connection.execute("SELECT seat_id FROM booking_details WHERE booking_id = ?", [id]);
      for (const detail of details) {
        await connection.execute("UPDATE seats SET status = 'available' WHERE id = ?", [detail.seat_id]);
      }

      await connection.commit();
      res.json({ message: "Booking cancelled successfully" });
    } catch (error) {
      await connection.rollback();
      res.status(500).json({ message: error.message });
    } finally {
      connection.release();
    }
  },

  cancelRequest: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const [bookings] = await pool.execute(
        `SELECT b.*, ti.departure_datetime 
         FROM bookings b 
         JOIN trip_instances ti ON b.trip_instance_id = ti.id 
         WHERE b.id = ?`,
        [id]
      );

      if (bookings.length === 0) throw new Error("Booking not found");
      const booking = bookings[0];

      const hoursUntilDeparture = (new Date(booking.departure_datetime) - new Date()) / (1000 * 60 * 60);

      if (hoursUntilDeparture <= 2) {
        throw new Error("Cancellation requests are not allowed within 2 hours of departure");
      }

      await pool.execute(
        "INSERT INTO cancellation_requests (booking_id, requested_by, status, reason) VALUES (?, ?, 'pending', ?)",
        [id, booking.user_id, reason]
      );

      res.json({ message: "Cancellation request sent" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getUserBookings: async (req, res) => {
    try {
      const { userId } = req.params;
      const [bookings] = await pool.execute(
        `SELECT b.*, ti.departure_datetime, r.from_city, r.to_city, o.name as operator_name,
         GROUP_CONCAT(s.seat_number) as seat_numbers
         FROM bookings b
         JOIN trip_instances ti ON b.trip_instance_id = ti.id
         JOIN trip_schedules ts ON ti.schedule_id = ts.id
         JOIN routes r ON ts.route_id = r.id
         JOIN operators o ON ts.operator_id = o.id
         JOIN booking_details bd ON b.id = bd.booking_id
         JOIN seats s ON bd.seat_id = s.id
         WHERE b.user_id = ?
         GROUP BY b.id
         ORDER BY b.booking_time DESC`,
        [userId]
      );
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user bookings", error: error.message });
    }
  }
};

module.exports = bookingController;
