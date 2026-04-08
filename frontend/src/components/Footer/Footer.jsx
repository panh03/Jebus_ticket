import React from "react";
import { FaBus, FaTwitter, FaInstagram, FaFacebookF, FaYoutube } from "react-icons/fa";
import "./Footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        
        {/* Brand Section */}
        <div className="footer-brand">
          <div className="logo">
            <FaBus />
            <span>JEBUS</span>
          </div>
          <p>
            Redefining modern travel with a focus on safety, comfort, and premium service. Experience the future of bus transportation today.
          </p>
          <div className="social-links">
            <a href="#" aria-label="Facebook"><FaFacebookF /></a>
            <a href="#" aria-label="Instagram"><FaInstagram /></a>
            <a href="#" aria-label="Twitter"><FaTwitter /></a>
            <a href="#" aria-label="Youtube"><FaYoutube /></a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h3>Services</h3>
          <ul className="footer-links">
            <li><a href="#">Online Booking</a></li>
            <li><a href="#">Route Network</a></li>
            <li><a href="#">Rental Packages</a></li>
            <li><a href="#">Premium Lounge</a></li>
          </ul>
        </div>

        {/* Resources */}
        <div className="footer-section">
          <h3>Information</h3>
          <ul className="footer-links">
            <li><a href="#">Travel Blog</a></li>
            <li><a href="#">News & Updates</a></li>
            <li><a href="#">FAQs</a></li>
            <li><a href="#">Careers</a></li>
          </ul>
        </div>

        {/* Legal */}
        <div className="footer-section">
          <h3>Legal</h3>
          <ul className="footer-links">
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Use</a></li>
            <li><a href="#">Refund Policy</a></li>
            <li><a href="#">Cookie Settings</a></li>
          </ul>
        </div>

      </div>

      <div className="footer-bottom">
        <p>© {currentYear} JEBus Ticket Global Inc. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;