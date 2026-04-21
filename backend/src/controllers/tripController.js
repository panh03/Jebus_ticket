const pool = require("../config/db");

const tripController = {
  search: async (req, res) => {
    try {
      const { from, to, date } = req.query; // date in 'YYYY-MM-DD' format

      if (!from || !to || !date) {
        return res.status(400).json({ message: "From, to, and date are required" });
      }

      // 1. Find the route(s) - there might be multiple operators for the same from/to
      const [matchingRoutes] = await pool.execute(
        "SELECT id FROM routes WHERE from_city = ? AND to_city = ? AND is_active = 1",
        [from, to]
      );

      if (matchingRoutes.length === 0) {
        return res.json([]);
      }
      const routeIds = matchingRoutes.map(r => r.id);

      // 2. Find ALL existing trip instances for these routes on this date
      const [existingInstances] = await pool.execute(
        `SELECT ti.*, ts.price, o.name as operator_name 
         FROM trip_instances ti
         JOIN trip_schedules ts ON ti.schedule_id = ts.id
         JOIN operators o ON ts.operator_id = o.id
         WHERE ts.route_id IN (${routeIds.join(',')}) AND DATE(ti.departure_datetime) = ?`,
        [date]
      );

      // 3. Find schedules that should run today but don't have an instance yet
      const tripDate = new Date(date);
      const dayOfWeek = (tripDate.getDay() || 7).toString();
      
      const [schedules] = await pool.execute(
        `SELECT ts.*, o.name as operator_name 
         FROM trip_schedules ts
         JOIN operators o ON ts.operator_id = o.id
         WHERE ts.route_id IN (${routeIds.join(',')}) 
         AND FIND_IN_SET(?, ts.days_of_week) > 0`,
        [dayOfWeek]
      );

      const trips = [];
      const instanceScheduleIds = new Set(existingInstances.map(i => i.schedule_id));

      // Add existing instances
      for (const instance of existingInstances) {
        if (instance.status === 'cancelled') continue;

        const [seatCount] = await pool.execute(
          "SELECT COUNT(*) as count FROM seats WHERE trip_instance_id = ? AND status = 'available'",
          [instance.id]
        );

        trips.push({
          id: instance.id,
          operator: instance.operator_name,
          departure: instance.departure_datetime,
          arrival: instance.arrival_datetime,
          price: instance.price * (instance.price_multiplier || 1.0),
          available_seats: seatCount[0].count,
          bus_info: instance.bus_info,
          status: instance.status
        });
      }

      // Create instances for schedules that don't have one
      for (const schedule of schedules) {
        if (instanceScheduleIds.has(schedule.id)) continue;

        // Check for exceptions
        const [exceptions] = await pool.execute(
          "SELECT * FROM trip_exceptions WHERE schedule_id = ? AND date = ?",
          [schedule.id, date]
        );
        if (exceptions.length > 0 && exceptions[0].status === 'cancelled') continue;

        const departureAt = `${date} ${schedule.departure_time}`;
        const arrivalAt = `${date} ${schedule.arrival_time}`;

        // Create new instance
        const [result] = await pool.execute(
          "INSERT INTO trip_instances (schedule_id, departure_datetime, arrival_datetime, capacity) VALUES (?, ?, ?, ?)",
          [schedule.id, departureAt, arrivalAt, 36] // Default capacity 36 for auto-generated
        );
        const newId = result.insertId;

        // Initialize seats based on capacity
        const capacity = 36;
        for (let i = 1; i <= capacity; i++) {
          const row = Math.ceil(i / 2);
          const col = i % 2 === 1 ? 'A' : 'B';
          const seatNum = `${col}${row}`;
          await pool.execute("INSERT INTO seats (trip_instance_id, seat_number) VALUES (?, ?)", [newId, seatNum]);
        }

        trips.push({
          id: newId,
          operator: schedule.operator_name,
          departure: departureAt,
          arrival: arrivalAt,
          price: schedule.price,
          available_seats: capacity,
          bus_info: 'Sleeper',
          status: 'scheduled'
        });
      }

      res.json(trips);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error searching trips", error: error.message });
    }
  },

  getSeats: async (req, res) => {
    try {
      const { instanceId } = req.params;
      const [seats] = await pool.execute(
        "SELECT * FROM seats WHERE trip_instance_id = ? ORDER BY seat_number",
        [instanceId]
      );
      res.json(seats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching seats", error: error.message });
    }
  },

  getTripDetail: async (req, res) => {
    try {
      const { id } = req.params;
      const [trips] = await pool.execute(
        `SELECT ti.*, ts.price, o.name as operator_name, r.from_city as \`from\`, r.to_city as \`to\`
         FROM trip_instances ti
         JOIN trip_schedules ts ON ti.schedule_id = ts.id
         JOIN operators o ON ts.operator_id = o.id
         JOIN routes r ON ts.route_id = r.id
         WHERE ti.id = ?`,
        [id]
      );

      if (trips.length === 0) {
        return res.status(404).json({ message: "Trip not found" });
      }

      res.json(trips[0]);
    } catch (error) {
      res.status(500).json({ message: "Error fetching trip detail", error: error.message });
    }
  },

  getCities: async (req, res) => {
    try {
      const [rows] = await pool.execute(
        "SELECT DISTINCT from_city as city FROM routes WHERE is_active = 1 UNION SELECT DISTINCT to_city as city FROM routes WHERE is_active = 1"
      );
      const cities = rows.map(r => r.city).sort();
      res.json(cities);
    } catch (error) {
      res.status(500).json({ message: "Error fetching cities", error: error.message });
    }
  },

  getPopularRoutes: async (req, res) => {
    try {
      // Logic: Pick routes that have the most successful bookings
      // Fallback: Pick any active routes if no bookings yet
      const [rows] = await pool.execute(`
        SELECT r.id, r.from_city, r.to_city, r.base_price, COUNT(b.id) as booking_count
        FROM routes r
        LEFT JOIN trip_schedules ts ON r.id = ts.route_id
        LEFT JOIN trip_instances ti ON ts.id = ti.schedule_id
        LEFT JOIN bookings b ON ti.id = b.trip_instance_id
        WHERE r.is_active = 1
        GROUP BY r.id, r.from_city, r.to_city, r.base_price
        ORDER BY booking_count DESC, r.id ASC
        LIMIT 3
      `);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: "Error fetching popular routes", error: error.message });
    }
  },

  getSearchHistory: async (req, res) => {
    try {
      if (!req.user) return res.json([]);
      
      const [rows] = await pool.execute(`
        SELECT sh.from_city, sh.to_city, sh.search_count 
        FROM search_history sh
        JOIN routes r ON sh.from_city = r.from_city AND sh.to_city = r.to_city
        WHERE sh.user_id = ? AND r.is_active = 1
        GROUP BY sh.from_city, sh.to_city, sh.search_count, sh.last_searched_at
        ORDER BY sh.last_searched_at DESC 
        LIMIT 5
      `, [req.user.id]);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: "Error fetching search history", error: error.message });
    }
  },

  saveSearch: async (req, res) => {
    try {
      const { from, to } = req.body;
      if (!req.user || !from || !to) return res.status(200).json({ message: "Search processed (guest or missing data)" });

      await pool.execute(
        "INSERT INTO search_history (user_id, from_city, to_city, search_count) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE search_count = search_count + 1",
        [req.user.id, from, to]
      );
      res.json({ message: "Search history updated" });
    } catch (error) {
       // We don't want to break the search flow if history saving fails
       console.error("Error saving search history:", error);
       res.status(200).json({ message: "Search processed with history error" });
    }
  },

  verifyRoute: async (req, res) => {
    try {
      const { from, to } = req.query;
      const [rows] = await pool.execute(
        "SELECT id FROM routes WHERE from_city = ? AND to_city = ? AND is_active = 1",
        [from, to]
      );
      res.json({ active: rows.length > 0 });
    } catch (error) {
      res.status(500).json({ message: "Error verifying route", error: error.message });
    }
  }
};

module.exports = tripController;