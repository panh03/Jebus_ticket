import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import "./Auth.css";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setStatus(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
        token,
        password,
      });
      setStatus(response.data.message || "Password reset successfully.");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to reset password.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in">
        <header className="auth-header">
          <h2>Reset Password</h2>
          <p>Create a new password for your account.</p>
        </header>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-field">
            <label><i className="fas fa-lock"></i> New Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="input-field">
            <label><i className="fas fa-lock"></i> Confirm Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-btn">
            Reset Password
          </button>

          {status && <p style={{ marginTop: "1rem", color: "#16a34a" }}>{status}</p>}
          {error && <p style={{ marginTop: "1rem", color: "#dc2626" }}>{error}</p>}

          <p className="auth-footer">
            Back to <Link to="/login">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
