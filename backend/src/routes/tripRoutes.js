// src/routes/tripRoutes.js
const express = require("express");
const router = express.Router();
const tripController = require("../controllers/tripController");

// API search
router.get("/search", tripController.searchTrips);

router.get("/:id", tripController.getTripDetail);


module.exports = router;