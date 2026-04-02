const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const tripController = require("../controllers/tripController");
const bookingController = require("../controllers/bookingController");

// Auth
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);

// Trip Search
router.get("/trips/search", tripController.search);
router.get("/trips/:instanceId/seats", tripController.getSeats);

// Booking
router.post("/bookings", bookingController.create);
router.get("/bookings/user/:userId", bookingController.getUserBookings);

module.exports = router;
