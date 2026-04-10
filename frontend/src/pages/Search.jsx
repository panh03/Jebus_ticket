import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import Filters from "../components/Filters/Filters";
import "./Search.css";

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
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/trips/search?from=${from}&to=${to}&date=${date}`);
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
        const hour = new Date(t.departure).getHours();
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
      <header className="results-header">
        <h2>Trips from <span>{from}</span> to <span>{to}</span></h2>
        <p className="date-info">{new Date(date).toDateString()}</p>
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
              {filteredTrips.map(trip => (
                <div key={trip.id} className="trip-card">
                  <div className="trip-info">
                    <p className="operator">{trip.operator}</p>
                    <p className="bus-info">{trip.bus_info || 'Sleeper'}</p>
                    <div className="time-info">
                      <div className="time">
                        <strong>{new Date(trip.departure).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</strong>
                      </div>
                      <div className="duration-line"></div>
                      <div className="time">
                        <strong>{new Date(trip.arrival).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="trip-price">
                    <span className="price">{Number(trip.price).toLocaleString()} VND</span>
                    <span className="seats-left">{trip.available_seats} seats left</span>
                    <Link to={`/trip/${trip.id}`} className="view-btn">View Seats</Link>
                  </div>
                </div>
              ))}
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