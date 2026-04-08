const pool = require("../config/database");

const operatorController = {
  // Get the operator_id linked to the current user
  getOperatorId: async (userId) => {
    const [rows] = await pool.execute("SELECT id FROM operators WHERE user_id = ?", [userId]);
    return rows[0]?.id;
  },

  // 1. Promotions
  getPromotions: async (req, res) => {
    try {
      const opId = await operatorController.getOperatorId(req.user.id);
      const [rows] = await pool.execute("SELECT * FROM promotions WHERE operator_id = ?", [opId]);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: "Error fetching promotions", error: error.message });
    }
  },

  createPromotion: async (req, res) => {
    try {
      const opId = await operatorController.getOperatorId(req.user.id);
      const { code, discount_type, discount_value, min_order_value, max_uses, valid_from, valid_until } = req.body;
      const [result] = await pool.execute(
        "INSERT INTO promotions (operator_id, code, discount_type, discount_value, min_order_value, max_uses, valid_from, valid_until) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [opId, code, discount_type, discount_value, min_order_value || 0, max_uses || 100, valid_from, valid_until]
      );
      res.status(201).json({ message: "Promotion created", id: result.insertId });
    } catch (error) {
      res.status(500).json({ message: "Error creating promotion", error: error.message });
    }
  },

  // 2. Trip Management
  getTrips: async (req, res) => {
    try {
      const opId = await operatorController.getOperatorId(req.user.id);
      const { routeId } = req.query;
      
      let query = `
        SELECT ti.*, ts.departure_time, ts.arrival_time, ts.price, r.from_city, r.to_city
        FROM trip_instances ti
        JOIN trip_schedules ts ON ti.schedule_id = ts.id
        JOIN routes r ON ts.route_id = r.id
        WHERE ts.operator_id = ?
      `;
      const params = [opId];

      if (routeId) {
        query += " AND r.id = ?";
        params.push(routeId);
      }

      query += " ORDER BY ti.departure_datetime DESC";

      const [rows] = await pool.execute(query, params);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: "Error fetching trips", error: error.message });
    }
  },

  updateTripStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await pool.execute("UPDATE trip_instances SET status = ? WHERE id = ?", [status, id]);
      res.json({ message: "Trip status updated" });
    } catch (error) {
      res.status(500).json({ message: "Error updating trip status", error: error.message });
    }
  },

  // 3. Route Management (Can view available routes or request new ones - simplifying for now)
  getRoutes: async (req, res) => {
    try {
      const [rows] = await pool.execute("SELECT * FROM routes");
      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: "Error fetching routes", error: error.message });
    }
  },

  // 4. Passenger View
  getPassengersByTrip: async (req, res) => {
    try {
      const { instanceId } = req.params;
      const [rows] = await pool.execute(`
        SELECT b.id as booking_id, u.name as passenger_name, u.phone as passenger_phone, 
               b.booking_time, b.status, b.pickup_point, b.dropoff_point,
               GROUP_CONCAT(s.seat_number) as seats
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        JOIN booking_details bd ON b.id = bd.booking_id
        JOIN seats s ON bd.seat_id = s.id
        WHERE b.trip_instance_id = ?
        GROUP BY b.id
      `, [instanceId]);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: "Error fetching passengers", error: error.message });
    }
  },

  // 5. Seat View
  getTripSeats: async (req, res) => {
    try {
      const { instanceId } = req.params;
      const [rows] = await pool.execute(`
        SELECT s.id, s.seat_number, s.status, 
               u.name as passenger_name, b.id as booking_id
        FROM seats s
        LEFT JOIN (
           SELECT bd.seat_id, b.status, b.id, b.user_id
           FROM booking_details bd 
           JOIN bookings b ON bd.booking_id = b.id
           WHERE b.status != 'cancelled'
        ) b ON s.id = b.seat_id
        LEFT JOIN users u ON b.user_id = u.id
        WHERE s.trip_instance_id = ?
        GROUP BY s.id, s.seat_number, s.status, u.name, b.id
        ORDER BY LENGTH(s.seat_number), s.seat_number
      `, [instanceId]);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: "Error fetching seats", error: error.message });
    }
  },

  // 6. Global Passenger List
  getAllPassengers: async (req, res) => {
    try {
      const opId = await operatorController.getOperatorId(req.user.id);
      const [rows] = await pool.execute(`
        SELECT b.id as booking_id, u.name as passenger_name, u.phone as passenger_phone, 
               b.booking_time, b.status, b.pickup_point, b.dropoff_point,
               GROUP_CONCAT(s.seat_number) as seats,
               r.from_city, r.to_city, ti.departure_datetime
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        JOIN booking_details bd ON b.id = bd.booking_id
        JOIN seats s ON bd.seat_id = s.id
        JOIN trip_instances ti ON b.trip_instance_id = ti.id
        JOIN trip_schedules ts ON ti.schedule_id = ts.id
        JOIN routes r ON ts.route_id = r.id
        WHERE ts.operator_id = ?
        GROUP BY b.id
        ORDER BY ti.departure_datetime DESC
      `, [opId]);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: "Error fetching all passengers", error: error.message });
    }
  },
  // 6. Cancellation Requests
  getCancellationRequests: async (req, res) => {
    try {
      const opId = await operatorController.getOperatorId(req.user.id);
      const [rows] = await pool.execute(`
        SELECT cr.*, b.total_price, b.booking_time, u.name as passenger_name, 
               r.from_city, r.to_city, ti.departure_datetime
        FROM cancellation_requests cr
        JOIN bookings b ON cr.booking_id = b.id
        JOIN users u ON b.user_id = u.id
        JOIN trip_instances ti ON b.trip_instance_id = ti.id
        JOIN trip_schedules ts ON ti.schedule_id = ts.id
        JOIN routes r ON ts.route_id = r.id
        WHERE ts.operator_id = ? AND cr.status = 'pending'
        ORDER BY cr.created_at ASC
      `, [opId]);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: "Error fetching requests", error: error.message });
    }
  },

  handleCancellationRequest: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const { requestId } = req.params;
      const { status, resolution_reason } = req.body; // status: 'approved' or 'rejected'

      if (!['approved', 'rejected'].includes(status)) {
         throw new Error("Invalid status update");
      }

      // 1. Get request info
      const [requests] = await connection.execute(
        "SELECT booking_id FROM cancellation_requests WHERE id = ?",
        [requestId]
      );
      if (requests.length === 0) throw new Error("Request not found");
      const bookingId = requests[0].booking_id;

      // 2. Update request status
      await connection.execute(
        "UPDATE cancellation_requests SET status = ?, resolved_at = NOW() WHERE id = ?",
        [status, requestId]
      );

      // 3. If approved, cancel booking and free seats
      if (status === 'approved') {
        await connection.execute(
          "UPDATE bookings SET status = 'cancelled', cancelled_at = NOW(), cancelled_by = 'operator' WHERE id = ?",
          [bookingId]
        );

        // Free seats
        const [details] = await connection.execute(
           "SELECT seat_id FROM booking_details WHERE booking_id = ?", 
           [bookingId]
        );
        for (const detail of details) {
          await connection.execute("UPDATE seats SET status = 'available' WHERE id = ?", [detail.seat_id]);
        }
      }

      await connection.commit();
      res.json({ message: `Request ${status} successfully` });
    } catch (error) {
      await connection.rollback();
      res.status(500).json({ message: error.message });
    } finally {
      connection.release();
    }
  }
};

module.exports = operatorController;
