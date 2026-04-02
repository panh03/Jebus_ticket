const db = require("../config/db");

exports.searchTrips = async (from, to, date) => {

  let query = `
  SELECT 
    t.id,

    TIME_FORMAT(t.departure_time, '%H:%i:%s') AS departure_time,
    TIME_FORMAT(t.arrival_time, '%H:%i:%s') AS arrival_time,

    t.price,
    t.available_seats,
    r.from_city,
    r.to_city,
    r.duration

  FROM trips t
  JOIN routes r ON t.route_id = r.id
  WHERE r.from_city = ?
  AND r.to_city = ?
`;
  const params = [from, to];

  const [rows] = await db.execute(query, params);

  // 🔥 GHÉP DATE USER VÀO TIME
  const trips = rows.map(trip => {
    // 👉 Lấy chỉ phần date YYYY-MM-DD nếu date có T...
    const datePart = date.split("T")[0];

    // 👉 ghép date + time
    const departure = new Date(`${datePart}T${trip.departure_time}`);
    let arrival = new Date(`${datePart}T${trip.arrival_time}`);

    
    // 👉 nếu qua ngày (xe đêm)
    if (arrival < departure) {
      arrival.setDate(arrival.getDate() + 1);
    }

    return {
      ...trip,
      departure_time: departure,
      arrival_time: arrival
    };
  });

  // 👇 Lọc bỏ những chuyến xe ĐÃ đi trôi qua so với date (nếu có T)
  const filteredTrips = date.includes("T")
    ? trips.filter(trip => trip.departure_time >= new Date(date))
    : trips;

  return filteredTrips;
};

exports.getTripById = async (tripId) => {

  const [rows] = await db.execute(`
    SELECT 
      t.id,
      t.operator,
      t.bus_type,

      TIME_FORMAT(t.departure_time, '%H:%i:%s') AS departure_time,
      TIME_FORMAT(t.arrival_time, '%H:%i:%s') AS arrival_time,

      t.price,
      t.available_seats,

      r.from_city,
      r.to_city,
      r.duration

    FROM trips t
    JOIN routes r ON t.route_id = r.id
    WHERE t.id = ?
  `, [tripId]);

  if (rows.length === 0) return null;

  const trip = rows[0];

  // 👉 lấy ghế
  const [seats] = await db.execute(
    `SELECT seat_number, status FROM seats WHERE trip_id = ?`,
    [tripId]
  );

  return {
    ...trip,
    seats
  };
};

