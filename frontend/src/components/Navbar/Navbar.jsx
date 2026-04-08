import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./Navbar.css";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="logo">JEBus<span>Ticket</span></Link>
        <ul className="nav-links">
          <li><Link to="/search">Search Trips</Link></li>
          {user ? (
            <>
              {user.role === 'operator' && (
                <li><Link to="/operator/dashboard" className="special-link">Operator Dashboard</Link></li>
              )}
              {user.role === 'user' && (
                <li><Link to="/profile">My Bookings</Link></li>
              )}
              <li><button onClick={handleLogout} className="logout-btn">Logout</button></li>
              <li className="user-info">
                 <span className="welcome">Hi, {user.name}</span>
                 <span className="role-pill">{user.role}</span>
              </li>
            </>
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