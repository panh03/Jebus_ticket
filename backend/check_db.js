const pool = require("./src/config/database");

async function check() {
  try {
    const tables = ['users', 'operators'];
    for (const table of tables) {
      const [rows] = await pool.query(`DESCRIBE ${table};`);
      console.log(`${table} columns:`, rows.map(r => r.Field));
    }
  } catch (err) {
    console.error("Error checking db:", err.message);
  } finally {
    process.exit();
  }
}
check();
