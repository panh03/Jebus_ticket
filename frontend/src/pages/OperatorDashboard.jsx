import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import "./OperatorDashboard.css";

const OperatorDashboard = () => {
   const { user } = useContext(AuthContext);
   const [activeTab, setActiveTab] = useState("trips");
   const [trips, setTrips] = useState([]);
   const [routes, setRoutes] = useState([]);
   const [promotions, setPromotions] = useState([]);
   const [requests, setRequests] = useState([]);
   const [selectedTripDetails, setSelectedTripDetails] = useState(null);
   const [selectedRoute, setSelectedRoute] = useState(null);
   const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
      fetchAllData();
   }, []);

   useEffect(() => {
      fetchActiveTabData();
   }, [activeTab, selectedRoute]);

   const fetchAllData = async () => {
      try {
         const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/operator/trips`);
         setTrips(res.data);
      } catch (err) { console.error(err); }
   }

   const fetchActiveTabData = async () => {
      setIsLoading(true);
      try {
         if (activeTab === "trips") {
            const url = selectedRoute
               ? `${import.meta.env.VITE_API_URL}/api/operator/trips?routeId=${selectedRoute.id}`
               : `${import.meta.env.VITE_API_URL}/api/operator/trips`;
            const res = await axios.get(url);
            setTrips(res.data);
         } else if (activeTab === "routes") {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/operator/routes`);
            setRoutes(res.data);
         } else if (activeTab === "promotions") {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/operator/promotions`);
            setPromotions(res.data);
         } else if (activeTab === "requests") {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/operator/cancellations`);
            setRequests(res.data);
         }
      } catch (err) {
         console.error("Error fetching data:", err);
      } finally {
         setIsLoading(false);
      }
   };

   const updateTripStatus = async (tripId, newStatus) => {
      try {
         await axios.put(`${import.meta.env.VITE_API_URL}/api/operator/trips/${tripId}/status`, { status: newStatus });
         fetchActiveTabData();
      } catch (err) {
         alert("Failed to update status");
      }
   };

   const processCancellation = async (requestId, status) => {
      try {
         await axios.put(`${import.meta.env.VITE_API_URL}/api/operator/cancellations/${requestId}`, { status });
         alert(`Request ${status} successfully`);
         fetchActiveTabData();
      } catch (err) {
         alert("Action failed: " + (err.response?.data?.message || err.message));
      }
   };

   const handleRouteClick = (route) => {
      setSelectedRoute(route);
      setActiveTab("trips");
   };

   const clearRouteFilter = () => {
      setSelectedRoute(null);
      setActiveTab("trips");
   };

   const viewTripDetails = async (instanceId) => {
      setIsLoading(true);
      try {
         const [passRes, seatsRes] = await Promise.all([
            axios.get(`${import.meta.env.VITE_API_URL}/api/operator/trips/${instanceId}/passengers`),
            axios.get(`${import.meta.env.VITE_API_URL}/api/operator/trips/${instanceId}/seats`)
         ]);

         setSelectedTripDetails({
            tripId: instanceId,
            passengers: passRes.data,
            seats: seatsRes.data
         });
         setActiveTab("trip-detail");
      } catch (err) {
         alert("Failed to fetch trip details");
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <div className="operator-dashboard">
         <aside className="sidebar">
            <div className="sidebar-header">
               <i className="fas fa-bus-alt"></i>
               <span>Operator Studio</span>
            </div>
            <nav className="sidebar-nav">
               <button className={activeTab === 'trips' && !selectedRoute ? 'active' : ''} onClick={() => { setActiveTab('trips'); setSelectedRoute(null); }}>
                  <i className="fas fa-route"></i> Manage Trips
               </button>
               <button className={activeTab === 'routes' ? 'active' : ''} onClick={() => setActiveTab('routes')}>
                  <i className="fas fa-map-marked-alt"></i> View Routes
               </button>
               <button className={activeTab === 'requests' ? 'active' : ''} onClick={() => setActiveTab('requests')}>
                  <i className="fas fa-bell"></i> Requests
                  {requests.length > 0 && <span className="badge-notif">{requests.length}</span>}
               </button>
               <button className={activeTab === 'promotions' ? 'active' : ''} onClick={() => setActiveTab('promotions')}>
                  <i className="fas fa-percentage"></i> Promotions
               </button>
               <button className={activeTab === 'trip-detail' ? 'active' : ''} onClick={() => setActiveTab('trip-detail')}>
                  <i className="fas fa-users"></i> Trip Detail
               </button>
            </nav>
            <div className="sidebar-footer">
               <div className="user-pill">
                  <div className="avatar">{user?.name?.charAt(0)}</div>
                  <div className="user-info">
                     <span className="name">{user?.name}</span>
                     <span className="role">Operator</span>
                  </div>
               </div>
            </div>
         </aside>

         <main className="dashboard-content">
            <header className="content-header">
               <div className="title-group">
                  <h1>
                     {activeTab === 'trips' && selectedRoute ? 'Filtered Trips' : activeTab === 'trip-detail' ? 'Trip Execution Detail' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                  </h1>
                  {selectedRoute && activeTab === 'trips' && (
                     <p className="subtitle">
                        Showing runs for <strong>{selectedRoute.from_city} &rarr; {selectedRoute.to_city}</strong>
                        <button className="clear-btn" onClick={clearRouteFilter}>&times; Clear Filter</button>
                     </p>
                  )}
               </div>

               <div className="stats-row">
                  <div className="stat-card">
                     <span className="stat-val">
                        {trips.filter(t => t.status !== 'cancelled').length}
                     </span>
                     <span className="stat-label">
                        {selectedRoute ? 'Active Runs Found' : 'Total Active Runs'}
                     </span>
                  </div>
               </div>
            </header>

            {isLoading ? (
               <div className="loading-spinner">
                  <div className="spinner"></div>
                  <p>Fetching operation data...</p>
               </div>
            ) : (
               <div className="tab-pane">
                  {activeTab === "trips" && (
                     <div className="table-container animate-fade-in">
                        <table className="dashboard-table">
                           <thead>
                              <tr>
                                 <th>Route</th>
                                 <th>Departure Date</th>
                                 <th>Time Range</th>
                                 <th>Status</th>
                                 <th>Actions</th>
                              </tr>
                           </thead>
                           <tbody>
                              {trips.length === 0 ? (
                                 <tr><td colSpan="5" className="empty-row text-center">No runs found for this selection</td></tr>
                              ) : (
                                 trips.map(trip => (
                                    <tr key={trip.id} className={trip.status === 'cancelled' ? 'is-disabled' : ''}>
                                       <td>
                                          <div className="route-cell">
                                             <strong>{trip.from_city}</strong>
                                             <i className="fas fa-arrow-right"></i>
                                             <strong>{trip.to_city}</strong>
                                          </div>
                                       </td>
                                       <td>{new Date(trip.departure_datetime).toLocaleDateString()}</td>
                                       <td>
                                          <div className="time-range">
                                             <span>{trip.departure_time}</span>
                                             <i className="fas fa-minus"></i>
                                             <span>{trip.arrival_time}</span>
                                          </div>
                                       </td>
                                       <td>
                                          <span className={`status-badge ${trip.status}`}>{trip.status}</span>
                                       </td>
                                       <td>
                                          <div className="action-btns">
                                             <button className="view-btn green" onClick={() => viewTripDetails(trip.id)}>
                                                <i className="fas fa-list-alt"></i> Passengers & Seats
                                             </button>
                                             <select
                                                className="status-select"
                                                value={trip.status}
                                                onChange={(e) => updateTripStatus(trip.id, e.target.value)}
                                             >
                                                <option value="scheduled">Scheduled</option>
                                                <option value="on_time">On Time</option>
                                                <option value="delayed">Delayed</option>
                                                <option value="cancelled">Cancelled</option>
                                             </select>
                                          </div>
                                       </td>
                                    </tr>
                                 )))}
                           </tbody>
                        </table>
                     </div>
                  )}

                  {activeTab === "routes" && (
                     <div className="routes-grid animate-fade-in">
                        {routes.map(route => (
                           <div className="route-card clickable" key={route.id} onClick={() => handleRouteClick(route)}>
                              <div className="route-card-header">
                                 <span className="route-id">Route #{route.id}</span>
                                 <span className="dist">{route.distance} km</span>
                              </div>
                              <h3>{route.from_city} &rarr; {route.to_city}</h3>
                              <p><i className="fas fa-clock"></i> Est. Time: {route.duration}</p>
                              <div className="card-footer">
                                 <span>Click to view runs &rarr;</span>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}

                  {activeTab === "requests" && (
                     <div className="requests-container animate-fade-in">
                        <table className="dashboard-table">
                           <thead>
                              <tr>
                                 <th>Passenger</th>
                                 <th>Trip</th>
                                 <th>Departure</th>
                                 <th>Reason</th>
                                 <th>Amount</th>
                                 <th>Actions</th>
                              </tr>
                           </thead>
                           <tbody>
                              {requests.length === 0 ? (
                                 <tr><td colSpan="6" className="empty-row text-center">No pending cancellation requests</td></tr>
                              ) : (
                                 requests.map(req => (
                                    <tr key={req.id}>
                                       <td><strong>{req.passenger_name}</strong></td>
                                       <td>{req.from_city} &rarr; {req.to_city}</td>
                                       <td>{new Date(req.departure_datetime).toLocaleDateString()}</td>
                                       <td><div className="reason-text">{req.reason}</div></td>
                                       <td><strong>{Number(req.total_price).toLocaleString()} VND</strong></td>
                                       <td>
                                          <div className="action-btns">
                                             <button className="approve-btn" onClick={() => processCancellation(req.id, 'approved')}>Approve</button>
                                             <button className="reject-btn" onClick={() => processCancellation(req.id, 'rejected')}>Reject</button>
                                          </div>
                                       </td>
                                    </tr>
                                 )))}
                           </tbody>
                        </table>
                     </div>
                  )}

                  {activeTab === "promotions" && (
                     <div className="promotions-list animate-fade-in">
                        <header className="list-header">
                           <h3>Active Promotions</h3>
                           <button className="add-promo-btn"><i className="fas fa-plus"></i> New Promotion</button>
                        </header>
                        <div className="promo-grid">
                           {promotions.map(p => (
                              <div className="promo-card" key={p.id}>
                                 <div className="promo-code">{p.code}</div>
                                 <div className="promo-value">
                                    {p.discount_type === 'percentage' ? `${p.discount_value}%` : `${p.discount_value.toLocaleString()} VND`} Off
                                 </div>
                                 <div className="promo-meta">
                                    <span><i className="fas fa-users"></i> {p.used_count}/{p.max_uses}</span>
                                    <span className={new Date(p.valid_until) < new Date() ? 'expired' : 'valid'}>
                                       {new Date(p.valid_until) < new Date() ? 'Expired' : 'Valid'}
                                    </span>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

                  {activeTab === "trip-detail" && selectedTripDetails && (
                     <div className="trip-detail-view animate-fade-in">
                        <button className="back-link" onClick={() => setActiveTab('trips')}>
                           &larr; Back to Trips List
                        </button>

                        <div className="detail-grid">
                           <section className="seat-section card">
                              <h3><i className="fas fa-chair"></i> Seat Map</h3>
                              <div className="seat-grid">
                                 {selectedTripDetails.seats.map(seat => (
                                    <div key={seat.id} className={`seat-sq ${seat.status}`} title={seat.passenger_name || 'Available'}>
                                       <span className="seat-num">{seat.seat_number}</span>
                                       {seat.status === 'booked' && <i className="fas fa-user-check"></i>}
                                    </div>
                                 ))}
                              </div>
                              <div className="seat-legend">
                                 <span className="legend-item"><span className="sq available"></span> Available</span>
                                 <span className="legend-item"><span className="sq booked"></span> Booked</span>
                              </div>
                           </section>

                           <section className="passengers-section card">
                              <h3><i className="fas fa-users"></i> Manifest</h3>
                              <table className="manifest-table">
                                 <thead>
                                    <tr>
                                       <th>Passenger</th>
                                       <th>Phone</th>
                                       <th>Seats</th>
                                       <th>Points</th>
                                    </tr>
                                 </thead>
                                 <tbody>
                                    {selectedTripDetails.passengers.length === 0 ? (
                                       <tr><td colSpan="4" className="text-center py-4">No bookings yet for this run</td></tr>
                                    ) : (
                                       selectedTripDetails.passengers.map(p => (
                                          <tr key={p.booking_id}>
                                             <td><strong>{p.passenger_name}</strong></td>
                                             <td>{p.passenger_phone}</td>
                                             <td><span className="seats-highlight">{p.seats}</span></td>
                                             <td>
                                                <div className="point-info">
                                                   <span>Pick: {p.pickup_point}</span>
                                                   <span>Drop: {p.dropoff_point}</span>
                                                </div>
                                             </td>
                                          </tr>
                                       )))}
                                 </tbody>
                              </table>
                           </section>
                        </div>
                     </div>
                  )}

                  {activeTab === "trip-detail" && !selectedTripDetails && (
                     <div className="empty-state">
                        <i className="fas fa-calendar-alt"></i>
                        <p>Select a trip run from 'Manage Trips' to see live occupancy and passenger lists</p>
                        <button className="goto-btn" onClick={() => setActiveTab('trips')}>Go to Manage Trips</button>
                     </div>
                  )}
               </div>
            )}
         </main>
      </div>
   );
};

export default OperatorDashboard;
