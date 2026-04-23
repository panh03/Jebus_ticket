
const pool = require('../src/config/db');
const bcrypt = require('bcrypt');

//const API_BASE = 'http://localhost:5000/api';
require("dotenv").config();
const API_BASE =  process.env.ENV == 'local' ? 'https://localhost:5000/api' : 'https://jebus-ticket-be.vercel.app/api';

async function generateMockData() {
  let connection;
  try {
    connection = await pool.getConnection();

    console.log('--- Setting up prerequisite data ---');
    // Ensure an operator exists
    let [operators] = await connection.execute("SELECT * FROM operators LIMIT 1");
    let operatorId;
    if (operators.length === 0) {
      console.log('No operators found. Creating a mock operator...');
      const hashedPassword = await bcrypt.hash('12345', 10);
      const [uRes] = await connection.execute(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'operator')",
        ['Mock Operator', 'mockoperator@jebus.com', hashedPassword]
      );
      const [oRes] = await connection.execute(
        "INSERT INTO operators (user_id, name, contact_email, status, is_active) VALUES (?, ?, ?, 'active', 1)",
        [uRes.insertId, 'Mock Operator Bus Co', 'mockoperator@jebus.com']
      );
      operatorId = oRes.insertId;
    } else {
      operatorId = operators[0].id;
    }

    // Ensure route exists
    let [routes] = await connection.execute(
      "SELECT * FROM routes WHERE from_city = 'Nha Trang' AND to_city = 'Da Lat' AND is_active = 1 LIMIT 1"
    );
    let routeId;
    if (routes.length === 0) {
      console.log('Creating Route: Nha Trang to Da Lat...');
      const [rRes] = await connection.execute(
        "INSERT INTO routes (from_city, to_city, distance, duration, operator_id, base_price, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)",
        ['Nha Trang', 'Da Lat', 135, '3h 30m', operatorId, 200000]
      );
      routeId = rRes.insertId;
    } else {
      routeId = routes[0].id;
    }

    // Ensure schedules for 18:00, 19:00, 20:00, 21:00 exist
    const times = ['18:00:00', '19:00:00', '20:00:00', '21:00:00'];
    for (const t of times) {
      const [schedules] = await connection.execute(
        "SELECT * FROM trip_schedules WHERE route_id = ? AND departure_time = ?",
        [routeId, t]
      );
      if (schedules.length === 0) {
        let arrHour = (parseInt(t.split(':')[0]) + 3) % 24;
        let arrTime = `${arrHour.toString().padStart(2, '0')}:30:00`;
        await connection.execute(
          "INSERT INTO trip_schedules (route_id, operator_id, departure_time, arrival_time, price, days_of_week) VALUES (?, ?, ?, ?, ?, ?)",
          [routeId, operatorId, t, arrTime, 200000, '1,2,3,4,5,6,7']
        );
      }
    }

    console.log('--- Generating 10 Mock Users ---');
    const users = [];
    for (let i = 1; i <= 10; i++) {
      const email = `mockuser${i}_${Date.now()}@jebus.com`;
      const name = `Mock Passenger ${i}`;
      
      // Use API to create users directly
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password: 'password123',
          phone: `09000000${i.toString().padStart(2, '0')}`,
          role: 'user'
        })
      });
      console.log(`Created user ${name}`);
      
      // Login to get token
      const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: 'password123'
        })
      });
      const loginData = await loginRes.json();
      users.push({ ...loginData.user, token: loginData.token });
    }

    console.log('--- Creating Bookings for Users ---');
    
    // Dates relative to today
    const now = new Date();
    
    const fmtDate = (d) => {
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${yyyy}-${mm}-${dd}`;
    };

    const dates = [
        { label: 'Historical', daysOffset: -5, category: 'historical' }, // 5 days ago
        { label: 'Current', daysOffset: 0, category: 'current' },       // today
        { label: 'Future', daysOffset: 3, category: 'future' }          // 3 days later
    ];

    for (const u of users) {
        console.log(`Processing bookings for ${u.name}...`);
        
        for (const dateConf of dates) {
            const targetDate = new Date(now);
            targetDate.setDate(now.getDate() + dateConf.daysOffset);
            const dateStr = fmtDate(targetDate);
            
            // Search trips using API (this automatically creates instances if not exist)
            const searchRes = await fetch(`${API_BASE}/trips/search?from=Nha%20Trang&to=Da%20Lat&date=${dateStr}`);
            const trips = await searchRes.json();
            if (!trips || trips.length === 0) {
                console.log(`No trips found for ${dateStr}`);
                continue;
            }

            // Pick a random trip run (might be 18:00, 19:00, etc.)
            const selectedTrip = trips[Math.floor(Math.random() * trips.length)];
            
            // Get Seats via API
            const seatsRes = await fetch(`${API_BASE}/trips/${selectedTrip.id}/seats`);
            const seatsData = await seatsRes.json();
            const seats = seatsData.filter(s => s.status === 'available');
            
            if (seats.length < 1) continue;
            
            // Book 1 seat via API
            const seatToBook = seats[0];
            const bookingRes = await fetch(`${API_BASE}/bookings`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${u.token}` 
                },
                body: JSON.stringify({
                    trip_instance_id: selectedTrip.id,
                    seat_ids: [seatToBook.id],
                    total_price: selectedTrip.price,
                    payment_method: 'credit_card',
                    pickup_point: 'Nha Trang Bus Station',
                    dropoff_point: 'Da Lat Center'
                })
            });
            const bookingData = await bookingRes.json();
            console.log(`Booked trip on ${dateStr} (${dateConf.label}) for ${u.name}`);
            const bookingId = bookingData.bookingId;

            // If it's historical or current, we should backdate the booking_time using DB directly 
            // since API enforces CURRENT_TIMESTAMP
            if (dateConf.category === 'historical') {
                const bookingTime = new Date(targetDate);
                bookingTime.setDate(bookingTime.getDate() - 2); // Booked 2 days before the historical trip
                
                await connection.execute(
                    "UPDATE bookings SET booking_time = ?, paid_at = ?, status = 'confirmed' WHERE id = ?",
                    [bookingTime, bookingTime, bookingId]
                );
                await connection.execute(
                    "UPDATE payments SET payment_time = ? WHERE booking_id = ?",
                    [bookingTime, bookingId]
                );
                await connection.execute(
                    "UPDATE trip_instances SET status = 'completed' WHERE id = ?",
                    [selectedTrip.id]
                );
            } else if (dateConf.category === 'current') {
                // Keep it today
            } else if (dateConf.category === 'future') {
                // Keep the booking time as today, trip is in the future
            }
        }
    }

    console.log('--- Mock Data Generation Complete! ---');
    console.log('You can log in as any mock user using:');
    console.log('Email: mockuser1_... (check logs) Password: password123');
    
  } catch (error) {
    console.error('Error generating mock data:', error.response ? error.response.data : error.message);
  } finally {
    if (connection) connection.release();
    process.exit();
  }
}

generateMockData();
