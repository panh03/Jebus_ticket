import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import "./Hero.css";

const Hero = () => {
  const { user } = useContext(AuthContext);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [cities, setCities] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionType, setSuggestionType] = useState("popular"); // 'history' or 'popular'
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/trips/cities`);
        setCities(res.data);
      } catch (err) {
        console.error("Error fetching cities:", err);
      }
    };
    fetchCities();
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        let history = [];
        if (user) {
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/trips/history`);
          history = res.data;
        } else {
          const localHistory = JSON.parse(localStorage.getItem("searchHistory") || "[]");
          history = localHistory.slice(0, 5);
        }

        if (history && history.length > 0) {
          setSuggestions(history);
          setSuggestionType("history");
        } else {
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/trips/popular`);
          setSuggestions(res.data);
          setSuggestionType("popular");
        }
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      }
    };
    fetchSuggestions();
  }, [user]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (from && to && date) {
      // Save history locally for both guest and logged in (as fallback)
      const localHistory = JSON.parse(localStorage.getItem("searchHistory") || "[]");
      const existingIdx = localHistory.findIndex(h => h.from_city === from && h.to_city === to);
      if (existingIdx !== -1) {
        localHistory[existingIdx].search_count = (localHistory[existingIdx].search_count || 1) + 1;
        const item = localHistory.splice(existingIdx, 1)[0];
        localHistory.unshift(item);
      } else {
        localHistory.unshift({ from_city: from, to_city: to, search_count: 1 });
      }
      localStorage.setItem("searchHistory", JSON.stringify(localHistory.slice(0, 10)));

      if (user) {
        try {
          await axios.post(`${import.meta.env.VITE_API_URL}/trips/history`, { from, to });
        } catch (err) {
          console.warn("Backend history save failed:", err.message);
        }
      }

      navigate(`/search?from=${from}&to=${to}&date=${date}`);
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    const fromCity = suggestion.from_city;
    const toCity = suggestion.to_city;

    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/trips/verify-route?from=${fromCity}&to=${toCity}`);
      if (!res.data.active) {
        alert("Sorry, this route is currently suspended.");
        return;
      }

      const today = new Date().toISOString().split("T")[0];
      
      // Set form state
      setFrom(fromCity);
      setTo(toCity);
      setDate(today);

      // Save history locally immediately
      const localHistory = JSON.parse(localStorage.getItem("searchHistory") || "[]");
      const existingIdx = localHistory.findIndex(h => h.from_city === fromCity && h.to_city === toCity);
      if (existingIdx !== -1) {
        localHistory[existingIdx].search_count = (localHistory[existingIdx].search_count || 1) + 1;
        const item = localHistory.splice(existingIdx, 1)[0];
        localHistory.unshift(item);
      } else {
        localHistory.unshift({ from_city: fromCity, to_city: toCity, search_count: 1 });
      }
      localStorage.setItem("searchHistory", JSON.stringify(localHistory.slice(0, 10)));

      if (user) {
        try { await axios.post(`${import.meta.env.VITE_API_URL}/trips/history`, { from: fromCity, to: toCity }); } catch(err) {}
      }

      navigate(`/search?from=${fromCity}&to=${toCity}&date=${today}`);
    } catch (err) {
      console.error("Error verifying route:", err);
      // Fallback: stay on page or proceed?
      navigate(`/search?from=${fromCity}&to=${toCity}&date=${new Date().toISOString().split("T")[0]}`);
    }
  };

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

        <div className="suggestions-container">
          <span className="suggestions-title">
            {suggestionType === "history" ? "Recent Searches" : "Popular Routes"}
          </span>
          <div className="suggestions-list">
            {suggestions.map((s, idx) => (
              <div 
                key={idx} 
                className="suggestion-chip"
                onClick={() => handleSuggestionClick(s)}
              >
                {suggestionType === "popular" && <span className="hot-tag">HOT</span>}
                <span className="route-text">{s.from_city} &rarr; {s.to_city}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;