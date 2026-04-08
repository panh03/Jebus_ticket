const pool = require("../config/database");

const tripController = {
  search: async (req, res) => {
    try {
      const { from, to, date } = req.query; // date in 'YYYY-MM-DD' format

      if (!from || !to || !date) {
        return res.status(400).json({ message: "From, to, and date are required" });
      }

      // 1. Find the route
      const [routes] = await pool.execute(
        "SELECT id FROM routes WHERE from_city = ? AND to_city = ?",
        [from, to]
      );

      if (routes.length === 0) {
        return res.json([]);
      }
      const routeId = routes[0].id;

      // 2. Find schedules for this route
      const [schedules] = await pool.execute(
        `SELECT ts.*, o.name as operator_name 
         FROM trip_schedules ts
         JOIN operators o ON ts.operator_id = o.id
         WHERE ts.route_id = ?`,
        [routeId]
      );

      // 3. For each schedule, find or create instance for the requested date
      const trips = [];
      for (const schedule of schedules) {
        // Check if day of week matches (ISO 1=Mon, 7=Sun)
        const tripDate = new Date(date);
        const dayOfWeek = (tripDate.getDay() || 7).toString(); // Convert 0 (Sun) to 7

        if (!schedule.days_of_week.split(',').includes(dayOfWeek)) continue;

        // Check for exceptions
        const [exceptions] = await pool.execute(
          "SELECT * FROM trip_exceptions WHERE schedule_id = ? AND date = ?",
          [schedule.id, date]
        );
        if (exceptions.length > 0 && exceptions[0].status === 'cancelled') continue;

        // Check if instance already exists
        const departureAt = `${date} ${schedule.departure_time}`;
        const arrivalAt = `${date} ${schedule.arrival_time}`; // Simple logic: same day arrival, could be next day in real app

        let [instances] = await pool.execute(
          "SELECT * FROM trip_instances WHERE schedule_id = ? AND DATE(departure_datetime) = ?",
          [schedule.id, date]
        );

        let instance;
        if (instances.length === 0) {
          // Create new instance
          const [result] = await pool.execute(
            "INSERT INTO trip_instances (schedule_id, departure_datetime, arrival_datetime) VALUES (?, ?, ?)",
            [schedule.id, departureAt, arrivalAt]
          );
          instance = { id: result.insertId, schedule_id: schedule.id, departure_datetime: departureAt, arrival_datetime: arrivalAt, status: 'scheduled' };

          // Initialize seats (20 seats for example)
          const seatQueries = [];
          for (let i = 1; i <= 20; i++) {
            const seatNum = (i <= 10 ? 'A' : 'B') + (i > 10 ? i - 10 : i);
            seatQueries.push(pool.execute("INSERT INTO seats (trip_instance_id, seat_number) VALUES (?, ?)", [instance.id, seatNum]));
          }
          await Promise.all(seatQueries);
        } else {
          instance = instances[0];
          // Skip if this specific trip instance has been cancelled by the operator
          if (instance.status === 'cancelled') continue;
        }

        // Count available seats
        const [seatCount] = await pool.execute(
          "SELECT COUNT(*) as count FROM seats WHERE trip_instance_id = ? AND status = 'available'",
          [instance.id]
        );

        trips.push({
          id: instance.id,
          operator: schedule.operator_name,
          departure: instance.departure_datetime,
          arrival: instance.arrival_datetime,
          price: schedule.price,
          available_seats: seatCount[0].count,
          status: instance.status
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
  }
};

module.exports = tripController;