import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Hero.css";

const Hero = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (from && to && date) {
      navigate(`/search?from=${from}&to=${to}&date=${date}`);
    }
  };

  const cities = ["Ho Chi Minh", "Da Lat", "Nha Trang"];

  return (
    <div className="hero">
      <div className="hero-content">
        <h1>Find Your Perfect Trip</h1>
        <p>Book bus tickets online with ease and comfort.</p>
        
        <form className="search-form" onSubmit={handleSearch}>
          <div className="input-group">
            <label><i className="fas fa-map-marker-alt"></i> From</label>
            <select value={from} onChange={(e) => setFrom(e.target.value)} required>
              <option value="">Select city</option>
              {cities.map(city => <option key={city} value={city}>{city}</option>)}
            </select>
          </div>
          
          <div className="input-group">
            <label><i className="fas fa-location-arrow"></i> To</label>
            <select value={to} onChange={(e) => setTo(e.target.value)} required>
              <option value="">Select city</option>
              {cities.map(city => <option key={city} value={city}>{city}</option>)}
            </select>
          </div>
          
          <div className="input-group">
            <label><i className="fas fa-calendar-day"></i> Date</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              min={new Date().toISOString().split("T")[0]}
              required 
            />
          </div>
          
          <button type="submit" className="search-btn">
            <i className="fas fa-search"></i>
            Search Trips
          </button>
        </form>
      </div>
    </div>
  );
};

export default Hero;