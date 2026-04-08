import { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./BookingConfirm.css";

const BookingConfirm = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { trip, selectedSeats, selectedSeatIds } = location.state || {};

    const [pickup, setPickup] = useState("");
    const [dropoff, setDropoff] = useState("");

    useEffect(() => {
        if (!trip || !selectedSeats || selectedSeats.length === 0) {
            navigate("/");
        }
    }, [trip, selectedSeats, navigate]);

    if (!trip) return null;

    const totalPrice = trip.price * selectedSeats.length;

    const handleConfirm = () => {
        if (!pickup || !dropoff) {
            alert("Please select pickup and drop-off points");
            return;
        }
        navigate("/payment", {
            state: {
                trip,
                selectedSeats,
                selectedSeatIds,
                totalPrice,
                pickup,
                dropoff,
                buyerInfo: {
                    name: user?.name,
                    email: user?.email,
                    phone: user?.phone
                }
            }
        });
    };

    return (
        <div className="booking-confirm-container">
            <div className="booking-card animate-fade-in">
                <header className="booking-header">
                    <h1>Booking Confirmation</h1>
                    <p>Please review your booking details below</p>
                </header>

                <div className="booking-grid">
                    <section className="trip-summary section-card">
                        <h3><i className="fas fa-bus"></i> Trip Information</h3>
                        <div className="info-row">
                            <span className="label">Operator:</span>
                            <span className="value">{trip.operator_name || trip.operator}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Route:</span>
                            <span className="value">{trip.from || "HCMC"} &rarr; {trip.to || "Da Lat"}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Departure:</span>
                            <span className="value">{new Date(trip.departure).toLocaleString()}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Seats:</span>
                            <span className="value">{selectedSeats.length} ({selectedSeats.join(", ")})</span>
                        </div>
                    </section>

                    <section className="user-info section-card">
                        <h3><i className="fas fa-user"></i> Buyer Information</h3>
                        <div className="info-row">
                            <span className="label">Full Name:</span>
                            <span className="value">{user?.name}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Email:</span>
                            <span className="value">{user?.email}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Phone:</span>
                            <span className="value">{user?.phone || "N/A"}</span>
                        </div>
                    </section>

                    <section className="points-selection section-card">
                        <h3><i className="fas fa-map-marker-alt"></i> Journey Details</h3>
                        <div className="input-group">
                            <label>Pickup Point</label>
                            <select value={pickup} onChange={(e) => setPickup(e.target.value)}>
                                <option value="">Select Pickup Point</option>
                                <option value="Bến xe Miền Đông">Bến xe Miền Đông</option>
                                <option value="Văn phòng Quận 1">Văn phòng Quận 1</option>
                                <option value="Ngã tư Hàng Xanh">Ngã tư Hàng Xanh</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Drop-off Point</label>
                            <select value={dropoff} onChange={(e) => setDropoff(e.target.value)}>
                                <option value="">Select Drop-off Point</option>
                                <option value="Bến xe Đà Lạt">Bến xe Đà Lạt</option>
                                <option value="Văn phòng Phan Bội Châu">Văn phòng Phan Bội Châu</option>
                                <option value="Ngã ba Liên Khương">Ngã ba Liên Khương</option>
                            </select>
                        </div>
                    </section>

                    <section className="cancellation-policy section-card highlight-card">
                        <h3><i className="fas fa-info-circle"></i> Cancellation Policy</h3>
                        <ul className="policy-list">
                            <li><strong>&gt; 24h:</strong> User can cancel and get 100% refund.</li>
                            <li><strong>2h - 24h:</strong> 50% refund, must contact <strong>{trip.operator_name || 'Operator'}</strong> for manual cancellation.</li>
                            <li><strong>&lt; 2h:</strong> Cancellation not allowed.</li>
                        </ul>
                    </section>

                    <section className="price-summary section-card">
                        <h3><i className="fas fa-receipt"></i> Payment Detail</h3>
                        <div className="info-row">
                            <span className="label">Price per seat:</span>
                            <span className="value">{trip.price.toLocaleString()} VND</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Quantity:</span>
                            <span className="value">x {selectedSeats.length}</span>
                        </div>
                        <hr />
                        <div className="info-row total">
                            <span className="label">Total Amount:</span>
                            <span className="value highlight">{totalPrice.toLocaleString()} VND</span>
                        </div>
                    </section>
                </div>

                <div className="booking-actions">
                    <button className="back-btn" onClick={() => navigate(-1)}>Back</button>
                    <button className="confirm-btn-final" onClick={handleConfirm}>Proceed to Payment</button>
                </div>
            </div>
        </div>
    );
};

export default BookingConfirm;
