const pool = require("../config/database");

const operatorController = {
  // Get the operator_id linked to the current user
  getOperatorId: async (userId) => {
    if (!userId) return null;
    try {
      const [rows] = await pool.execute("SELECT id FROM operators WHERE user_id = ?", [userId]);
      if (rows.length > 0) return rows[0].id;

      // Auto-create operator profile if user has 'operator' role
      const [user] = await pool.execute("SELECT name, email, role FROM users WHERE id = ?", [userId]);
      if (user.length > 0 && user[0].role === 'operator') {
         const [result] = await pool.execute(
           "INSERT INTO operators (user_id, name, contact_email) VALUES (?, ?, ?)",
           [userId, user[0].name, user[0].email]
         );
         return result.insertId;
      }
      return null;
    } catch (error) {
      console.error("Error in getOperatorId:", error);
      return null;
    }
  },

  // 1. Promotions
  getPromotions: async (req, res) => {
    try {
      const opId = await operatorController.getOperatorId(req.user.id);
      if (!opId) return res.status(403).json({ message: "Operator profile not found" });
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
      if (!opId) return res.status(403).json({ message: "Operator profile not found" });
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
      console.error("Error fetching trips:", error);
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
      const opId = await operatorController.getOperatorId(req.user.id);
      // If opId is missing but role is operator, show at least global routes
      const [rows] = await pool.execute("SELECT * FROM routes WHERE operator_id IS NULL OR operator_id = ? ORDER BY created_at DESC", [opId || 0]);
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
      console.error("Error fetching passengers:", error);
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
      console.error("Error fetching seats:", error);
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
  },

  // 8. Create Route
  createRoute: async (req, res) => {
    try {
      const opId = await operatorController.getOperatorId(req.user.id);
      const { from_city, to_city, distance, duration, base_price, is_active } = req.body;
      
      const [result] = await pool.execute(
        "INSERT INTO routes (from_city, to_city, distance, duration, operator_id, base_price, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [from_city, to_city, distance, duration, opId, base_price, is_active ?? true]
      );
      
      res.status(201).json({ message: "Route created", id: result.insertId });
    } catch (error) {
      res.status(500).json({ message: "Error creating route", error: error.message });
    }
  },

  // 9. Create Trip
  createTrip: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const opId = await operatorController.getOperatorId(req.user.id);
      let { route_id, bus_info, capacity, departs_at, arrives_at, price_multiplier, status } = req.body;

      // First, we need a schedule_id to link trip_instance. 
      let [schedules] = await connection.execute(
        "SELECT id FROM trip_schedules WHERE route_id = ? AND operator_id = ? LIMIT 1",
        [route_id, opId]
      );

      let scheduleId;
      if (schedules.length === 0) {
        // Create a phantom schedule
        const [route] = await connection.execute("SELECT from_city, to_city, base_price FROM routes WHERE id = ?", [route_id]);
        if (route.length === 0) throw new Error("Route not found");

        const departTime = departs_at.split('T')[1]?.substring(0, 8) || '00:00:00';
        const arriveTime = arrives_at.split('T')[1]?.substring(0, 8) || '00:00:00';

        const [schedResult] = await connection.execute(
          "INSERT INTO trip_schedules (route_id, operator_id, departure_time, arrival_time, price, days_of_week) VALUES (?, ?, ?, ?, ?, ?)",
          [route_id, opId, departTime, arriveTime, route[0].base_price, ''] // Empty string for days means not repeating
        );
        scheduleId = schedResult.insertId;
      } else {
        scheduleId = schedules[0].id;
      }

      // Create Trip Instance
      const [tripResult] = await connection.execute(
        "INSERT INTO trip_instances (schedule_id, departure_datetime, arrival_datetime, status, bus_info, capacity, price_multiplier) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [scheduleId, departs_at, arrives_at, status || 'scheduled', bus_info || 'Unknown Bus', capacity || 36, price_multiplier || 1.0]
      );
      const tripId = tripResult.insertId;

      // Initialize Seats based on provided capacity
      const finalCapacity = capacity || 36;
      for (let i = 1; i <= finalCapacity; i++) {
        const row = Math.ceil(i / 2);
        const col = i % 2 === 1 ? 'A' : 'B';
        const seatNum = `${col}${row}`;
        await connection.execute("INSERT INTO seats (trip_instance_id, seat_number, status) VALUES (?, ?, 'available')", [tripId, seatNum]);
      }

      await connection.commit();
      res.status(201).json({ message: "Trip created", id: tripId });
    } catch (error) {
      await connection.rollback();
      res.status(500).json({ message: "Error creating trip", error: error.message });
    } finally {
      connection.release();
    }
  }
};

module.exports = operatorController;
