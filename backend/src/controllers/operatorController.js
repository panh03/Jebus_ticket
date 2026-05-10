const pool = require("../config/db");

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
        SELECT ti.*, ts.departure_time, ts.arrival_time, ts.price, r.from_city, r.to_city,
               (SELECT COUNT(*) FROM bookings b WHERE b.trip_instance_id = ti.id AND b.status != 'cancelled') as booking_count
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

  updateTrip: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const { id } = req.params;
      const { bus_info, capacity, departs_at, arrives_at, price_multiplier, status } = req.body;

      // 1. Get current trip info
      const [oldTrip] = await connection.execute("SELECT capacity FROM trip_instances WHERE id = ?", [id]);
      if (oldTrip.length === 0) throw new Error("Trip not found");

      // 2. Update trip instance
      await connection.execute(
        "UPDATE trip_instances SET bus_info = ?, capacity = ?, departure_datetime = ?, arrival_datetime = ?, price_multiplier = ?, status = ? WHERE id = ?",
        [bus_info, capacity, departs_at, arrives_at, price_multiplier, status, id]
      );

      // 3. If capacity changed, re-sync seats (Warning: this is destructive to existing bookings if capacity decreases significantly)
      if (capacity !== oldTrip[0].capacity) {
        // Delete unused available seats or add new ones
        await connection.execute("DELETE FROM seats WHERE trip_instance_id = ? AND status = 'available'", [id]);
        
        // Re-add seats up to new capacity (ignoring already booked ones which were not deleted)
        const [bookedSeats] = await connection.execute("SELECT seat_number FROM seats WHERE trip_instance_id = ?", [id]);
        const bookedSet = new Set(bookedSeats.map(s => s.seat_number));

        for (let i = 1; i <= capacity; i++) {
          const row = Math.ceil(i / 2);
          const col = i % 2 === 1 ? 'A' : 'B';
          const seatNum = `${col}${row}`;
          if (!bookedSet.has(seatNum)) {
            await connection.execute("INSERT INTO seats (trip_instance_id, seat_number, status) VALUES (?, ?, 'available')", [id, seatNum]);
          }
        }
      }

      await connection.commit();
      res.json({ message: "Trip updated successfully" });
    } catch (error) {
      await connection.rollback();
      res.status(500).json({ message: "Error updating trip", error: error.message });
    } finally {
      connection.release();
    }
  },

  deleteTrip: async (req, res) => {
    try {
      const { id } = req.params;
      // Check for bookings
      const [bookings] = await pool.execute("SELECT id FROM bookings WHERE trip_instance_id = ? AND status != 'cancelled'", [id]);
      if (bookings.length > 0) {
        return res.status(400).json({ message: "Cannot delete trip with active bookings. Cancel them first." });
      }
      
      // Delete in correct order (seats first, though cascading might be set)
      await pool.execute("DELETE FROM seats WHERE trip_instance_id = ?", [id]);
      await pool.execute("DELETE FROM trip_instances WHERE id = ?", [id]);
      
      res.json({ message: "Trip removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting trip", error: error.message });
    }
  },

  // 3. Route Management (Can view available routes or request new ones - simplifying for now)
  getRoutes: async (req, res) => {
    try {
      const opId = await operatorController.getOperatorId(req.user.id);
      const [routes] = await pool.execute(`
        SELECT r.*, 
               (SELECT COUNT(*) FROM trip_instances ti 
                JOIN trip_schedules ts ON ti.schedule_id = ts.id 
                WHERE ts.route_id = r.id AND ti.status NOT IN ('completed', 'cancelled')) as active_trips
        FROM routes r 
        WHERE r.operator_id = ? OR r.operator_id IS NULL
        ORDER BY r.created_at DESC
      `, [opId]);
      res.json(routes);
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
        const [bookingRows] = await connection.execute("SELECT user_id, points_used, points_earned FROM bookings WHERE id = ?", [bookingId]);
        const booking = bookingRows[0];

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

        // Refund points used
        if (booking.points_used > 0) {
          await connection.execute('UPDATE users SET total_points = total_points + ? WHERE id = ?', [booking.points_used, booking.user_id]);
          await connection.execute('INSERT INTO points_history (user_id, transaction_type, amount, description, booking_id) VALUES (?, "refunded", ?, "Refunded from operator cancellation", ?)', [booking.user_id, booking.points_used, bookingId]);
        }

        // Revoke points earned
        if (booking.points_earned > 0) {
          await connection.execute('UPDATE users SET total_points = GREATEST(0, total_points - ?) WHERE id = ?', [booking.points_earned, booking.user_id]);
          await connection.execute('INSERT INTO points_history (user_id, transaction_type, amount, description, booking_id) VALUES (?, "revoked", ?, "Revoked from operator cancellation", ?)', [booking.user_id, booking.points_earned, bookingId]);
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

  updateRoute: async (req, res) => {
    try {
      const { id } = req.params;
      const opId = await operatorController.getOperatorId(req.user.id);
      const { from_city, to_city, distance, duration, base_price, is_active } = req.body;

      // Verify ownership
      const [route] = await pool.execute("SELECT id FROM routes WHERE id = ? AND operator_id = ?", [id, opId]);
      if (route.length === 0) return res.status(403).json({ message: "Forbidden or route not found" });

      await pool.execute(
        "UPDATE routes SET from_city = ?, to_city = ?, distance = ?, duration = ?, base_price = ?, is_active = ? WHERE id = ?",
        [from_city, to_city, distance, duration, base_price, is_active, id]
      );

      res.json({ message: "Route updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error updating route", error: error.message });
    }
  },

  deleteRoute: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const { id } = req.params;
      const opId = await operatorController.getOperatorId(req.user.id);

      // Verify ownership ( allow cleanup of global routes for now, or just operator's own )
      const [route] = await connection.execute("SELECT operator_id FROM routes WHERE id = ?", [id]);
      if (route.length === 0) {
         return res.status(404).json({ message: "Route not found" });
      }

      if (route[0].operator_id !== null && route[0].operator_id !== opId) {
         return res.status(403).json({ message: "Unauthorized to delete this route" });
      }

      // Check for active trips
      const [trips] = await connection.execute(`
        SELECT ti.id FROM trip_instances ti 
        JOIN trip_schedules ts ON ti.schedule_id = ts.id 
        WHERE ts.route_id = ? AND ti.status NOT IN ('completed', 'cancelled')
      `, [id]);
      
      if (trips.length > 0) {
        return res.status(400).json({ message: "Cannot delete route with active or upcoming trips. Cancel the trips first." });
      }

      await connection.execute("DELETE FROM routes WHERE id = ?", [id]);
      await connection.commit();
      res.json({ message: "Route removed successfully" });
    } catch (error) {
      if (connection) await connection.rollback();
      res.status(500).json({ message: "Database error during route deletion", error: error.message });
    } finally {
      if (connection) connection.release();
    }
  },

  // 9. Create Trip
  createTrip: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const opId = await operatorController.getOperatorId(req.user.id);
      let { route_id, bus_info, capacity, departs_at, arrives_at, price_multiplier, status, repeat_7_days } = req.body;

      const numInstances = repeat_7_days ? 7 : 1;
      const createdIds = [];

      for (let day = 0; day < numInstances; day++) {
        // Calculate dates for this instance without shifting time
        let [d_date, d_time] = departs_at.split('T');
        let [a_date, a_time] = arrives_at.split('T');
        
        let d_at = new Date(`${d_date}T00:00:00`);
        let a_at = new Date(`${a_date}T00:00:00`);
        d_at.setDate(d_at.getDate() + day);
        a_at.setDate(a_at.getDate() + day);

        const pad = n => n.toString().padStart(2, '0');
        const formatLocal = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

        const iso_departs = `${formatLocal(d_at)} ${d_time}:00`;
        const iso_arrives = `${formatLocal(a_at)} ${a_time}:00`;

        // Link/Create schedule
        let [schedules] = await connection.execute(
          "SELECT id FROM trip_schedules WHERE route_id = ? AND operator_id = ? LIMIT 1",
          [route_id, opId]
        );

        let scheduleId;
        if (schedules.length === 0) {
          const [route] = await connection.execute("SELECT base_price FROM routes WHERE id = ?", [route_id]);
          const departTime = iso_departs.split(' ')[1];
          const arriveTime = iso_arrives.split(' ')[1];
          const [schedRes] = await connection.execute(
            "INSERT INTO trip_schedules (route_id, operator_id, departure_time, arrival_time, price, days_of_week) VALUES (?, ?, ?, ?, ?, ?)",
            [route_id, opId, departTime, arriveTime, route[0].base_price, '']
          );
          scheduleId = schedRes.insertId;
        } else {
          scheduleId = schedules[0].id;
        }

        // Create Instance
        const [tripResult] = await connection.execute(
          "INSERT INTO trip_instances (schedule_id, departure_datetime, arrival_datetime, status, bus_info, capacity, price_multiplier) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [scheduleId, iso_departs, iso_arrives, status || 'scheduled', bus_info || 'Unknown Bus', capacity || 36, price_multiplier || 1.0]
        );
        const tripId = tripResult.insertId;
        createdIds.push(tripId);

        // Initialize Seats
        const finalCapacity = capacity || 36;
        for (let i = 1; i <= finalCapacity; i++) {
          const row = Math.ceil(i / 2);
          const col = i % 2 === 1 ? 'A' : 'B';
          const seatNum = `${col}${row}`;
          await connection.execute("INSERT INTO seats (trip_instance_id, seat_number, status) VALUES (?, ?, 'available')", [tripId, seatNum]);
        }
      }

      await connection.commit();
      res.status(201).json({ message: repeat_7_days ? "7 trips launched successfully" : "Trip created", ids: createdIds });
    } catch (error) {
      await connection.rollback();
      res.status(500).json({ message: "Error creating trip", error: error.message });
    } finally {
      connection.release();
    }
  },

  getPerformanceStats: async (req, res) => {
    try {
      const opId = await operatorController.getOperatorId(req.user.id);
      if (!opId) return res.status(403).json({ message: "Operator profile not found" });

      const { month, year } = req.query;
      if (!month || !year) {
        return res.status(400).json({ message: 'Month and year are required' });
      }

      const startDate = `${year}-${month.toString().padStart(2, '0')}-01 00:00:00`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay} 23:59:59`;

      // 1. Get daily completed trips using BETWEEN
      const [tripsData] = await pool.execute(`
        SELECT DATE_FORMAT(ti.departure_datetime, '%Y-%m-%d') as date, COUNT(*) as trip_count
        FROM trip_instances ti
        JOIN trip_schedules ts ON ti.schedule_id = ts.id
        WHERE ti.status = 'completed' 
        AND ts.operator_id = ?
        AND ti.departure_datetime BETWEEN ? AND ?
        GROUP BY date
        ORDER BY date ASC
      `, [opId, startDate, endDate]);

      // 2. Get daily revenue (based on departure time)
      const [revenueData] = await pool.execute(`
        SELECT DATE_FORMAT(ti.departure_datetime, '%Y-%m-%d') as date, SUM(b.total_price) as total_revenue
        FROM bookings b
        JOIN trip_instances ti ON b.trip_instance_id = ti.id
        JOIN trip_schedules ts ON ti.schedule_id = ts.id
        WHERE b.status IN ('confirmed', 'completed') 
        AND ts.operator_id = ?
        AND ti.departure_datetime BETWEEN ? AND ?
        GROUP BY date
        ORDER BY date ASC
      `, [opId, startDate, endDate]);

      // Merge data for the chart
      const stats = [];
      for (let i = 1; i <= lastDay; i++) {
          const dateStr = `${year}-${month.toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
          const dayTrips = tripsData.find(d => d.date === dateStr);
          const dayRev = revenueData.find(d => d.date === dateStr);
          stats.push({
              date: dateStr,
              displayDate: `${i}/${month}`,
              trips: dayTrips ? dayTrips.trip_count : 0,
              revenue: dayRev ? parseFloat(dayRev.total_revenue) || 0 : 0
          });
      }

      // 3. Get trip status distribution for Pie Chart
      const [statusData] = await pool.execute(`
        SELECT ti.status, COUNT(*) as count
        FROM trip_instances ti
        JOIN trip_schedules ts ON ti.schedule_id = ts.id
        WHERE ts.operator_id = ?
        AND ti.departure_datetime BETWEEN ? AND ?
        GROUP BY ti.status
      `, [opId, startDate, endDate]);

      const defaultStatuses = ['scheduled', 'on_time', 'delayed', 'cancelled', 'completed'];
      const completeStatusData = defaultStatuses.map(status => {
        const found = statusData.find(s => s.status === status);
        return {
          status,
          count: found ? found.count : 0
        };
      });

      statusData.forEach(s => {
        if (!defaultStatuses.includes(s.status)) {
          completeStatusData.push({ status: s.status, count: s.count });
        }
      });

      res.json({
          stats,
          statusDistribution: completeStatusData
      });
    } catch (error) {
      console.error('SERVER ERROR (Operator Performance):', error);
      res.status(500).json({ message: 'Error fetching performance statistics' });
    }
  }
};

module.exports = operatorController;
