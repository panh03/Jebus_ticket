const db = require("../config/db");

const generateSeats = async (tripId) => {
  try {
    const rows = ['A', 'B', 'C', 'D'];

    for (let row of rows) {
      for (let i = 1; i <= 10; i++) {
        const seat = `${row}${i}`;

        await db.execute(
          "INSERT INTO seats (trip_id, seat_number) VALUES (?, ?)",
          [tripId, seat]
        );
      }
    }

    console.log("✅ Done generate seats for trip:", tripId);
    process.exit();

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

// 👉 đổi số này theo trip bạn muốn
generateSeats(1);