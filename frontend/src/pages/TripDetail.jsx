import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import "./TripDetail.css";

const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [seatsRes, tripRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/trips/${id}/seats`),
          axios.get(`http://localhost:5000/api/trips/${id}`)
        ]);
        setSeats(seatsRes.data);
        setTrip(tripRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const toggleSeat = (seatId) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatId));
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const handleConfirmSelection = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (selectedSeats.length === 0) return alert("Please select at least one seat");

    const selectedSeatNumbers = seats
      .filter(s => selectedSeats.includes(s.id))
      .map(s => s.seat_number);

    navigate("/booking/confirm", {
      state: {
          trip: {
              ...trip,
              departure: trip.departure_datetime,
              arrival: trip.arrival_datetime
          },
          selectedSeats: selectedSeatNumbers,
          selectedSeatIds: selectedSeats
      }
    });
  };

  return (
    <div className="trip-detail container">
      <div className="seat-viewer">
        <h2>Select Your Seats</h2>
        <div className="seat-grid">
          {seats.map(seat => (
            <div 
              key={seat.id} 
              className={`seat ${seat.status} ${selectedSeats.includes(seat.id) ? 'selected' : ''}`}
              onClick={() => seat.status === 'available' && toggleSeat(seat.id)}
            >
              {seat.seat_number}
            </div>
          ))}
        </div>
      </div>

      <div className="booking-summary">
        <h3>Booking Summary</h3>
        <p>Selected Seats: <strong>{selectedSeats.length}</strong></p>
        <p>Price per seat: <strong>{trip?.price?.toLocaleString() || '---'} VND</strong></p>
        <hr />
        <p className="total">Total: <strong>{((trip?.price || 0) * selectedSeats.length).toLocaleString()} VND</strong></p>
        {user?.role === 'operator' ? (
          <div className="operator-warning">
            <i className="fas fa-exclamation-triangle"></i>
            <span>Management accounts cannot book tickets. Please use a passenger account.</span>
          </div>
        ) : (
          <button className="confirm-btn" onClick={handleConfirmSelection} disabled={selectedSeats.length === 0}>
            Confirm Selection
          </button>
        )}
      </div>
    </div>
  );
};

export default TripDetail;