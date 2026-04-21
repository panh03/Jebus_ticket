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
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, formData);
      setShowModal(true);
    } catch (error) {
      alert("Registration failed: " + (error.response?.data?.message || "Something went wrong"));
    } finally {
      setLoading(false);
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

      {showModal && (
        <div className="modal-overlay auth-modal-overlay">
          <div className="modal-content auth-modal-content animate-pop-in" style={{ textAlign: 'center', maxWidth: '450px' }}>
            <div className="success-icon" style={{ fontSize: '4rem', color: '#10b981', marginBottom: '1.5rem' }}>
              <i className="fas fa-check-circle"></i>
            </div>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#1f2937' }}>Registration successful!</h2>
            <p style={{ color: '#4b5563', lineHeight: '1.6', marginBottom: '2rem' }}>
              Congratulations! {formData.role === 'operator' 
                ? "Your vehicle registration profile has been submitted to the system. Please wait for the Admin to review your information within 24-48 business hours." 
                : "Your account has been created successfully. You can now log in and start booking your trips!"}
            </p>
            <button 
              className="auth-btn" 
              style={{ width: '100%' }}
              onClick={() => navigate(formData.role === 'operator' ? '/' : '/login')}
            >
              {formData.role === 'operator' ? 'Back to Homepage' : 'Go to Login'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
