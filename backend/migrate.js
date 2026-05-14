const pool = require("./src/config/db");

async function migrate() {
  try {
    console.log("Starting migration...");

    const [resetColumns] = await pool.query("SHOW COLUMNS FROM users LIKE 'reset_password_token'");
    if (resetColumns.length === 0) {
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN reset_password_token VARCHAR(255),
        ADD COLUMN reset_password_expires DATETIME NULL;
      `);
      console.log("✅ Added password reset columns to users table");
    }

    const [bookingPickupColumn] = await pool.query("SHOW COLUMNS FROM bookings LIKE 'pickup_point'");
    const [bookingDropoffColumn] = await pool.query("SHOW COLUMNS FROM bookings LIKE 'dropoff_point'");
    const [bookingPaidAtColumn] = await pool.query("SHOW COLUMNS FROM bookings LIKE 'paid_at'");
    const [bookingCancelledAtColumn] = await pool.query("SHOW COLUMNS FROM bookings LIKE 'cancelled_at'");
    const [bookingCancelledByColumn] = await pool.query("SHOW COLUMNS FROM bookings LIKE 'cancelled_by'");
    const [bookingCancellationReasonColumn] = await pool.query("SHOW COLUMNS FROM bookings LIKE 'cancellation_reason'");

    const bookingAlterClauses = [];
    if (bookingPickupColumn.length === 0) bookingAlterClauses.push("ADD COLUMN pickup_point VARCHAR(255)");
    if (bookingDropoffColumn.length === 0) bookingAlterClauses.push("ADD COLUMN dropoff_point VARCHAR(255)");
    if (bookingPaidAtColumn.length === 0) bookingAlterClauses.push("ADD COLUMN paid_at DATETIME");
    if (bookingCancelledAtColumn.length === 0) bookingAlterClauses.push("ADD COLUMN cancelled_at DATETIME");
    if (bookingCancelledByColumn.length === 0) bookingAlterClauses.push("ADD COLUMN cancelled_by ENUM('user', 'operator', 'admin')");
    if (bookingCancellationReasonColumn.length === 0) bookingAlterClauses.push("ADD COLUMN cancellation_reason TEXT");

    if (bookingAlterClauses.length > 0) {
      await pool.query(`ALTER TABLE bookings ${bookingAlterClauses.join(", ")};`);
      console.log("✅ Updated bookings table");
    }

    const [routePickupColumn] = await pool.query("SHOW COLUMNS FROM routes LIKE 'pickup_points'");
    const [routeDropoffColumn] = await pool.query("SHOW COLUMNS FROM routes LIKE 'dropoff_points'");
    const routeAlterClauses = [];
    if (routePickupColumn.length === 0) routeAlterClauses.push("ADD COLUMN pickup_points TEXT");
    if (routeDropoffColumn.length === 0) routeAlterClauses.push("ADD COLUMN dropoff_points TEXT");

    if (routeAlterClauses.length > 0) {
      await pool.query(`ALTER TABLE routes ${routeAlterClauses.join(", ")};`);
      console.log("✅ Updated routes pickup/dropoff points");
    }

    const [paymentTransactionColumn] = await pool.query("SHOW COLUMNS FROM payments LIKE 'transaction_code'");
    if (paymentTransactionColumn.length === 0) {
      await pool.query(`
        ALTER TABLE payments 
        ADD COLUMN transaction_code VARCHAR(100);
      `);
      console.log("✅ Updated payments table");
    }

    // 3. Create refunds table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS refunds (
          id INT AUTO_INCREMENT PRIMARY KEY,
          booking_id INT,
          amount DECIMAL(10, 2) NOT NULL,
          status ENUM('pending', 'processed', 'failed') DEFAULT 'pending',
          refund_method VARCHAR(50),
          processed_at DATETIME,
          reason TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
      );
    `);
    console.log("✅ Created refunds table");

    // 4. Create cancellation_requests table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cancellation_requests (
          id INT AUTO_INCREMENT PRIMARY KEY,
          booking_id INT,
          requested_by INT,
          status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
          reason TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          resolved_at DATETIME,
          FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
          FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    console.log("✅ Created cancellation_requests table");

    // 5. Create cancellation_policies table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cancellation_policies (
          id INT AUTO_INCREMENT PRIMARY KEY,
          hours_before INT NOT NULL,
          refund_percent INT NOT NULL,
          description TEXT
      );
    `);
    console.log("✅ Created cancellation_policies table");

    // 6. Seed policies
    const [existingPolicies] = await pool.query("SELECT COUNT(*) as count FROM cancellation_policies");
    if (existingPolicies[0].count === 0) {
      await pool.query(`
        INSERT INTO cancellation_policies (hours_before, refund_percent, description) VALUES
        (24, 100, 'Full refund if cancelled more than 24 hours before departure'),
        (2, 50, '50% refund if cancelled between 2 and 24 hours before departure (requires operator approval)'),
        (0, 0, 'No refund if cancelled less than 2 hours before departure');
      `);
      console.log("✅ Seeded cancellation policies");
    }

    console.log("All migrations COMPLETED SUCCESSFULLY.");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
  } finally {
    process.exit();
  }
}

migrate();
