const pool = require("../config/db");

const pointsController = {
  getUserPoints: async (req, res) => {
    try {
      const [rows] = await pool.execute("SELECT total_points FROM users WHERE id = ?", [req.user.id]);
      if (rows.length === 0) return res.status(404).json({ message: "User not found" });
      const currentPoints = rows[0].total_points || 0;

      const [reservedRows] = await pool.execute(
        `SELECT SUM(b.points_earned) as reserved 
         FROM bookings b 
         JOIN trip_instances ti ON b.trip_instance_id = ti.id 
         WHERE b.user_id = ? AND b.status IN ('confirmed') AND ti.departure_datetime > NOW()`,
        [req.user.id]
      );
      const reservedPoints = parseInt(reservedRows[0].reserved || 0);
      const maxRedeemable = Math.max(0, currentPoints - reservedPoints);

      res.json({ 
        total_points: currentPoints,
        reserved_points: reservedPoints,
        max_redeemable: maxRedeemable
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching points", error: error.message });
    }
  },

  getPointsHistory: async (req, res) => {
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM points_history WHERE user_id = ? ORDER BY transaction_date DESC",
        [req.user.id]
      );
      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: "Error fetching points history", error: error.message });
    }
  }
};

module.exports = pointsController;
