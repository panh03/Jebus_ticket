const pool = require("./src/config/database");

async function simplifySchema() {
  try {
    console.log("Starting schema simplification...");

    // 1. Remove foreign key and column from trip_instances
    // We need to find the name of the foreign key constraint first
    const [constraints] = await pool.query(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_NAME = 'trip_instances' 
      AND COLUMN_NAME = 'bus_id'
      AND TABLE_SCHEMA = DATABASE()
    `);

    for (const c of constraints) {
      await pool.query(`ALTER TABLE trip_instances DROP FOREIGN KEY ${c.CONSTRAINT_NAME}`);
      console.log(`✅ Dropped foreign key ${c.CONSTRAINT_NAME}`);
    }

    // 2. Add bus_info column and check if bus_id exists to drop it
    const [cols] = await pool.query("SHOW COLUMNS FROM trip_instances;");
    const colNames = cols.map(c => c.Field);

    if (!colNames.includes('bus_info')) {
      await pool.query("ALTER TABLE trip_instances ADD COLUMN bus_info VARCHAR(255);");
      console.log("✅ Added bus_info to trip_instances");
    }
    
    if (!colNames.includes('capacity')) {
       await pool.query("ALTER TABLE trip_instances ADD COLUMN capacity INT DEFAULT 36;");
       console.log("✅ Added capacity to trip_instances");
    }

    if (colNames.includes('bus_id')) {
      await pool.query("ALTER TABLE trip_instances DROP COLUMN bus_id;");
      console.log("✅ Dropped bus_id from trip_instances");
    }

    // 3. Drop buses table
    await pool.query("DROP TABLE IF EXISTS buses;");
    console.log("✅ Dropped buses table");

    console.log("Schema simplification COMPLETED SUCCESSFULLY.");
  } catch (err) {
    console.error("❌ Schema simplification failed:", err.message);
  } finally {
    process.exit();
  }
}

simplifySchema();
