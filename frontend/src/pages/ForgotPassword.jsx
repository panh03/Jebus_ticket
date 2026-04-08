import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./Auth.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setStatus(null);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, { email });
      setStatus(response.data.message || "If this email exists, a reset link has been sent.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send reset instructions.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in">
        <header className="auth-header">
          <h2>Forgot Password</h2>
          <p>Enter your email to receive a password reset link.</p>
        </header>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-field">
            <label><i className="fas fa-envelope"></i> Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-btn">
            Send Reset Link
          </button>

          {status && <p style={{ marginTop: "1rem", color: "#16a34a" }}>{status}</p>}
          {error && <p style={{ marginTop: "1rem", color: "#dc2626" }}>{error}</p>}

          <p className="auth-footer">
            Remembered your password? <Link to="/login">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
