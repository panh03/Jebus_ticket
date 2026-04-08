const pool = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const authController = {
  register: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const { name, email, password, phone, role = 'user' } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const [userResult] = await connection.execute(
        "INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)",
        [name, email, hashedPassword, phone, role]
      );
      const userId = userResult.insertId;

      // If operator, create operator entry
      if (role === 'operator') {
        await connection.execute(
          "INSERT INTO operators (user_id, name, contact_email, phone) VALUES (?, ?, ?, ?)",
          [userId, name, email, phone]
        );
      }

      await connection.commit();
      res.status(201).json({ message: "Account created successfully", id: userId, role });
    } catch (error) {
      await connection.rollback();
      console.error("Registration error:", error);
      res.status(500).json({ message: "Error registering user", error: error.message });
    } finally {
      connection.release();
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const [users] = await pool.execute("SELECT * FROM users WHERE email = ?", [email]);
      console.log("🚀 ~ users:", users)

      if (users.length === 0) {
        console.error(`Login attempt failed: Email ${email} not found`);
        return res.status(401).json({ message: "Email not found" });
      }

      const user = users[0];
      const isValid = await bcrypt.compare(password, user.password);

      if (!isValid) {
        console.error(`Login attempt failed: Incorrect password for ${email}`);
        return res.status(401).json({ message: "Incorrect password" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || "supersecretkey",
        { expiresIn: "24h" }
      );

      delete user.password;
      res.json({ token, user });
    } catch (error) {
      res.status(500).json({ message: "Error logging in", error: error.message });
    }
  }
};

module.exports = authController;
