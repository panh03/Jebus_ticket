const db = require('../config/db');

const getUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
};

const getUserDetail = async (req, res) => {
  const { id } = req.params;
  try {
    const [user] = await db.query(
      'SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?',
      [id]
    );

    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get booking history
    const [bookings] = await db.query(`
      SELECT 
        b.id, b.booking_time, b.status, b.total_price,
        o.name as operator_name,
        r.from_city, r.to_city,
        ti.departure_datetime
      FROM bookings b
      JOIN trip_instances ti ON b.trip_instance_id = ti.id
      JOIN trip_schedules ts ON ti.schedule_id = ts.id
      JOIN operators o ON ts.operator_id = o.id
      JOIN routes r ON ts.route_id = r.id
      WHERE b.user_id = ?
      ORDER BY b.booking_time DESC
    `, [id]);

    res.json({
      ...user[0],
      bookings
    });
  } catch (error) {
    console.error('Error fetching user detail:', error);
    res.status(500).json({ message: 'Error fetching user detail' });
  }
};

const getOperators = async (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT o.*, u.email as account_email, u.created_at as joined_at
    FROM operators o
    JOIN users u ON o.user_id = u.id
  `;
  const params = [];

  if (status) {
    sql += ' WHERE o.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY o.created_at DESC';

  try {
    const [operators] = await db.query(sql, params);
    res.json(operators);
  } catch (error) {
    console.error('Error fetching operators:', error);
    res.status(500).json({ message: 'Error fetching operators' });
  }
};

const getOperatorDetail = async (req, res) => {
  const { id } = req.params;
  try {
    const [operator] = await db.query(`
      SELECT o.*, u.email as account_email, u.created_at as joined_at
      FROM operators o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [id]);

    if (operator.length === 0) {
      return res.status(404).json({ message: 'Operator not found' });
    }

    // Get operating routes
    const [routes] = await db.query(`
      SELECT id, from_city, to_city, base_price, is_active
      FROM routes
      WHERE operator_id = ?
    `, [id]);

    // Get ratings/reviews
    const [reviews] = await db.query(`
      SELECT r.*, u.name as user_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.operator_id = ?
      ORDER BY r.created_at DESC
    `, [id]);

    // Get trips
    const [trips] = await db.query(`
      SELECT ti.*, r.from_city, r.to_city
      FROM trip_instances ti
      JOIN trip_schedules ts ON ti.schedule_id = ts.id
      JOIN routes r ON ts.route_id = r.id
      WHERE ts.operator_id = ?
      ORDER BY ti.departure_datetime DESC
    `, [id]);

    res.json({
      ...operator[0],
      routes,
      reviews,
      trips
    });
  } catch (error) {
    console.error('Error fetching operator detail:', error);
    res.status(500).json({ message: 'Error fetching operator detail' });
  }
};

const deleteOperator = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [ops] = await connection.query('SELECT user_id FROM operators WHERE id = ?', [id]);
    if (ops.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Operator not found' });
    }
    const userId = ops[0].user_id;
    await connection.query('DELETE FROM operators WHERE id = ?', [id]);
    await connection.query('DELETE FROM users WHERE id = ?', [userId]);
    await connection.commit();
    res.json({ message: 'Operator deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting operator:', error);
    res.status(500).json({ message: 'Error deleting operator' });
  } finally {
    connection.release();
  }
};

const approveOperator = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE operators SET status = "active", rejection_reason = NULL WHERE id = ?', [id]);
    res.json({ message: 'Operator approved successfully' });
  } catch (error) {
    console.error('Error approving operator:', error);
    res.status(500).json({ message: 'Error approving operator' });
  }
};

const rejectOperator = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  if (!reason) {
    return res.status(400).json({ message: 'Rejection reason is required' });
  }

  try {
    await db.query('UPDATE operators SET status = "rejected", rejection_reason = ? WHERE id = ?', [reason, id]);
    res.json({ message: 'Operator rejected successfully' });
  } catch (error) {
    console.error('Error rejecting operator:', error);
    res.status(500).json({ message: 'Error rejecting operator' });
  }
};

// Route & Trip Management
const updateRouteStatus = async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  try {
    await db.query('UPDATE routes SET is_active = ? WHERE id = ?', [is_active, id]);
    res.json({ message: 'Route status updated' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating route' });
  }
};

const deleteRoute = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM routes WHERE id = ?', [id]);
    res.json({ message: 'Route deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting route' });
  }
};

const updateTripStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await db.query('UPDATE trip_instances SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: 'Trip status updated' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating trip' });
  }
};

const deleteTrip = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get bookings to notify/refund
    const [bookings] = await connection.query('SELECT id, total_price, user_id FROM bookings WHERE trip_instance_id = ? AND status IN ("pending", "confirmed")', [id]);

    for (const booking of bookings) {
      // Create refund record
      await connection.query(
        'INSERT INTO refunds (booking_id, amount, status, reason) VALUES (?, ?, "processed", "Trip deleted by Admin")',
        [booking.id, booking.total_price]
      );
      // Update booking status
      await connection.query('UPDATE bookings SET status = "refunded", cancelled_by = "admin", cancellation_reason = "Trip deleted" WHERE id = ?', [booking.id]);
    }

    // Delete trip
    await connection.query('DELETE FROM trip_instances WHERE id = ?', [id]);

    await connection.commit();
    res.json({ message: 'Trip deleted and bookings refunded', refunded_count: bookings.length });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Error deleting trip' });
  } finally {
    connection.release();
  }
};

// Bus Management
const getBuses = async (req, res) => {
  const { operatorId } = req.params;
  try {
    const [buses] = await db.query('SELECT * FROM buses WHERE operator_id = ?', [operatorId]);
    res.json(buses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching buses' });
  }
};

const addBus = async (req, res) => {
  const { operatorId } = req.params;
  const { bus_number, plate_number, type, capacity } = req.body;
  try {
    await db.query(
      'INSERT INTO buses (operator_id, bus_number, plate_number, type, capacity) VALUES (?, ?, ?, ?, ?)',
      [operatorId, bus_number, plate_number, type, capacity]
    );
    res.json({ message: 'Bus added' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding bus' });
  }
};

const deleteBus = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM buses WHERE id = ?', [id]);
    res.json({ message: 'Bus deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting bus' });
  }
};

const getAllBuses = async (req, res) => {
  const { operatorId, search } = req.query;
  let sql = `
    SELECT b.*, o.name as operator_name 
    FROM buses b
    JOIN operators o ON b.operator_id = o.id
    WHERE 1=1
  `;
  const params = [];

  if (operatorId) {
    sql += ' AND b.operator_id = ?';
    params.push(operatorId);
  }
  if (search) {
    sql += ' AND b.plate_number LIKE ?';
    params.push(`%${search}%`);
  }

  sql += ' ORDER BY b.created_at DESC';

  try {
    const [buses] = await db.query(sql, params);
    res.json(buses);
  } catch (error) {
    console.error('Error fetching all buses:', error);
    res.status(500).json({ message: 'Error fetching buses' });
  }
};

const updateBus = async (req, res) => {
  const { id } = req.params;
  const { bus_number, plate_number, type, capacity, status } = req.body;
  try {
    await db.query(
      'UPDATE buses SET bus_number = ?, plate_number = ?, type = ?, capacity = ?, status = ? WHERE id = ?',
      [bus_number, plate_number, type, capacity, status, id]
    );
    res.json({ message: 'Bus updated successfully' });
  } catch (error) {
    console.error('Error updating bus:', error);
    res.status(500).json({ message: 'Error updating bus' });
  }
};

const getPerformanceStats = async (req, res) => {
  const { month, year } = req.query;
  if (!month || !year) {
    return res.status(400).json({ message: 'Month and year are required' });
  }

  try {
    // Create date strings for the start and end of the month for more robust filtering
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01 00:00:00`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay} 23:59:59`;

    // 1. Get daily completed trips using BETWEEN for better compatibility/performance
    const [tripsData] = await db.query(`
      SELECT DATE_FORMAT(departure_datetime, '%Y-%m-%d') as date, COUNT(*) as trip_count
      FROM trip_instances
      WHERE status = 'completed' 
      AND departure_datetime BETWEEN ? AND ?
      GROUP BY date
      ORDER BY date ASC
    `, [startDate, endDate]);

    // 2. Get daily revenue (based on departure time)
    const [revenueData] = await db.query(`
      SELECT DATE_FORMAT(ti.departure_datetime, '%Y-%m-%d') as date, SUM(b.total_price) as total_revenue
      FROM bookings b
      JOIN trip_instances ti ON b.trip_instance_id = ti.id
      WHERE b.status IN ('confirmed', 'completed') 
      AND ti.departure_datetime BETWEEN ? AND ?
      GROUP BY date
      ORDER BY date ASC
    `, [startDate, endDate]);

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
    const [statusData] = await db.query(`
      SELECT status, COUNT(*) as count
      FROM trip_instances
      WHERE departure_datetime BETWEEN ? AND ?
      GROUP BY status
    `, [startDate, endDate]);

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
    console.error('SERVER ERROR (getPerformanceStats):', error);
    res.status(500).json({ 
        message: 'Error fetching performance statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

module.exports = {
  getUsers,
  deleteUser,
  getUserDetail,
  getOperators,
  getOperatorDetail,
  approveOperator,
  rejectOperator,
  updateRouteStatus,
  deleteRoute,
  updateTripStatus,
  deleteTrip,
  getBuses,
  getAllBuses,
  addBus,
  updateBus,
  deleteBus,
  getPerformanceStats,
  deleteOperator
};
