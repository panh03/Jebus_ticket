require('dotenv').config({path: './.env'});
const pool = require('../src/config/db');

async function setup() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS search_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        from_city VARCHAR(100) NOT NULL,
        to_city VARCHAR(100) NOT NULL,
        search_count INT DEFAULT 1,
        last_searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_search (user_id, from_city, to_city),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log("Table search_history created successfully");
    process.exit(0);
  } catch (err) {
    console.error("Error creating table:", err);
    process.exit(1);
  }
}

setup();
