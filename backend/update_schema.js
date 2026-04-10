const pool = require("./src/config/database");

async function updateSchema() {
  try {
    console.log("Starting schema update...");

    // 1. Create buses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS buses (
          id INT AUTO_INCREMENT PRIMARY KEY,
          operator_id INT,
          plate_number VARCHAR(20) NOT NULL UNIQUE,
          bus_type VARCHAR(50),
          capacity INT NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (operator_id) REFERENCES operators(id) ON DELETE CASCADE
      );
    `);
    console.log("✅ Created buses table");

    // 2. Add columns to routes
    const [routeCols] = await pool.query("SHOW COLUMNS FROM routes;");
    const routeColNames = routeCols.map(c => c.Field);
    
    if (!routeColNames.includes('operator_id')) {
      await pool.query("ALTER TABLE routes ADD COLUMN operator_id INT;");
      await pool.query("ALTER TABLE routes ADD FOREIGN KEY (operator_id) REFERENCES operators(id) ON DELETE CASCADE;");
      console.log("✅ Added operator_id to routes");
    }
    if (!routeColNames.includes('base_price')) {
      await pool.query("ALTER TABLE routes ADD COLUMN base_price DECIMAL(10, 2) DEFAULT 0;");
      console.log("✅ Added base_price to routes");
    }
    if (!routeColNames.includes('is_active')) {
      await pool.query("ALTER TABLE routes ADD COLUMN is_active BOOLEAN DEFAULT TRUE;");
      console.log("✅ Added is_active to routes");
    }
    if (!routeColNames.includes('created_at')) {
      await pool.query("ALTER TABLE routes ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;");
      console.log("✅ Added created_at to routes");
    }

    // 3. Add columns to trip_instances
    const [tripCols] = await pool.query("SHOW COLUMNS FROM trip_instances;");
    const tripColNames = tripCols.map(c => c.Field);

    if (!tripColNames.includes('bus_id')) {
      await pool.query("ALTER TABLE trip_instances ADD COLUMN bus_id INT;");
      await pool.query("ALTER TABLE trip_instances ADD FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE SET NULL;");
      console.log("✅ Added bus_id to trip_instances");
    }
    if (!tripColNames.includes('price_multiplier')) {
      await pool.query("ALTER TABLE trip_instances ADD COLUMN price_multiplier DECIMAL(5, 2) DEFAULT 1.0;");
      console.log("✅ Added price_multiplier to trip_instances");
    }

    // Seed some buses for existing operators if none exist
    const [existingBuses] = await pool.query("SELECT COUNT(*) as count FROM buses");
    if (existingBuses[0].count === 0) {
      const [ops] = await pool.query("SELECT id FROM operators");
      for (const op of ops) {
        await pool.query("INSERT INTO buses (operator_id, plate_number, bus_type, capacity) VALUES (?, ?, ?, ?)", 
          [op.id, `BUS-${op.id}-01`, 'Sleeper', 36]);
        await pool.query("INSERT INTO buses (operator_id, plate_number, bus_type, capacity) VALUES (?, ?, ?, ?)", 
          [op.id, `BUS-${op.id}-02`, 'Limousine', 22]);
      }
      console.log("✅ Seeded initial buses");
    }

    console.log("Schema update COMPLETED SUCCESSFULLY.");
  } catch (err) {
    console.error("❌ Schema update failed:", err.message);
  } finally {
    process.exit();
  }
}

updateSchema();
