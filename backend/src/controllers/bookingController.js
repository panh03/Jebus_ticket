const pool = require("../config/database");

const bookingController = {
  create: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const { user_id, trip_instance_id, seat_ids, total_price, payment_method } = req.body;

      // 1. Check if seats are available
      const [seats] = await connection.execute(
        "SELECT id FROM seats WHERE id IN (?) AND status = 'available' AND trip_instance_id = ?",
        [seat_ids, trip_instance_id]
      );

      if (seats.length !== seat_ids.length) {
        throw new Error("One or more selected seats are no longer available");
      }

      // 2. Create booking
      const [bookingResult] = await connection.execute(
        "INSERT INTO bookings (user_id, trip_instance_id, total_price, status) VALUES (?, ?, ?, 'pending')",
        [user_id, trip_instance_id, total_price]
      );
      const bookingId = bookingResult.insertId;

      // 3. Mark seats as booked & Create booking details
      for (const seatId of seat_ids) {
        await connection.execute(
          "UPDATE seats SET status = 'booked' WHERE id = ?",
          [seatId]
        );
        // Assuming individual price = total / count
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

      // 5. Update booking status
      await connection.execute(
        "UPDATE bookings SET status = 'confirmed' WHERE id = ?",
        [bookingId]
      );

      await connection.commit();
      res.status(201).json({ message: "Booking confirmed", bookingId });

    } catch (error) {
      await connection.rollback();
      console.error(error);
      res.status(500).json({ message: "Booking failed", error: error.message });
    } finally {
      connection.release();
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
