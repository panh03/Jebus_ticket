const tripService = require("../services/tripService");

exports.searchTrips = async (req, res) => {
  try {
    const { from, to, date } = req.query;

    if (!from || !to || !date) {
      return res.status(400).json({
        success: false,
        message: "Missing from/to/date"
      });
    }

    const trips = await tripService.searchTrips(from, to, date);

    res.json({
      success: true,
      data: trips
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

exports.getTripDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const trip = await tripService.getTripById(id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found"
      });
    }

    res.json({
      success: true,
      data: trip
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};