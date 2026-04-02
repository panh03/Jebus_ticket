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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSeats = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:5000/api/trips/${id}/seats`);
        setSeats(response.data);
      } catch (error) {
        console.error("Error fetching seats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSeats();
  }, [id]);

  const toggleSeat = (seatId) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatId));
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (selectedSeats.length === 0) return alert("Please select at least one seat");

    try {
      const response = await axios.post("http://localhost:5000/api/bookings", {
        user_id: user.id,
        trip_instance_id: id,
        seat_ids: selectedSeats,
        total_price: 300000 * selectedSeats.length, // Assume 300k per seat
        payment_method: "VNPAY"
      });
      alert("Booking successful!");
      navigate("/profile");
    } catch (error) {
      console.error("Booking error:", error);
      alert(error.response?.data?.message || "Booking failed");
    }
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
        <p>Price per seat: <strong>300,000 VND</strong></p>
        <hr />
        <p className="total">Total: <strong>{(300000 * selectedSeats.length).toLocaleString()} VND</strong></p>
        <button className="confirm-btn" onClick={handleBooking} disabled={selectedSeats.length === 0}>
          Confirm Booking
        </button>
      </div>
    </div>
  );
};

export default TripDetail;