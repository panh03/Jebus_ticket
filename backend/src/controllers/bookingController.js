const pool = require("../config/db");
const fs = require('fs');

const parsePointOptions = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch (error) {
    return String(value).split(/\r?\n|,/).map(point => point.trim()).filter(Boolean);
  }
  return [];
};

const bookingController = {
  create: async (req, res) => {
    let connection;
    try {
      if (req.user.role !== 'user') {
        return res.status(403).json({ message: "Only passengers can book tickets" });
      }

      connection = await pool.getConnection();
      await connection.beginTransaction();

      const { trip_instance_id, seat_ids, total_price, payment_method, pickup_point, dropoff_point, points_used = 0 } = req.body;

      const [routeRows] = await connection.execute(
        `SELECT r.pickup_points, r.dropoff_points
         FROM trip_instances ti
         JOIN trip_schedules ts ON ti.schedule_id = ts.id
         JOIN routes r ON ts.route_id = r.id
         WHERE ti.id = ?`,
        [trip_instance_id]
      );

      if (routeRows.length === 0) throw new Error("Trip not found");
      const allowedPickupPoints = parsePointOptions(routeRows[0].pickup_points);
      const allowedDropoffPoints = parsePointOptions(routeRows[0].dropoff_points);
      if (!allowedPickupPoints.includes(pickup_point)) {
        throw new Error("Invalid pickup point for this route");
      }
      if (!allowedDropoffPoints.includes(dropoff_point)) {
        throw new Error("Invalid drop-off point for this route");
      }

      // Check current points and calculate max redeemable
      const [userRows] = await connection.execute("SELECT total_points FROM users WHERE id = ?", [req.user.id]);
      const currentPoints = userRows[0].total_points || 0;

      // For validation, we need the original ticket value. Assuming total_price is the final cash amount.
      // So original value = total_price + points_used * 10000;
      const originalValue = total_price + points_used * 10000;

      if (points_used > 0) {
        if (currentPoints < 10) throw new Error("Minimum balance of 10 points required to unlock redemption");
        if (points_used < 5) throw new Error("Minimum redemption is 5 points");
        if (points_used > 10) throw new Error("Maximum redemption is 10 points");
        if (points_used * 10000 > originalValue * 0.5) throw new Error("Cannot redeem points for more than 50% of the ticket value");

        const [reservedRows] = await connection.execute(
          `SELECT SUM(b.points_earned) as reserved 
           FROM bookings b 
           JOIN trip_instances ti ON b.trip_instance_id = ti.id 
           WHERE b.user_id = ? AND b.status IN ('confirmed') AND ti.departure_datetime > NOW()`,
          [req.user.id]
        );
        const reservedPoints = reservedRows[0].reserved || 0;
        const maxRedeemable = currentPoints - reservedPoints;
        if (points_used > maxRedeemable) {
          throw new Error(`Exceeds maximum redeemable points (Reserved for upcoming trips). Max available: ${maxRedeemable}`);
        }
      }

      const points_earned = seat_ids.length;

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
        "INSERT INTO bookings (user_id, trip_instance_id, total_price, status, pickup_point, dropoff_point, points_earned, points_used) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)",
        [req.user.id, trip_instance_id, total_price, pickup_point, dropoff_point, points_earned, points_used]
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

      // 6. Update user points
      if (points_used > 0) {
        await connection.execute(
          "UPDATE users SET total_points = total_points - ? WHERE id = ?",
          [points_used, req.user.id]
        );
        await connection.execute(
          "INSERT INTO points_history (user_id, transaction_type, amount, description, booking_id) VALUES (?, 'redeemed', ?, ?, ?)",
          [req.user.id, points_used, `Redeemed for ticket #${bookingId}`, bookingId]
        );
      }
      
      if (points_earned > 0) {
        await connection.execute(
          "UPDATE users SET total_points = total_points + ? WHERE id = ?",
          [points_earned, req.user.id]
        );
        await connection.execute(
          "INSERT INTO points_history (user_id, transaction_type, amount, description, booking_id) VALUES (?, 'earned', ?, ?, ?)",
          [req.user.id, points_earned, `Earned from ticket #${bookingId}`, bookingId]
        );
      }

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

      // Check points revocation logic
      const [userRows] = await connection.execute("SELECT total_points FROM users WHERE id = ?", [booking.user_id]);
      const currentPoints = userRows[0].total_points || 0;
      
      const pointsToRevoke = booking.points_earned;
      const pointsToRefund = booking.points_used;
      
      if (currentPoints < pointsToRevoke) {
        throw new Error(`Insufficient points to cancel this ticket (${pointsToRevoke} point required for revocation). Please contact our hotline for assistance.`);
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

      // Refund & Revoke Points
      if (pointsToRefund > 0) {
        await connection.execute(
          "UPDATE users SET total_points = total_points + ? WHERE id = ?",
          [pointsToRefund, booking.user_id]
        );
        await connection.execute(
          "INSERT INTO points_history (user_id, transaction_type, amount, description, booking_id) VALUES (?, 'refunded', ?, ?, ?)",
          [booking.user_id, pointsToRefund, `Refunded from ticket #${id}`, id]
        );
      }
      
      if (pointsToRevoke > 0) {
        await connection.execute(
          "UPDATE users SET total_points = total_points - ? WHERE id = ?",
          [pointsToRevoke, booking.user_id]
        );
        await connection.execute(
          "INSERT INTO points_history (user_id, transaction_type, amount, description, booking_id) VALUES (?, 'revoked', ?, ?, ?)",
          [booking.user_id, pointsToRevoke, `Revoked from ticket #${id}`, id]
        );
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
