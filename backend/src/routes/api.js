const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const tripController = require("../controllers/tripController");
const bookingController = require("../controllers/bookingController");

const { authMiddleware, isOperator, isAdmin, optionalAuth } = require("../middleware/authMiddleware");
const operatorController = require("../controllers/operatorController");

const adminController = require("../controllers/adminController");

// Auth
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.post("/auth/forgot-password", authController.forgotPassword);
router.post("/auth/reset-password", authController.resetPassword);

// Trip Search
router.get("/trips/search", tripController.search);
router.get("/trips/cities", tripController.getCities);
router.get("/trips/popular", tripController.getPopularRoutes);
router.get("/trips/history", optionalAuth, tripController.getSearchHistory);
router.post("/trips/history", optionalAuth, tripController.saveSearch);
router.get("/trips/verify-route", tripController.verifyRoute);
router.get("/trips/:id", tripController.getTripDetail);
router.get("/trips/:instanceId/seats", tripController.getSeats);

// Booking
router.post("/bookings", authMiddleware, bookingController.create);
router.get("/bookings/user/:userId", authMiddleware, bookingController.getUserBookings);
router.post("/bookings/:id/cancel", authMiddleware, bookingController.cancel);
router.post("/bookings/:id/cancel-request", authMiddleware, bookingController.cancelRequest);

// Operator Management (Operator Side)
router.get("/operator/promotions", authMiddleware, isOperator, operatorController.getPromotions);
router.post("/operator/promotions", authMiddleware, isOperator, operatorController.createPromotion);
router.get("/operator/trips", authMiddleware, isOperator, operatorController.getTrips);
router.post("/operator/trips", authMiddleware, isOperator, operatorController.createTrip);
router.put("/operator/trips/:id", authMiddleware, isOperator, operatorController.updateTrip);
router.delete("/operator/trips/:id", authMiddleware, isOperator, operatorController.deleteTrip);
router.put("/operator/trips/:id/status", authMiddleware, isOperator, operatorController.updateTripStatus);
router.get("/operator/routes", authMiddleware, isOperator, operatorController.getRoutes);
router.post("/operator/routes", authMiddleware, isOperator, operatorController.createRoute);
router.put("/operator/routes/:id", authMiddleware, isOperator, operatorController.updateRoute);
router.delete("/operator/routes/:id", authMiddleware, isOperator, operatorController.deleteRoute);
router.get("/operator/trips/:instanceId/passengers", authMiddleware, isOperator, operatorController.getPassengersByTrip);
router.get("/operator/trips/:instanceId/seats", authMiddleware, isOperator, operatorController.getTripSeats);
router.get("/operator/cancellations", authMiddleware, isOperator, operatorController.getCancellationRequests);
router.put("/operator/cancellations/:requestId", authMiddleware, isOperator, operatorController.handleCancellationRequest);

// Admin Management
router.get("/admin/users", authMiddleware, isAdmin, adminController.getUsers);
router.delete("/admin/users/:id", authMiddleware, isAdmin, adminController.deleteUser);
router.get("/admin/users/:id", authMiddleware, isAdmin, adminController.getUserDetail);

router.get("/admin/operators", authMiddleware, isAdmin, adminController.getOperators);
router.get("/admin/operators/:id", authMiddleware, isAdmin, adminController.getOperatorDetail);
router.put("/admin/operators/:id/approve", authMiddleware, isAdmin, adminController.approveOperator);
router.put("/admin/operators/:id/reject", authMiddleware, isAdmin, adminController.rejectOperator);
router.delete("/admin/operators/:id", authMiddleware, isAdmin, adminController.deleteOperator);

router.put("/admin/routes/:id/status", authMiddleware, isAdmin, adminController.updateRouteStatus);
router.delete("/admin/routes/:id", authMiddleware, isAdmin, adminController.deleteRoute);

router.put("/admin/trips/:id/status", authMiddleware, isAdmin, adminController.updateTripStatus);
router.delete("/admin/trips/:id", authMiddleware, isAdmin, adminController.deleteTrip);

router.get("/admin/operators/:operatorId/buses", authMiddleware, isAdmin, adminController.getBuses);
router.post("/admin/operators/:operatorId/buses", authMiddleware, isAdmin, adminController.addBus);
router.get("/admin/buses", authMiddleware, isAdmin, adminController.getAllBuses);
router.put("/admin/buses/:id", authMiddleware, isAdmin, adminController.updateBus);
router.delete("/admin/buses/:id", authMiddleware, isAdmin, adminController.deleteBus);
router.get("/admin/performance", authMiddleware, isAdmin, adminController.getPerformanceStats);

module.exports = router;
