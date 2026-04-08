const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const tripController = require("../controllers/tripController");
const bookingController = require("../controllers/bookingController");

const { authMiddleware, isOperator } = require("../middleware/authMiddleware");
const operatorController = require("../controllers/operatorController");

// Auth
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.post("/auth/forgot-password", authController.forgotPassword);
router.post("/auth/reset-password", authController.resetPassword);

// Trip Search
router.get("/trips/search", tripController.search);
router.get("/trips/:id", tripController.getTripDetail);
router.get("/trips/:instanceId/seats", tripController.getSeats);

// Booking
router.post("/bookings", authMiddleware, bookingController.create);
router.get("/bookings/user/:userId", authMiddleware, bookingController.getUserBookings);
router.post("/bookings/:id/cancel", authMiddleware, bookingController.cancel);
router.post("/bookings/:id/cancel-request", authMiddleware, bookingController.cancelRequest);

// Operator Management
router.get("/operator/promotions", authMiddleware, isOperator, operatorController.getPromotions);
router.post("/operator/promotions", authMiddleware, isOperator, operatorController.createPromotion);
router.get("/operator/trips", authMiddleware, isOperator, operatorController.getTrips);
router.put("/operator/trips/:id/status", authMiddleware, isOperator, operatorController.updateTripStatus);
router.get("/operator/routes", authMiddleware, isOperator, operatorController.getRoutes);
router.get("/operator/trips/:instanceId/passengers", authMiddleware, isOperator, operatorController.getPassengersByTrip);
router.get("/operator/trips/:instanceId/seats", authMiddleware, isOperator, operatorController.getTripSeats);
router.get("/operator/cancellations", authMiddleware, isOperator, operatorController.getCancellationRequests);
router.put("/operator/cancellations/:requestId", authMiddleware, isOperator, operatorController.handleCancellationRequest);

module.exports = router;
