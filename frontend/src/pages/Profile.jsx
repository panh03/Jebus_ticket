import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import "./Profile.css";

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Points State
  const [pointsData, setPointsData] = useState({ total_points: 0, reserved_points: 0 });
  const [pointsHistory, setPointsHistory] = useState([]);
  const [showPointsInfo, setShowPointsInfo] = useState(false);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    let str = typeof dateStr === 'string' ? dateStr : new Date(dateStr).toISOString();
    const datePart = str.split('T')[0].split(' ')[0];
    let timePart = str;
    if (timePart.includes(' ')) timePart = timePart.split(' ')[1];
    else if (timePart.includes('T')) timePart = timePart.split('T')[1];
    const [h, m] = timePart.split(':');
    const hours = parseInt(h, 10);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const hours12 = ((hours + 11) % 12 + 1);
    const padH = String(hours12).padStart(2, '0');
    return `${datePart} ${padH}:${m} ${suffix}`;
  };

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/bookings/user/${user.id}`);
        setBookings(response.data);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchPoints = async () => {
      if (!user) return;
      try {
        const [pointsRes, historyRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/points`),
          axios.get(`${import.meta.env.VITE_API_URL}/points/history`)
        ]);
        setPointsData(pointsRes.data);
        setPointsHistory(historyRes.data);
      } catch (error) {
        console.error("Error fetching points data:", error);
      }
    };

    fetchBookings();
    fetchPoints();
  }, [user]);

  if (!user) return <div className="container">Please login to view profile.</div>;

  return (
    <div className="profile-page container">
      <div className="profile-page-header">
        <h1>My Account</h1>
        <p className="subtitle">Manage your profile and loyalty rewards.</p>
      </div>

      <div className="profile-dashboard-layout">
        {/* Left Column: Profile Card */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="avatar-circle">{user.name.charAt(0).toUpperCase()}</div>
            <h2 className="profile-name">{user.name}</h2>
          </div>
          <div className="profile-card-body">
            <div className="info-item">
              <i className="far fa-envelope"></i>
              <div>
                <span className="info-label">EMAIL ADDRESS</span>
                <span className="info-val">{user.email}</span>
              </div>
            </div>
            <div className="info-item">
              <i className="fas fa-phone-alt"></i>
              <div>
                <span className="info-label">PHONE NUMBER</span>
                <span className="info-val">{user.phone || '09123456789'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Wallet Card */}
        <div className="wallet-card">
          <div className="wallet-card-top">
             <div className="wallet-title-area">
                <h3 className="wallet-title">My JEBus Wallet</h3>
                <div className="status-badge-container">
                  {pointsData.total_points >= 10 ? (
                    <span className="status-badge active"><i className="fas fa-circle"></i> Active</span>
                  ) : (
                    <span className="status-badge inactive">
                      <i className="fas fa-circle"></i> Inactive 
                      <button className="info-btn" onClick={() => setShowPointsInfo(!showPointsInfo)}>
                        <i className="fas fa-info-circle"></i>
                      </button>
                    </span>
                  )}
                </div>
             </div>
             <i className="fas fa-wallet wallet-icon"></i>
          </div>

          <div className="wallet-balance-info">
             <span className="wallet-balance-value">{pointsData.total_points}</span>
             <span className="wallet-balance-label">POINTS</span>
          </div>
          <div className="wallet-equivalent-value">
            <i className="fas fa-money-bill-wave"></i> Est. Value: ~ {(pointsData.total_points * 10000).toLocaleString()} VND
          </div>

          <div className="progress-section">
             <div className="progress-header">
                <span className="progress-percentage">{Math.min(100, (pointsData.total_points / 10) * 100)}% Complete</span>
             </div>
             <div className="progress-bar">
               <div className="progress-fill" style={{ width: `${Math.min(100, (pointsData.total_points / 10) * 100)}%` }}></div>
             </div>
             {pointsData.total_points < 10 && (
               <p className="progress-text">Collect {10 - pointsData.total_points} more points to unlock discounts!</p>
             )}
          </div>

          {showPointsInfo && (
            <div className="points-rules-popup">
              <p><strong>Rules:</strong></p>
              <ul>
                <li>1 successful ticket = 1 point</li>
                <li>1 point = 10,000 VND</li>
                <li>Minimum 10 points to unlock redemption</li>
                <li>Minimum redemption per order: 5 points</li>
              </ul>
            </div>
          )}
        </div>
      </div>

        {pointsHistory.length > 0 && (
          <div className="transaction-history">
            <h3>Transaction History</h3>
            <div className="history-list">
              {pointsHistory.map((tx) => (
                <div key={tx.id} className="history-row">
                  <div className="tx-icon">
                    {['earned', 'refunded'].includes(tx.transaction_type) ? (
                      <i className="fas fa-arrow-up text-green"></i>
                    ) : (
                      <i className="fas fa-arrow-down text-red"></i>
                    )}
                  </div>
                  <div className="tx-details">
                    <span className="tx-title">
                      {tx.booking_id ? `Ticket #${tx.booking_id} - ` : ''} 
                      {tx.transaction_type.charAt(0).toUpperCase() + tx.transaction_type.slice(1)}
                    </span>
                    <span className="tx-time">{new Date(tx.transaction_date).toLocaleString()}</span>
                  </div>
                  <div className={`tx-quantity ${['earned', 'refunded'].includes(tx.transaction_type) ? 'positive' : 'negative'}`}>
                    {['earned', 'refunded'].includes(tx.transaction_type) ? '+' : '-'}{tx.amount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


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
                  await axios.post(`${import.meta.env.VITE_API_URL}/bookings/${bookingId}/cancel`);
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
                  await axios.post(`${import.meta.env.VITE_API_URL}/bookings/${bookingId}/cancel-request`, { reason });
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
                    <div className="info-row">
                      <span className="info-label">Route</span>
                      <span className="info-value">{booking.from_city} &rarr; {booking.to_city}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Departure</span>
                      <span className="info-value">{formatDateTime(booking.departure_datetime)}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Seats</span>
                      <span className="info-value"><strong>{booking.seat_numbers}</strong></span>
                    </div>
                    
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
