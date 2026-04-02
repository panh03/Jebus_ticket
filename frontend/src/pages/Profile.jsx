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
        const response = await axios.get(`http://localhost:5000/api/bookings/user/${user.id}`);
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
            {bookings.map(booking => (
              <div key={booking.id} className="booking-card">
                <div className="booking-status">{booking.status}</div>
                <h3>{booking.operator_name}</h3>
                <p>From: <strong>{booking.from_city}</strong> To: <strong>{booking.to_city}</strong></p>
                <p>Departure: <strong>{new Date(booking.departure_datetime).toLocaleString()}</strong></p>
                <p>Seats: <strong>{booking.seat_numbers}</strong></p>
                <div className="booking-foot">
                  <span className="total-paid">Total: {Number(booking.total_price).toLocaleString()} VND</span>
                  <span className="booking-id">ID: #{booking.id}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>You haven't made any bookings yet.</p>
        )}
      </section>
    </div>
  );
};

export default Profile;
