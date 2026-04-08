import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import "./Auth.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", { email, password });
      login(response.data.user, response.data.token);
      
      // Redirect based on role
      if (response.data.user.role === 'operator') {
        navigate("/operator/dashboard");
      } else {
        navigate("/");
      }
    } catch (error) {
      alert("Login failed: " + (error.response?.data?.message || "Something went wrong"));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in">
        <header className="auth-header">
          <h2>Welcome Back</h2>
          <p>Sign in to continue your journey</p>
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
          
          <div className="input-field">
            <label><i className="fas fa-lock"></i> Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <div className="auth-options">
            <label className="remember-me">
              <input type="checkbox" /> <span>Remember me</span>
            </label>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <button type="submit" className="auth-btn">
            Login <i className="fas fa-sign-in-alt"></i>
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Register now</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
