import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import "./Profile.css";

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/bookings/user/${user.id}`);
        setBookings(response.data);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [user]);

  if (!user) return <div className="container">Please login to view profile.</div>;

  return (
    <div className="profile-page container">
      <header className="profile-header">
        <h1>My Account</h1>
        <div className="user-summary">
          <p>Name: <strong>{user.name}</strong></p>
          <p>Email: <strong>{user.email}</strong></p>
          <p>Phone: <strong>{user.phone}</strong></p>
        </div>
      </header>

      <section className="bookings-section">
        <h2>Booking History</h2>
        {loading ? (
          <p>Loading bookings...</p>
        ) : bookings.length > 0 ? (
          <div className="bookings-grid">
            {bookings.map(booking => {
              const departureDate = new Date(booking.departure_datetime);
              const now = new Date();
              const diffMs = departureDate - now;
              const diffHours = diffMs / (1000 * 60 * 60);

              let cancelStatus = 'none'; // 'direct', 'request', 'none'
              let message = '';

              if (booking.status === 'confirmed') {
                if (diffHours > 24) {
                   cancelStatus = 'direct';
                   message = 'You can cancel this booking for a full refund.';
                } else if (diffHours > 2) {
                   cancelStatus = 'request';
                   message = 'Cancellation within 24h requires operator approval.';
                } else {
                   message = 'Cancellation not allowed within 2h of departure.';
                }
              }

              const handleCancel = async (bookingId) => {
                if (!window.confirm("Are you sure you want to cancel this booking?")) return;
                try {
                  await axios.post(`${import.meta.env.VITE_API_URL}/api/bookings/${bookingId}/cancel`);
                  alert("Booking cancelled successfully.");
                  window.location.reload();
                } catch (err) {
                  alert(err.response?.data?.message || "Cancellation failed");
                }
              };

              const handleRequestCancel = async (bookingId) => {
                const reason = window.prompt("Reason for cancellation?");
                if (!reason) return;
                try {
                  await axios.post(`${import.meta.env.VITE_API_URL}/api/bookings/${bookingId}/cancel-request`, { reason });
                  alert("Cancellation request sent to operator.");
                  window.location.reload();
                } catch (err) {
                  alert(err.response?.data?.message || "Request failed");
                }
              };

              return (
                <div key={booking.id} className={`booking-card status-${booking.status}`}>
                  <div className="booking-status">{booking.status.toUpperCase()}</div>
                  <div className="booking-body">
                    <h3>{booking.operator_name}</h3>
                    <p className="route">{booking.from_city} &rarr; {booking.to_city}</p>
                    <p className="time">Departure: {departureDate.toLocaleString()}</p>
                    <p className="seats">Seats: <strong>{booking.seat_numbers}</strong></p>
                    
                    {message && <p className="cancel-info">{message}</p>}

                    <div className="actions">
                      {cancelStatus === 'direct' && (
                        <button className="cancel-btn primary" onClick={() => handleCancel(booking.id)}>Cancel Booking</button>
                      )}
                      {cancelStatus === 'request' && (
                        <button className="cancel-btn secondary" onClick={() => handleRequestCancel(booking.id)}>Request Cancel</button>
                      )}
                    </div>
                  </div>
                  <div className="booking-foot">
                    <span className="total-paid">{(Number(booking.total_price)).toLocaleString()} VND</span>
                    <span className="booking-id">ID: #{booking.id}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p>You haven't made any bookings yet.</p>
        )}
      </section>
    </div>
  );
};

export default Profile;
