import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import Filters from "../components/Filters/Filters";
import "./Search.css";

const formatVietnameseDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const dayName = days[d.getDay()];
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dayName}, ${dd}/${mm}/${yyyy}`;
};

const operatorImages = [
  "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=300&h=300",
  "https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?auto=format&fit=crop&q=80&w=300&h=300",
  "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&q=80&w=300&h=300",
  "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=300&h=300",
  "https://images.unsplash.com/photo-1532939163844-547f958e91b4?auto=format&fit=crop&q=80&w=300&h=300",
  "https://images.unsplash.com/photo-1518081461904-9d8f136351c2?auto=format&fit=crop&q=80&w=300&h=300",
  "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&q=80&w=300&h=300",
  "https://images.unsplash.com/photo-1554223090-7e482851df45?auto=format&fit=crop&q=80&w=300&h=300",
  "https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=300&h=300",
  "https://images.unsplash.com/photo-1563298723-dcfebaa392e3?auto=format&fit=crop&q=80&w=300&h=300",
  "https://images.unsplash.com/photo-1611003228941-98852ba62227?auto=format&fit=crop&q=80&w=300&h=300",
  "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=300&h=300",
  "https://images.unsplash.com/photo-1494515843206-f3117d3f51b7?auto=format&fit=crop&q=80&w=300&h=300",
  "https://images.unsplash.com/photo-1508253730651-e5ace80a7025?auto=format&fit=crop&q=80&w=300&h=300",
  "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=300&h=300",
];

const getTripImage = (operatorName, tripId) => {
  if (!operatorName) return operatorImages[0];
  
  let opHash = 0;
  for (let i = 0; i < operatorName.length; i++) {
    opHash = operatorName.charCodeAt(i) + ((opHash << 5) - opHash);
  }
  
  const poolSize = 3;
  const numPools = Math.floor(operatorImages.length / poolSize);
  const poolIndex = Math.abs(opHash) % numPools;
  
  const strId = String(tripId);
  let tripHash = 0;
  for (let i = 0; i < strId.length; i++) {
    tripHash = strId.charCodeAt(i) + ((tripHash << 5) - tripHash);
  }
  
  const imageIndexWithinPool = Math.abs(tripHash) % poolSize;
  const finalIndex = (poolIndex * poolSize) + imageIndexWithinPool;
  
  return operatorImages[finalIndex];
};

const formatTime12h = (dateStr) => {
  if (!dateStr) return '';
  let timePart = typeof dateStr === 'string' ? dateStr : new Date(dateStr).toISOString();
  if (timePart.includes(' ')) timePart = timePart.split(' ')[1];
  else if (timePart.includes('T')) timePart = timePart.split('T')[1];
  const [h, m] = timePart.split(':');
  const hours = parseInt(h, 10);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hours12 = ((hours + 11) % 12 + 1);
  const padH = String(hours12).padStart(2, '0');
  const padM = m.padStart(2, '0');
  return `${padH}:${padM} ${suffix}`;
};

const Search = () => {
  const [searchParams] = useSearchParams();
  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    maxPrice: 1000000,
    operators: [],
    times: []
  });

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const date = searchParams.get("date");

  useEffect(() => {
    const fetchTrips = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/trips/search?from=${from}&to=${to}&date=${date}`);
        setTrips(response.data);
      } catch (error) {
        console.error("Error fetching trips:", error);
      } finally {
        setLoading(false);
      }
    };

    if (from && to && date) fetchTrips();
  }, [from, to, date]);

  useEffect(() => {
    let result = trips;

    // Price Filter
    result = result.filter(t => Number(t.price) <= filters.maxPrice);

    // Operator Filter
    if (filters.operators.length > 0) {
      result = result.filter(t => filters.operators.includes(t.operator));
    }

    // Time Filter
    if (filters.times.length > 0) {
      result = result.filter(t => {
        let timePart = typeof t.departure === 'string' ? t.departure : new Date(t.departure).toISOString();
        if (timePart.includes(' ')) timePart = timePart.split(' ')[1];
        else if (timePart.includes('T')) timePart = timePart.split('T')[1];
        const hour = parseInt(timePart.split(':')[0], 10);
        if (filters.times.includes("Morning (0-6)") && hour >= 0 && hour < 6) return true;
        if (filters.times.includes("Day (6-12)") && hour >= 6 && hour < 12) return true;
        if (filters.times.includes("Afternoon (12-18)") && hour >= 12 && hour < 18) return true;
        if (filters.times.includes("Evening (18-24)") && hour >= 18 && hour < 24) return true;
        return false;
      });
    }

    setFilteredTrips(result);
  }, [filters, trips]);

  const uniqueOperators = [...new Set(trips.map(t => t.operator))];

  return (
    <div className="search-page container">
      <header className="results-header-bar">
        <div className="search-section">
          <div className="section-icon">
            <i className="far fa-circle" style={{color: '#3b82f6'}}></i>
          </div>
          <div className="section-content">
            <label> Departure place</label>
            <input type="text" value={from || ''} readOnly />
          </div>
        </div>



        <div className="search-section">
          <div className="section-icon">
            <i className="fas fa-map-marker-alt" style={{color: '#ef4444'}}></i>
          </div>
          <div className="section-content">
            <label>Destination</label>
            <input type="text" value={to || ''} readOnly />
          </div>
        </div>

        <div className="section-divider"></div>

        <div className="search-section">
          <div className="section-icon">
            <i className="far fa-calendar-alt" style={{color: '#3b82f6'}}></i>
          </div>
          <div className="section-content">
            <label>Departure date</label>
            <div className="date-display">{formatVietnameseDate(date)}</div>
          </div>
        </div>
      </header>

      <div className="search-layout">
        <aside className="search-sidebar">
          <Filters 
            filters={filters} 
            setFilters={setFilters} 
            operators={uniqueOperators} 
          />
        </aside>

        <main className="search-results">
          {loading ? (
            <div className="loader">Searching for best deals...</div>
          ) : filteredTrips.length > 0 ? (
            <div className="trips-list">
              {filteredTrips.map(trip => {
                const numId = typeof trip.id === 'number' ? trip.id : parseInt(String(trip.id).replace(/\\D/g, '')) || 0;
                const randomRating = (4.5 + ((numId * 17) % 6) * 0.1).toFixed(1);
                const randomReviews = 50 + ((numId * 83) % 451);
                const randomDiscount = 10 + ((numId * 37) % 21);
                
                const discountMultiplier = 1 - (randomDiscount / 100);
                const originalPrice = Math.round((Number(trip.price) / discountMultiplier) / 1000) * 1000;
                
                const diffMs = new Date(trip.arrival) - new Date(trip.departure);
                const durationHrs = Math.floor(diffMs / (1000 * 60 * 60));
                const durationMins = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                
                return (
                  <div key={trip.id} className="trip-card">
                    <div className="trip-card-left">
                      <img 
                        src={getTripImage(trip.operator, trip.id)} 
                        alt={`${trip.operator} Bus`} 
                        className="bus-thumbnail" 
                      />
                    </div>
                    
                    <div className="trip-card-right">
                      <div className="card-row1">
                        <span className="operator-name">{trip.operator}</span>
                        <span className="rating-badge"><i className="fas fa-star"></i> {randomRating}</span>
                        <span className="review-count">({randomReviews} reviews)</span>
                      </div>

                      <div className="card-row2">
                        <span className="original-price">{originalPrice.toLocaleString('en-US')}đ</span>
                        <span className="new-price">{Number(trip.price).toLocaleString('en-US')}đ</span>
                        <span className="discount-tag">-{randomDiscount}%</span>
                      </div>

                      <div className="card-row3">
                        {trip.bus_info || 'Luxury Limousine'}
                      </div>

                      <div className="card-row4 trip-timeline">
                        <div className="timeline-point-time">{formatTime12h(trip.departure)}</div>
                        <div className="timeline-dot-wrapper">
                          <div className="timeline-dot"></div>
                        </div>
                        <div className="timeline-point-location">{from}</div>

                        <div></div>
                        <div className="timeline-line-wrapper">
                          <div className="timeline-line"></div>
                        </div>
                        <div className="timeline-duration-text">
                          {durationHrs}h {durationMins}m
                        </div>

                        <div className="timeline-point-time">{formatTime12h(trip.arrival)}</div>
                        <div className="timeline-dot-wrapper">
                          <div className="timeline-dot arrival"></div>
                        </div>
                        <div className="timeline-point-location">{to}</div>
                      </div>

                      <div className="trip-card-bottom">
                        <span className="seats-left">
                          {trip.available_seats} seats left
                        </span>
                        <Link to={`/trip/${trip.id}`} className="select-btn">
                          Select Trip
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-trips">
              <p>No trips found matching your filters. Try adjusting your preferences.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Search;