import { useState, useContext } from "react";
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

    if (!trip) {
        navigate("/");
        return null;
    }

    const handlePayment = async () => {
        setIsProcessing(true);
        try {
            const response = await axios.post("http://localhost:5000/api/bookings", {
                user_id: user.id,
                trip_instance_id: trip.id,
                seat_ids: selectedSeatIds,
                total_price: totalPrice,
                payment_method: paymentMethod,
                pickup_point: pickup,
                dropoff_point: dropoff
            });

            setBookingData(response.data);
            setIsSuccess(true);
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
                <div className="ticket-detail-card animate-scale-up">
                    <div className="success-badge">
                        <i className="fas fa-check-circle"></i>
                        <h2>Payment Successful!</h2>
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
                                <div className="info-item">
                                    <span className="label">Departure</span>
                                    <span className="value">{new Date(trip.departure).toLocaleString()}</span>
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
                            <div className="price-total">
                                <span className="label">Total Paid</span>
                                <span className="value">{totalPrice.toLocaleString()} VND</span>
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
                        <span className="label">Amount to Pay</span>
                        <h2 className="amount-display">{totalPrice.toLocaleString()} VND</h2>
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
                        disabled={isProcessing}
                    >
                        {isProcessing ? "Processing..." : `Pay ${totalPrice.toLocaleString()} VND`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Payment;
