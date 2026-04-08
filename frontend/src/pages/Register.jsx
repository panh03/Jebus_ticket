import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./Auth.css";

const Register = () => {
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    phone: "",
    role: "user" 
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/auth/register", formData);
      alert("Registration successful! Please login.");
      navigate("/login");
    } catch (error) {
      alert("Registration failed: " + (error.response?.data?.message || "Something went wrong"));
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in">
        <header className="auth-header">
          <h2>Create Account</h2>
          <p>Join the future of bus travel with JEBus</p>
        </header>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="role-selector">
            <label className={`role-option ${formData.role === 'user' ? 'active' : ''}`}>
              <input 
                type="radio" 
                name="role" 
                value="user" 
                checked={formData.role === 'user'} 
                onChange={handleChange} 
              />
              <div className="role-content">
                <i className="fas fa-user"></i>
                <span>Passenger</span>
              </div>
            </label>
            <label className={`role-option ${formData.role === 'operator' ? 'active' : ''}`}>
              <input 
                type="radio" 
                name="role" 
                value="operator" 
                checked={formData.role === 'operator'} 
                onChange={handleChange} 
              />
              <div className="role-content">
                <i className="fas fa-bus"></i>
                <span>Bus Operator</span>
              </div>
            </label>
          </div>

          <div className="input-group">
            <div className="input-field">
              <label><i className="fas fa-id-card"></i> Full Name</label>
              <input type="text" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="input-field">
              <label><i className="fas fa-envelope"></i> Email Address</label>
              <input type="email" name="email" placeholder="john@example.com" value={formData.email} onChange={handleChange} required />
            </div>
          </div>

          <div className="input-group">
            <div className="input-field">
              <label><i className="fas fa-phone"></i> Phone Number</label>
              <input type="text" name="phone" placeholder="0901234567" value={formData.phone} onChange={handleChange} required />
            </div>
            <div className="input-field">
              <label><i className="fas fa-lock"></i> Password</label>
              <input type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
            </div>
          </div>

          <button type="submit" className="auth-btn">
            Sign Up <i className="fas fa-arrow-right"></i>
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
