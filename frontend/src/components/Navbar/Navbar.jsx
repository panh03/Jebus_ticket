import { useContext, useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./Navbar.css";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="logo">
          <img src="/logo.svg" alt="JEBus Logo" />
          JEBus<span>Ticket</span>
        </Link>
        <ul className="nav-links">
          <li><Link to="/search">Search Trips</Link></li>
          {user ? (
            <li className="profile-dropdown-container" ref={dropdownRef}>
              <button 
                className="profile-trigger" 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className="avatar">{user.name.charAt(0)}</div>
                <span className="welcome">Hi, {user.name}</span>
                <i className={`fas fa-chevron-${isDropdownOpen ? 'up' : 'down'}`}></i>
              </button>

              {isDropdownOpen && (
                <div className="profile-dropdown animate-fade-in">
                  <div className="dropdown-header">
                    <p className="user-email">{user.email}</p>
                    <span className="role-pill">{user.role}</span>
                  </div>
                  
                  <ul className="dropdown-menu">
                    {user.role === 'operator' ? (
                      <li><Link to="/operator/dashboard" onClick={() => setIsDropdownOpen(false)}><i className="fas fa-th-large"></i> Dashboard</Link></li>
                    ) : user.role === 'admin' ? (
                      <li><Link to="/admin/dashboard" onClick={() => setIsDropdownOpen(false)}><i className="fas fa-user-shield"></i> Admin Panel</Link></li>
                    ) : (
                      <li><Link to="/profile" onClick={() => setIsDropdownOpen(false)}><i className="fas fa-ticket-alt"></i> My Bookings</Link></li>
                    )}
                    
                    <li className="divider"></li>
                    <li>
                      <button onClick={handleLogout} className="dropdown-logout-btn">
                        <i className="fas fa-sign-out-alt"></i> Logout
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </li>
          ) : (
            <>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register" className="register-btn">Sign Up</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;