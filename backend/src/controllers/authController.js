const pool = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const sendResetEmail = async (email, resetUrl) => {
  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT || 587;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const from = process.env.EMAIL_FROM || `JEBus <${process.env.EMAIL_USER || "no-reply@jebus.com"}>`;
  const secure = process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE === "true" : Number(port) === 465;
  const rejectUnauthorized = process.env.EMAIL_REJECT_UNAUTHORIZED !== "false";

  if (!host || !user || !pass) {
    console.warn("Email settings are not fully configured. Reset link will be logged instead of sent.");
    console.log(`Password reset link for ${email}: ${resetUrl}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure,
    auth: { user, pass },
    tls: {
      rejectUnauthorized,
    },
    connectionTimeout: 10000,
  });

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject: "JEBus Password Reset",
      html: `
        <p>We received a request to reset your password.</p>
        <p>Click the link below to set a new password. The link expires in 5 minutes.</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });
  } catch (error) {
    console.warn("Failed to send reset email. Logging reset link instead.", error.message);
    console.log(`Password reset link for ${email}: ${resetUrl}`);
  }
};

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
      console.log("🚀 ~ users:", users);

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
  },

  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      const [users] = await pool.execute("SELECT id FROM users WHERE email = ?", [email]);
      if (users.length === 0) {
        return res.status(200).json({ message: "If the email exists, a reset link has been sent." });
      }

      const user = users[0];
      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
      await pool.execute(
        "UPDATE users SET reset_password_token = ?, reset_password_expires = DATE_ADD(NOW(), INTERVAL 5 MINUTE) WHERE id = ?",
        [hashedToken, user.id]
      );

      const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
      const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

      await sendResetEmail(email, resetUrl);
      res.status(200).json({ message: "Password reset link sent to your email." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Error generating password reset link", error: error.message });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required." });
      }

      const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
      const [users] = await pool.execute(
        "SELECT id FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW()",
        [hashedToken]
      );

      if (users.length === 0) {
        return res.status(400).json({ message: "Invalid or expired reset token." });
      }

      const user = users[0];
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.execute(
        "UPDATE users SET password = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?",
        [hashedPassword, user.id]
      );

      res.status(200).json({ message: "Password updated successfully." });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Error resetting password", error: error.message });
    }
  }
};

module.exports = authController;
