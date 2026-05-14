import { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import "./BookingConfirm.css";

const BookingConfirm = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { trip, selectedSeats, selectedSeatIds } = location.state || {};

    const [pickup, setPickup] = useState("");
    const [dropoff, setDropoff] = useState("");

    // Points logic
    const [userPoints, setUserPoints] = useState({ total_points: 0, max_redeemable: 0 });
    const [usePoints, setUsePoints] = useState(false);

    const parsePointOptions = (value) => {
        if (!value) return [];
        if (Array.isArray(value)) return value.filter(Boolean);
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) return parsed.filter(Boolean);
        } catch (error) {
            return String(value).split(/\r?\n|,/).map(point => point.trim()).filter(Boolean);
        }
        return [];
    };

    useEffect(() => {
        const fetchPoints = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/points`);
                setUserPoints(response.data);
            } catch (error) {
                console.error("Error fetching points:", error);
            }
        };
        if (user) fetchPoints();
    }, [user]);

    useEffect(() => {
        if (!trip || !selectedSeats || selectedSeats.length === 0) {
            navigate("/");
        }
    }, [trip, selectedSeats, navigate]);

    if (!trip) return null;

    const totalPrice = trip.price * selectedSeats.length;
    const pickupOptions = parsePointOptions(trip.pickup_points);
    const dropoffOptions = parsePointOptions(trip.dropoff_points);

    const maxUsableForTrip = Math.min(
        10, 
        userPoints.max_redeemable !== undefined ? userPoints.max_redeemable : userPoints.total_points, 
        Math.floor((totalPrice * 0.5) / 10000)
    );
    const canRedeem = userPoints.total_points >= 10 && maxUsableForTrip >= 5;
    const pointsToSpend = usePoints && canRedeem ? maxUsableForTrip : 0;
    const pointsDiscount = pointsToSpend * 10000;
    const finalPrice = totalPrice - pointsDiscount;

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
                },
                initialUsePoints: usePoints // Pass to payment if needed
            }
        });
    };

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
                            <span className="value">{trip.from} &rarr; {trip.to}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Departure:</span>
                            <span className="value">{formatDateTime(trip.departure)}</span>
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
                            <select value={pickup} onChange={(e) => setPickup(e.target.value)} disabled={pickupOptions.length === 0}>
                                <option value="">Select Pickup Point</option>
                                {pickupOptions.map(point => (
                                    <option key={point} value={point}>{point}</option>
                                ))}
                            </select>
                            {pickupOptions.length === 0 && <small>No pickup places configured for this route.</small>}
                        </div>
                        <div className="input-group">
                            <label>Drop-off Point</label>
                            <select value={dropoff} onChange={(e) => setDropoff(e.target.value)} disabled={dropoffOptions.length === 0}>
                                <option value="">Select Drop-off Point</option>
                                {dropoffOptions.map(point => (
                                    <option key={point} value={point}>{point}</option>
                                ))}
                            </select>
                            {dropoffOptions.length === 0 && <small>No drop-off places configured for this route.</small>}
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
                        
                        {/* Loyalty Points Feature */}
                        <div className="points-feature-container">
                            <label className={`points-checkbox-label ${!canRedeem ? 'disabled' : ''}`}>
                                <input 
                                    type="checkbox" 
                                    checked={usePoints} 
                                    onChange={(e) => setUsePoints(e.target.checked)}
                                    disabled={!canRedeem}
                                />
                                <span>Use Points (Balance: {userPoints.total_points} pts)</span>
                            </label>
                            {!canRedeem && (
                                <div className="points-hint">Need at least 10 pts to use (min 5 pts per trip).</div>
                            )}
                        </div>

                        {usePoints && pointsToSpend > 0 && (
                            <div className="info-row discount-row">
                                <span className="label">Points Discount:</span>
                                <span className="value discount-value">-{pointsDiscount.toLocaleString()} VND</span>
                            </div>
                        )}
                        
                        <hr />
                        <div className="info-row total">
                            <span className="label">Total Amount:</span>
                            <span className="value highlight">{finalPrice.toLocaleString()} VND</span>
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
