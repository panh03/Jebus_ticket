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
   const [editingTrip, setEditingTrip] = useState(null);
   const [editingRoute, setEditingRoute] = useState(null);

   // Modal & Form States
   const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
   const [isTripModalOpen, setIsTripModalOpen] = useState(false);
   const [routeForm, setRouteForm] = useState({
      from_city: "", to_city: "", distance: "", duration: "", base_price: "", is_active: true
   });
   const [tripForm, setTripForm] = useState({
      route_id: "", bus_info: "", capacity: 36, departs_at: "", arrives_at: "", price_multiplier: 1.0, status: "scheduled", repeat_7_days: false
   });

   // Helper for auth headers
   const getAuthHeader = () => {
      const token = localStorage.getItem("token");
      return { headers: { Authorization: `Bearer ${token}` } };
   };

   useEffect(() => {
      fetchAllData();
   }, []);

   useEffect(() => {
      fetchActiveTabData();
   }, [activeTab, selectedRoute]);

   const fetchAllData = async () => {
      try {
         const [tripsRes, routesRes] = await Promise.all([
            axios.get(`${import.meta.env.VITE_API_URL}/api/operator/trips`, getAuthHeader()),
            axios.get(`${import.meta.env.VITE_API_URL}/api/operator/routes`, getAuthHeader())
         ]);
         setTrips(tripsRes.data);
         setRoutes(routesRes.data);
      } catch (err) {
         console.error("Error fetching operations data:", err);
      }
   }

   const fetchActiveTabData = async () => {
      setIsLoading(true);
      try {
         if (activeTab === "trips") {
            const url = selectedRoute
               ? `${import.meta.env.VITE_API_URL}/api/operator/trips?routeId=${selectedRoute.id}`
               : `${import.meta.env.VITE_API_URL}/api/operator/trips`;
            const res = await axios.get(url, getAuthHeader());
            setTrips(res.data);
         } else if (activeTab === "routes") {
            const routes = await axios.get(`${import.meta.env.VITE_API_URL}/api/operator/routes`, getAuthHeader());
            setRoutes(routes.data);
         } else if (activeTab === "promotions") {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/operator/promotions`, getAuthHeader());
            setPromotions(res.data);
         } else if (activeTab === "requests") {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/operator/cancellations`, getAuthHeader());
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
         await axios.put(`${import.meta.env.VITE_API_URL}/api/operator/trips/${tripId}/status`, { status: newStatus }, getAuthHeader());
         fetchActiveTabData();
      } catch (err) {
         alert("Failed to update status");
      }
   };

   const processCancellation = async (requestId, status) => {
      try {
         await axios.put(`${import.meta.env.VITE_API_URL}/api/operator/cancellations/${requestId}`, { status }, getAuthHeader());
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
            axios.get(`${import.meta.env.VITE_API_URL}/api/operator/trips/${instanceId}/passengers`, getAuthHeader()),
            axios.get(`${import.meta.env.VITE_API_URL}/api/operator/trips/${instanceId}/seats`, getAuthHeader())
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

   const handleAddRoute = async (e) => {
      e.preventDefault();
      try {
         if (editingRoute) {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/operator/routes/${editingRoute.id}`, routeForm, getAuthHeader());
         } else {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/operator/routes`, routeForm, getAuthHeader());
         }
         setIsRouteModalOpen(false);
         setEditingRoute(null);
         setRouteForm({ from_city: "", to_city: "", distance: "", duration: "", base_price: "", is_active: true });
         fetchActiveTabData();
      } catch (err) { alert("Failed to save route"); }
   };

   const openRouteModal = () => {
      setEditingRoute(null);
      setRouteForm({ from_city: "", to_city: "", distance: "", duration: "", base_price: "", is_active: true });
      setIsRouteModalOpen(true);
   };

   const openEditRouteModal = (route, e) => {
      e.stopPropagation();
      setEditingRoute(route);
      setRouteForm({
         from_city: route.from_city,
         to_city: route.to_city,
         distance: route.distance,
         duration: route.duration,
         base_price: route.base_price,
         is_active: route.is_active
      });
      setIsRouteModalOpen(true);
   };

   const handleDeleteRoute = async (id, e) => {
      e.stopPropagation();
      if (!window.confirm("Are you sure you want to remove this route? All associated data will be lost.")) return;
      try {
         await axios.delete(`${import.meta.env.VITE_API_URL}/api/operator/routes/${id}`, getAuthHeader());
         fetchActiveTabData();
      } catch (err) {
         alert(err.response?.data?.message || "Failed to delete route");
      }
   };

   const handleAddTrip = async (e) => {
      e.preventDefault();
      try {
         if (editingTrip) {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/operator/trips/${editingTrip.id}`, tripForm, getAuthHeader());
         } else {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/operator/trips`, tripForm, getAuthHeader());
         }
         setIsTripModalOpen(false);
         setEditingTrip(null);
         await fetchActiveTabData();
      } catch (err) { alert("Failed to save trip: " + (err.response?.data?.message || err.message)); }
   };

   const handleDeleteTrip = async (id) => {
      if (!window.confirm("Delete this trip instance? This action cannot be undone.")) return;
      try {
         await axios.delete(`${import.meta.env.VITE_API_URL}/api/operator/trips/${id}`, getAuthHeader());
         fetchActiveTabData();
      } catch (err) {
         alert(err.response?.data?.message || "Failed to delete trip");
      }
   };

   const openTripModal = (preSelectRoute = null) => {
      setEditingTrip(null);
      setTripForm({
         route_id: preSelectRoute?.id || selectedRoute?.id || "",
         bus_info: "",
         capacity: 36,
         departs_at: "",
         arrives_at: "",
         price_multiplier: 1.0,
         status: "scheduled",
         repeat_7_days: false
      });
      setIsTripModalOpen(true);
   };

   const openEditTripModal = (trip) => {
      setEditingTrip(trip);
      setTripForm({
         route_id: trip.route_id,
         bus_info: trip.bus_info,
         capacity: trip.capacity,
         departs_at: new Date(trip.departure_datetime).toISOString().slice(0, 16),
         arrives_at: new Date(trip.arrival_datetime).toISOString().slice(0, 16),
         price_multiplier: trip.price_multiplier,
         status: trip.status,
         repeat_7_days: false
      });
      setIsTripModalOpen(true);
   };

   return (
      <div className="operator-dashboard">
         <aside className="sidebar">
            <div className="sidebar-header">
               <i className="fas fa-bus-alt"></i>
               <span>Operator Studio</span>
            </div>
            <nav className="sidebar-nav">
               <button className={activeTab === 'trips' ? 'active' : ''} onClick={() => { setActiveTab('trips'); setSelectedRoute(null); }}>
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
                        <div className="add-trip-floating">
                           <button className="add-promo-btn" onClick={() => openTripModal()}>
                              <i className="fas fa-plus"></i> New Trip Run
                           </button>
                        </div>
                        <table className="dashboard-table">
                           <thead>
                              <tr>
                                 <th>Route</th>
                                 <th>Bus Info</th>
                                 <th>Departure Date</th>
                                 <th>Arrival Date</th>
                                 <th>Time Range</th>
                                 <th>Bookings</th>
                                 <th>Price (Final)</th>
                                 <th>Status</th>
                                 <th>Actions</th>
                              </tr>
                           </thead>
                           <tbody>
                              {trips.length === 0 ? (
                                 <tr><td colSpan="9" className="empty-row text-center">No runs found for this selection</td></tr>
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
                                       <td>
                                          <div className="bus-info-cell">
                                             <span className="info-text">{trip.bus_info || 'Manual Entry'}</span>
                                             <span className="cap">{trip.capacity} seats</span>
                                          </div>
                                       </td>
                                       <td>{new Date(trip.departure_datetime).toLocaleDateString()}</td>
                                       <td>{new Date(trip.arrival_datetime).toLocaleDateString()}</td>
                                       <td>
                                          <div className="time-range">
                                             <span>{trip.departure_time}</span>
                                             <i className="fas fa-minus"></i>
                                             <span>{trip.arrival_time}</span>
                                          </div>
                                       </td>
                                       <td>
                                          <div className="booking-stat">
                                             <span className={`count ${trip.booking_count > 0 ? 'active' : ''}`}>
                                                {trip.booking_count}
                                             </span>
                                             <span className="of">/{trip.capacity}</span>
                                          </div>
                                       </td>
                                       <td>
                                          <strong>{(trip.price * (trip.price_multiplier || 1)).toLocaleString()} VND</strong>
                                       </td>
                                       <td>
                                          <span className={`status-badge ${trip.status}`}>{trip.status}</span>
                                       </td>
                                       <td>
                                          <div className="action-btns">
                                             <button className="view-btn green" onClick={() => viewTripDetails(trip.id)}>
                                                <i className="fas fa-list-alt"></i> Details
                                             </button>
                                             <button className="view-btn" onClick={() => openEditTripModal(trip)}>
                                                <i className="fas fa-edit"></i>
                                             </button>
                                             <button 
                                                className={`view-btn ${trip.booking_count > 0 ? 'disabled-action' : 'red-text'}`} 
                                                onClick={() => handleDeleteTrip(trip.id)}
                                                disabled={trip.booking_count > 0}
                                                title={trip.booking_count > 0 ? "Cannot delete trip with active bookings" : "Delete trip"}
                                             >
                                                <i className="fas fa-trash-alt"></i>
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
                                                <option value="completed">Completed</option>
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
                     <div className="routes-management animate-fade-in">
                        <header className="list-header" style={{ marginBottom: '2rem' }}>
                           <div className="title-group">
                              <h3>Route Master List</h3>
                              <p className="subtitle">Manage and view all available travel corridors</p>
                           </div>
                           <button className="add-promo-btn" onClick={openRouteModal}>
                              <i className="fas fa-plus"></i> Add New Route
                           </button>
                        </header>

                        <div className="routes-grid">
                           {routes.map(route => (
                              <div
                                 key={route.id}
                                 className="route-card clickable"
                                 onClick={() => handleRouteClick(route)}
                              >
                                 <div className="route-card-header">
                                    <span className="route-id">Route #{route.id}</span>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                       <span className="dist"><i className="fas fa-road"></i> {route.distance} km</span>
                                       <button className="delete-icon-btn" style={{ background: '#f1f5f9', color: '#64748b' }} onClick={(e) => openEditRouteModal(route, e)}>
                                          <i className="fas fa-edit"></i>
                                       </button>
                                       <button 
                                          className={`delete-icon-btn ${route.active_trips > 0 ? 'disabled-action' : ''}`} 
                                          onClick={(e) => route.active_trips === 0 && handleDeleteRoute(route.id, e)}
                                          title={route.active_trips > 0 ? "Cannot delete route with active trips" : "Delete route"}
                                       >
                                          <i className="fas fa-times"></i>
                                       </button>
                                    </div>
                                 </div>
                                 <div className="route-main">
                                    <h3>{route.from_city} &rarr; {route.to_city}</h3>
                                    <div className="route-tags">
                                       <span className="meta-item"><i className="fas fa-clock"></i> {route.duration}</span>
                                       <span className="meta-item"><i className="fas fa-tag"></i> {Number(route.base_price || 0).toLocaleString()} VND</span>
                                       <span className={`meta-item ${route.active_trips > 0 ? 'active-pulse' : ''}`}>
                                          <i className="fas fa-bus"></i> {route.active_trips} Active Trips
                                       </span>
                                    </div>
                                 </div>
                                 <div className="card-footer">
                                    <span>View Scheduled Trips &rarr;</span>
                                 </div>
                              </div>
                           ))}
                        </div>
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

         {/* Add/Edit Route Modal */}
         {isRouteModalOpen && (
            <div className="modal-overlay">
               <div className="modal-content">
                  <div className="modal-header">
                     <h2>{editingRoute ? 'Edit travel corridor' : 'Create New Route'}</h2>
                     <button className="close-modal" onClick={() => { setIsRouteModalOpen(false); setEditingRoute(null); }}>&times;</button>
                  </div>
                  <form onSubmit={handleAddRoute}>
                     <div className="modal-body">
                        <div className="form-row">
                           <div className="form-group">
                              <label>Origin City</label>
                              <input type="text" className="form-input" required
                                 value={routeForm.from_city} onChange={e => setRouteForm({ ...routeForm, from_city: e.target.value })} />
                           </div>
                           <div className="form-group">
                              <label>Destination City</label>
                              <input type="text" className="form-input" required
                                 value={routeForm.to_city} onChange={e => setRouteForm({ ...routeForm, to_city: e.target.value })} />
                           </div>
                        </div>
                        <div className="form-row">
                           <div className="form-group">
                              <label>Distance (km)</label>
                              <input type="number" className="form-input" required
                                 value={routeForm.distance} onChange={e => setRouteForm({ ...routeForm, distance: e.target.value })} />
                           </div>
                           <div className="form-group">
                              <label>Duration (e.g., 6 hours)</label>
                              <input type="text" className="form-input" required
                                 value={routeForm.duration} onChange={e => setRouteForm({ ...routeForm, duration: e.target.value })} />
                           </div>
                        </div>
                        <div className="form-group">
                           <label>Base Price (VND)</label>
                           <input type="number" className="form-input" required
                              value={routeForm.base_price} onChange={e => setRouteForm({ ...routeForm, base_price: e.target.value })} />
                        </div>
                        <div className="form-group">
                           <label className="form-checkbox">
                              <input type="checkbox" checked={routeForm.is_active}
                                 onChange={e => setRouteForm({ ...routeForm, is_active: e.target.checked })} />
                              Route is active and visible
                           </label>
                        </div>
                     </div>
                     <div className="modal-footer">
                        <button type="button" className="cancel-btn" onClick={() => { setIsRouteModalOpen(false); setEditingRoute(null); }}>Cancel</button>
                        <button type="submit" className="save-btn">{editingRoute ? 'Update Route' : 'Create Route'}</button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         {/* Add/Edit Trip Modal */}
         {isTripModalOpen && (
            <div className="modal-overlay">
               <div className="modal-content">
                  <div className="modal-header">
                     <h2>{editingTrip ? 'Edit Trip Details' : 'Schedule New Trip'}</h2>
                     <button className="close-modal" onClick={() => { setIsTripModalOpen(false); setEditingTrip(null); }}>&times;</button>
                  </div>
                  <form onSubmit={handleAddTrip}>
                     <div className="modal-body">
                        <div className="form-group">
                           <label>Select Route</label>
                           <select className="form-select" required value={tripForm.route_id}
                              onChange={e => setTripForm({ ...tripForm, route_id: e.target.value })}>
                              <option value="">-- Choose a Route --</option>
                              {routes.map(r => (
                                 <option key={r.id} value={r.id}>{r.from_city} &rarr; {r.to_city}</option>
                              ))}
                           </select>
                        </div>
                        <div className="form-row">
                           <div className="form-group">
                              <label>Bus Info (Plate / Type)</label>
                              <input type="text" className="form-input" placeholder="e.g. 51B-12345 (Sleeper)" required
                                 value={tripForm.bus_info} onChange={e => setTripForm({ ...tripForm, bus_info: e.target.value })} />
                           </div>
                           <div className="form-group">
                              <label>Bus Capacity</label>
                              <input type="number" className="form-input" required
                                 value={tripForm.capacity} onChange={e => setTripForm({ ...tripForm, capacity: e.target.value })} />
                           </div>
                        </div>
                        <div className="form-row">
                           <div className="form-group">
                              <label>Departure Date & Time</label>
                              <input type="datetime-local" className="form-input" required
                                 value={tripForm.departs_at} onChange={e => setTripForm({ ...tripForm, departs_at: e.target.value })} />
                           </div>
                           <div className="form-group">
                              <label>Arrival Date & Time</label>
                              <input type="datetime-local" className="form-input" required
                                 value={tripForm.arrives_at} onChange={e => setTripForm({ ...tripForm, arrives_at: e.target.value })} />
                           </div>
                        </div>
                        <div className="form-row">
                           <div className="form-group">
                              <label>Price Multiplier</label>
                              <input type="number" step="0.1" className="form-input" required
                                 value={tripForm.price_multiplier} onChange={e => setTripForm({ ...tripForm, price_multiplier: e.target.value })} />
                           </div>
                           <div className="form-group">
                              <label>Status</label>
                              <select className="form-select" value={tripForm.status}
                                 onChange={e => setTripForm({ ...tripForm, status: e.target.value })}>
                                 <option value="scheduled">Scheduled</option>
                                 <option value="on_time">On Time</option>
                                 <option value="delayed">Delayed</option>
                                 <option value="cancelled">Cancelled</option>
                                 <option value="completed">Completed</option>
                              </select>
                           </div>
                        </div>
                        {!editingTrip && (
                           <div className="form-group" style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px dashed #e2e8f0' }}>
                              <label className="form-checkbox" style={{ margin: 0 }}>
                                 <input type="checkbox" checked={tripForm.repeat_7_days}
                                    onChange={e => setTripForm({ ...tripForm, repeat_7_days: e.target.checked })} />
                                 <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 800, color: '#6366f1' }}>Weekly Synergy: Repeat for 7 Days</span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#94a3b8' }}>Automatically launch 7 identical daily runs starting from the selected date</span>
                                 </div>
                              </label>
                           </div>
                        )}
                     </div>
                     <div className="modal-footer">
                        <button type="button" className="cancel-btn" onClick={() => { setIsTripModalOpen(false); setEditingTrip(null); }}>Cancel</button>
                        <button type="submit" className="save-btn">{editingTrip ? 'Save Changes' : 'Launch Trip(s)'}</button>
                     </div>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
};

export default OperatorDashboard;
