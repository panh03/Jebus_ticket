import { useState, useContext, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import "./Payment.css";

const Payment = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { trip, selectedSeats, selectedSeatIds, totalPrice, pickup, dropoff } = location.state || {};

    const [paymentMethod, setPaymentMethod] = useState("VNPAY");
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [bookingData, setBookingData] = useState(null);

    // Points system states
    const [userPoints, setUserPoints] = useState({ total_points: 0, max_redeemable: 0 });
    const [usePoints, setUsePoints] = useState(location.state?.initialUsePoints || false);
    const [pointsToSpend, setPointsToSpend] = useState(0);
    const [showToast, setShowToast] = useState(false);

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

    const maxUsableForTrip = Math.min(
        10, 
        userPoints.max_redeemable, 
        Math.floor((totalPrice * 0.5) / 10000)
    );
    const canRedeem = userPoints.total_points >= 10 && maxUsableForTrip >= 5;

    useEffect(() => {
        if (usePoints) {
            setPointsToSpend(maxUsableForTrip);
        } else {
            setPointsToSpend(0);
        }
    }, [usePoints, maxUsableForTrip]);

    const handlePointsChange = (e) => {
        let val = parseInt(e.target.value) || 0;
        if (val > maxUsableForTrip) val = maxUsableForTrip;
        setPointsToSpend(val);
    };

    const finalPrice = usePoints ? totalPrice - (pointsToSpend * 10000) : totalPrice;

    if (!trip) {
        navigate("/");
        return null;
    }

    const handlePayment = async () => {
        setIsProcessing(true);
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/bookings/`, {
                user_id: user.id,
                trip_instance_id: trip.id,
                seat_ids: selectedSeatIds,
                total_price: finalPrice,
                payment_method: paymentMethod,
                pickup_point: pickup,
                dropoff_point: dropoff,
                points_used: usePoints ? pointsToSpend : 0
            });

            setBookingData(response.data);
            setIsSuccess(true);
            setShowToast(true);
            
            // Auto hide toast
            setTimeout(() => {
                setShowToast(false);
            }, 3000);
        } catch (error) {
            console.error("Payment error response:", error.response?.data);
            const detailedError = error.response?.data?.error || "";
            alert(`${error.response?.data?.message || "Payment failed"}: ${detailedError}`);
        } finally {
            setIsProcessing(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="payment-container">
                {showToast && (
                    <div className="point-toast animate-slide-down">
                        <i className="fas fa-coins"></i>
                        <span>Successfully earned {selectedSeats.length} point{selectedSeats.length > 1 ? 's' : ''}! Total balance: {userPoints.total_points + selectedSeats.length - (usePoints ? pointsToSpend : 0)} points.</span>
                    </div>
                )}
                <div className="ticket-detail-card animate-scale-up">
                    <div className="success-badge">
                        <i className="fas fa-check-circle"></i>
                        <h2>Payment Successful!</h2>
                        <div className="points-earned-display">
                            <i className="fas fa-coins gold-coin"></i>
                            <span className="points-text">+{selectedSeats.length} point{selectedSeats.length > 1 ? 's' : ''} earned from this trip!</span>
                        </div>
                        <p>Your ticket has been confirmed. Please show this to the driver.</p>
                    </div>

                    <div className="ticket-body">
                        <div className="ticket-section">
                            <h3><i className="fas fa-user"></i> Buyer Information</h3>
                            <div className="ticket-info-grid">
                                <div className="info-item">
                                    <span className="label">Name</span>
                                    <span className="value">{user?.name}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Phone</span>
                                    <span className="value">{user?.phone || "N/A"}</span>
                                </div>
                                <div className="info-item full-width">
                                    <span className="label">Email</span>
                                    <span className="value">{user?.email}</span>
                                </div>
                            </div>
                        </div>

                        <div className="ticket-divider"></div>

                        <div className="ticket-section">
                            <h3><i className="fas fa-bus"></i> Trip Information</h3>
                            <div className="ticket-info-grid">
                                <div className="info-item">
                                    <span className="label">Operator</span>
                                    <span className="value">{trip.operator_name || trip.operator}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Route</span>
                                    <span className="value">{trip.from} &rarr; {trip.to}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Departure</span>
                                    <span className="value">{
                                        (() => {
                                            const dateStr = trip.departure;
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
                                        })()
                                    }</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Seats</span>
                                    <span className="value highlight-text">{selectedSeats.join(", ")}</span>
                                </div>
                            </div>
                        </div>

                        <div className="ticket-divider"></div>

                        <div className="ticket-section">
                            <h3><i className="fas fa-map-marker-alt"></i> Journey Details</h3>
                            <div className="ticket-info-grid">
                                <div className="info-item">
                                    <span className="label">Pickup Point</span>
                                    <span className="value">{pickup}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Drop-off Point</span>
                                    <span className="value">{dropoff}</span>
                                </div>
                            </div>
                        </div>

                        <div className="ticket-divider"></div>

                        <div className="ticket-section price-section">
                            {usePoints && pointsToSpend > 0 && (
                                <div className="price-total discount">
                                    <span className="label">Points Redeemed</span>
                                    <span className="value">-{pointsToSpend * 10000} VND ({pointsToSpend} pts)</span>
                                </div>
                            )}
                            <div className="price-total">
                                <span className="label">Total Paid</span>
                                <span className="value">{finalPrice.toLocaleString()} VND</span>
                            </div>
                            <div className="payment-type">
                                <span className="label">Method:</span>
                                <span className="value">{paymentMethod}</span>
                            </div>
                        </div>
                    </div>

                    <div className="ticket-footer">
                        <button className="download-btn" onClick={() => window.print()}>
                            <i className="fas fa-download"></i> Download Ticket
                        </button>
                        <button className="home-btn" onClick={() => navigate("/profile")}>
                            Go to My Bookings
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="payment-container">
            <div className="payment-card animate-slide-up">
                <header className="payment-header">
                    <h1>Complete Your Payment</h1>
                    <p>Select your preferred payment method to secure your ticket</p>
                </header>

                <div className="payment-content">
                    <section className="payment-amount-summary">
                        <div className="amount-row original-amount">
                            <span className="label">Original Price</span>
                            <span className="value">{totalPrice.toLocaleString()} VND</span>
                        </div>
                        
                        {/* Redemption Widget */}
                        <div className={`redemption-widget ${!canRedeem ? 'locked' : 'active'}`}>
                            <div className="widget-header">
                                <div className="widget-title">
                                    <i className="fas fa-coins gold-coin"></i>
                                    <span>JEBus Points</span>
                                </div>
                                <div className="balance-info">
                                    Balance: {userPoints.total_points} pts
                                </div>
                            </div>
                            
                            {!canRedeem ? (
                                <div className="locked-message">
                                    <p>Need at least 10 points to use this feature (and min. 5 points applicable for this trip).</p>
                                </div>
                            ) : (
                                <div className="redemption-controls">
                                    <label className="switch-wrapper">
                                        <input 
                                            type="checkbox" 
                                            checked={usePoints} 
                                            onChange={(e) => setUsePoints(e.target.checked)} 
                                        />
                                        <span className="slider round"></span>
                                        <span className="switch-label">Use JEBus Points</span>
                                    </label>
                                    
                                    {usePoints && (
                                        <div className="points-input-group animate-fade-in">
                                            <div className="input-wrapper">
                                                <input 
                                                    type="number" 
                                                    min="5" 
                                                    max={maxUsableForTrip} 
                                                    value={pointsToSpend} 
                                                    onChange={handlePointsChange}
                                                />
                                                <span className="suffix">pts</span>
                                            </div>
                                            <div className="instant-deduction">
                                                - {(pointsToSpend * 10000).toLocaleString()} VND
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="amount-row final-amount">
                            <span className="label">Grand Total</span>
                            <h2 className="amount-display">{finalPrice.toLocaleString()} VND</h2>
                        </div>
                    </section>

                    <section className="payment-methods">
                        <h3>Choose Payment Method</h3>
                        <div className="method-options">
                            <label className={`method-option ${paymentMethod === 'VNPAY' ? 'active' : ''}`}>
                                <div className="method-left">
                                    <input 
                                        type="radio" 
                                        name="payment" 
                                        value="VNPAY" 
                                        checked={paymentMethod === 'VNPAY'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    />
                                    <div className="method-content">
                                        <span className="method-title">VNPAY (E-Wallet)</span>
                                        <span className="method-desc">Fast and secure local payment</span>
                                    </div>
                                </div>
                                <div className="method-icon">
                                    <i className="fas fa-wallet"></i>
                                </div>
                            </label>

                            <label className={`method-option ${paymentMethod === 'CreditCard' ? 'active' : ''}`}>
                                <div className="method-left">
                                    <input 
                                        type="radio" 
                                        name="payment" 
                                        value="CreditCard" 
                                        checked={paymentMethod === 'CreditCard'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    />
                                    <div className="method-content">
                                        <span className="method-title">Credit Card / Debit Card</span>
                                        <span className="method-desc">Visa, Mastercard, JCB</span>
                                    </div>
                                </div>
                                <div className="method-icon">
                                    <i className="fas fa-credit-card"></i>
                                </div>
                            </label>

                            <label className={`method-option ${paymentMethod === 'BankTransfer' ? 'active' : ''}`}>
                                <div className="method-left">
                                    <input 
                                        type="radio" 
                                        name="payment" 
                                        value="BankTransfer" 
                                        checked={paymentMethod === 'BankTransfer'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    />
                                    <div className="method-content">
                                        <span className="method-title">Bank Transfer</span>
                                        <span className="method-desc">Direct bank-to-bank transfer</span>
                                    </div>
                                </div>
                                <div className="method-icon">
                                    <i className="fas fa-university"></i>
                                </div>
                            </label>
                        </div>
                    </section>

                    <section className="secure-payment-notice">
                        <i className="fas fa-shield-alt"></i>
                        <span>Your payment is secure and encrypted.</span>
                    </section>
                </div>

                <div className="payment-actions">
                    <button className="back-btn" onClick={() => navigate(-1)} disabled={isProcessing}>Back</button>
                    <button 
                        className={`pay-btn ${isProcessing ? 'loading' : ''}`} 
                        onClick={handlePayment} 
                        disabled={isProcessing || (usePoints && (pointsToSpend < 5 || pointsToSpend > maxUsableForTrip))}
                    >
                        {isProcessing ? "Processing..." : `Pay ${finalPrice.toLocaleString()} VND`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Payment;
