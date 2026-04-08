import React from "react";
import "./Filters.css";

const Filters = ({ filters, setFilters, operators }) => {
  const handlePriceChange = (e) => {
    setFilters({ ...filters, maxPrice: e.target.value });
  };

  const handleOperatorToggle = (op) => {
    const newOps = filters.operators.includes(op)
      ? filters.operators.filter((item) => item !== op)
      : [...filters.operators, op];
    setFilters({ ...filters, operators: newOps });
  };

  const handleTimeToggle = (time) => {
    const newTimes = filters.times.includes(time)
      ? filters.times.filter((item) => item !== time)
      : [...filters.times, time];
    setFilters({ ...filters, times: newTimes });
  };

  return (
    <div className="filters-sidebar">
      <div className="filter-header">
        <h3>Filters</h3>
        <button className="reset-btn" onClick={() => setFilters({ maxPrice: 1000000, operators: [], times: [] })}>
          Reset
        </button>
      </div>

      {/* Price Filter */}
      <div className="filter-section">
        <h4>Max Price: {Number(filters.maxPrice).toLocaleString()} VND</h4>
        <input 
          type="range" 
          min="100000" 
          max="1000000" 
          step="50000"
          value={filters.maxPrice} 
          onChange={handlePriceChange}
          className="price-slider"
        />
        <div className="range-labels">
          <span>100k</span>
          <span>1M</span>
        </div>
      </div>

      {/* Operator Filter */}
      <div className="filter-section">
        <h4>Operators</h4>
        <div className="checkbox-list">
          {operators.map((op) => (
            <label key={op} className="checkbox-item">
              <input 
                type="checkbox" 
                checked={filters.operators.includes(op)}
                onChange={() => handleOperatorToggle(op)}
              />
              <span className="checkmark"></span>
              {op}
            </label>
          ))}
        </div>
      </div>

      {/* Time Filter */}
      <div className="filter-section">
        <h4>Departure Time</h4>
        <div className="checkbox-list">
          {["Morning (0-6)", "Day (6-12)", "Afternoon (12-18)", "Evening (18-24)"].map((time) => (
            <label key={time} className="checkbox-item">
              <input 
                type="checkbox" 
                checked={filters.times.includes(time)}
                onChange={() => handleTimeToggle(time)}
              />
              <span className="checkmark"></span>
              {time}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Filters;