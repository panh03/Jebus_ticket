const pool = require('../src/config/db');
const bcrypt = require('bcrypt');

async function checkOrSetupSystem() {
  const connection = await pool.getConnection();
  try {
    // 1. Check if Admin exists
    let [admins] = await connection.execute("SELECT id, email FROM users WHERE role = 'admin'");
    let adminToken = '';
    if (admins.length === 0) {
      console.log('No admin found, creating default admin...');
      const hashedPassword = await bcrypt.hash('12345', 10);
      const [res] = await connection.execute(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')",
        ['Admin', 'admin@jebus.com', hashedPassword]
      );
      admins = [{ id: res.insertId, email: 'admin@jebus.com' }];
    }
  } catch (error) {
    console.error('Setup error:', error);
  } finally {
    connection.release();
    process.exit();
  }
}
checkOrSetupSystem();
