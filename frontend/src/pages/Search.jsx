import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import Filters from "../components/Filters/Filters";

import { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";

const Search = () => {

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const date = searchParams.get("date");

  // 👉 Fetch trips từ backend
  useEffect(() => {

    const fetchTrips = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/trips?from=${from}&to=${to}&date=${date}`
        );

        console.log("API:", res.data);

        setTrips(res.data.data);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();

  }, [from, to, date]);

  // 👉 Click select trip
  const handleSelectTrip = (tripId) => {
    navigate(`/trip/${tripId}`);
  };

  return (
    <>
      <Navbar />

      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4">

          {/* Breadcrumb */}
          <p className="text-gray-500 text-sm mb-2">
            Home › Bus Tickets › {from} to {to}
          </p>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">

            <div>
              <h1 className="text-3xl font-bold">
                {from} to {to}
              </h1>

              <p className="text-gray-500 text-sm">
                {date} • {trips.length} trips available
              </p>
            </div>

            {/* Sort (chưa làm backend) */}
            <div className="flex gap-2">
              <button className="bg-red-500 text-white px-4 py-2 rounded">
                Earliest
              </button>

              <button className="border px-4 py-2 rounded">
                Lowest Price
              </button>

              <button className="border px-4 py-2 rounded">
                Top Rated
              </button>
            </div>

          </div>

          {/* Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            {/* Filters */}
            <div className="lg:col-span-1">
              <Filters />
            </div>

            {/* Results */}
            <div className="lg:col-span-3 space-y-4">

              {/* Promotion */}
              <div className="bg-blue-100 border border-blue-200 p-4 rounded-lg">
                <p className="font-semibold text-blue-600">
                  Limited Offer: Get 20% OFF
                </p>

                <p className="text-sm text-blue-500">
                  Use code BUSMAY20 for your first booking today.
                </p>
              </div>

              {/* LIST TRIPS */}
              {loading ? (
                <p>Loading...</p>
              ) : trips.length === 0 ? (
                <p>No trips found</p>
              ) : (
                trips.map((trip) => (

                  <div
                    key={trip.id}
                    className="bg-white p-6 rounded-xl shadow flex flex-col md:flex-row md:items-center md:justify-between gap-6"
                  >

                    {/* Company */}
                    <div className="flex flex-col gap-1">
                      <h3 className="font-semibold text-lg">
                        {trip.operator || "Bus Operator"}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {trip.bus_type || "Standard Bus"}
                      </p>

                      <p className="text-sm text-orange-500">
                        ★ 4.5 (1k reviews)
                      </p>
                      <p className="text-sm text-green-600 font-medium">
                      {trip.available_seats} seats available
                    </p>
                    </div>

                    {/* Departure */}
                    <div>
                      <p className="text-xl font-bold">
                        {new Date(trip.departure_time).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>

                      <p className="text-gray-400 text-sm">
                        {trip.from_city}
                      </p>
                    </div>

                    {/* Duration */}
                    <div className="text-center">
                      <p className="text-sm text-gray-400">
                        {trip.duration}
                      </p>

                      <p className="text-xs text-gray-400">
                        Direct
                      </p>
                    </div>

                    {/* Arrival */}
                    <div>
                      <p className="text-xl font-bold">
                        {new Date(trip.arrival_time).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>

                      <p className="text-gray-400 text-sm">
                        {trip.to_city}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="text-right flex flex-col gap-2">

                      <p className="text-orange-500 text-xl font-bold">
                        {trip.price.toLocaleString()} VND
                      </p>

                      <button
                        onClick={() => handleSelectTrip(trip.id)}
                        className="bg-red-500 text-white px-4 py-2 rounded"
                      >
                        Select Trip
                      </button>

                    </div>

                  </div>

                ))
              )}

              {/* Load More (sau làm backend) */}
              <div className="text-center pt-6">
                <button className="text-red-500">
                  Load more trips
                </button>
              </div>

            </div>

          </div>

        </div>
      </div>

      <Footer />
    </>
  );
};

export default Search;