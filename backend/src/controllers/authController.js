const pool = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const authController = {
  register: async (req, res) => {
    try {
      const { name, email, password, phone } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);

      const [result] = await pool.execute(
        "INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)",
        [name, email, hashedPassword, phone]
      );

      res.status(201).json({ message: "User registered successfully", id: result.insertId });
    } catch (error) {
      res.status(500).json({ message: "Error registering user", error: error.message });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const [users] = await pool.execute("SELECT * FROM users WHERE email = ?", [email]);
      console.log("🚀 ~ users:", users)

      if (users.length === 0) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const user = users[0];
      const isValid = await bcrypt.compare(password, user.password);
      console.log("🚀 ~ password:", password)
      console.log("🚀 ~ isValid:", isValid)

      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
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
