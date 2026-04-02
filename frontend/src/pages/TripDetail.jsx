import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import axios from "axios";

const TripDetail = () => {
  const { id } = useParams();

  const [trip, setTrip] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);

  useEffect(() => {
    const fetchTrip = async () => {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/trips/${id}`
      );
      setTrip(res.data.data);
    };

    fetchTrip();
  }, [id]);

  if (!trip) return <p className="p-10">Loading...</p>;

  // 👉 chia ghế 2 tầng
  const lowerSeats = trip.seats.filter(s =>
    s.seat_number.startsWith("A") || s.seat_number.startsWith("B")
  );

  const upperSeats = trip.seats.filter(s =>
    s.seat_number.startsWith("C") || s.seat_number.startsWith("D")
  );

  // 👉 click chọn ghế
  const handleSelectSeat = (seat) => {
    if (seat.status === "booked") return;

    setSelectedSeats(prev => {
      if (prev.includes(seat.seat_number)) {
        return prev.filter(s => s !== seat.seat_number);
      }
      return [...prev, seat.seat_number];
    });
  };

  // 👉 style ghế
  const getSeatClass = (seat) => {
    if (seat.status === "booked") return "bg-gray-300 cursor-not-allowed";
    if (selectedSeats.includes(seat.seat_number))
      return "bg-blue-500 text-white";
    return "bg-white border";
  };

  const total = selectedSeats.length * trip.price;

  return (
    <>
      <Navbar />
    <div className="bg-gray-50 min-h-screen p-6">


      {/* HEADER */}
      <div className="bg-white rounded-xl p-6 mb-6 flex justify-between">
        <div>
          <h2 className="text-xl font-bold">{trip.operator}</h2>
          <p className="text-gray-500">
            {trip.from_city} → {trip.to_city}
          </p>
        </div>

        <div className="flex gap-10">
          <div>
            <p className="text-gray-400 text-sm">DEPARTURE</p>
            <p className="font-bold">{trip.departure_time}</p>
          </div>

          <div>
            <p className="text-gray-400 text-sm">BUS TYPE</p>
            <p className="font-bold">{trip.bus_type}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-6">

        {/* LEFT - SEAT MAP */}
        <div className="flex-1 bg-white p-6 rounded-xl">

          <h2 className="text-lg font-semibold mb-4">
            Select Your Seats
          </h2>

          <div className="flex gap-10">

            {/* LOWER FLOOR */}
            <div>
              <p className="text-sm mb-2 font-medium">Lower Floor</p>
              <div className="grid grid-cols-4 gap-3">
                {lowerSeats.map(seat => (
                  <div
                    key={seat.seat_number}
                    onClick={() => handleSelectSeat(seat)}
                    className={`w-12 h-12 flex items-center justify-center rounded-lg cursor-pointer ${getSeatClass(seat)}`}
                  >
                    {seat.seat_number}
                  </div>
                ))}
              </div>
            </div>

            {/* UPPER FLOOR */}
            <div>
              <p className="text-sm mb-2 font-medium">Upper Floor</p>
              <div className="grid grid-cols-4 gap-3">
                {upperSeats.map(seat => (
                  <div
                    key={seat.seat_number}
                    onClick={() => handleSelectSeat(seat)}
                    className={`w-12 h-12 flex items-center justify-center rounded-lg cursor-pointer ${getSeatClass(seat)}`}
                  >
                    {seat.seat_number}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT - SUMMARY */}
        <div className="w-80 bg-white p-6 rounded-xl">

          <h2 className="font-semibold mb-4">Trip Summary</h2>

          <p className="text-gray-500 text-sm">Selected Seats</p>
          <p className="font-bold mb-4">
            {selectedSeats.join(", ") || "None"}
          </p>

          <p className="text-gray-500 text-sm">Price per Seat</p>
          <p className="mb-4">{trip.price.toLocaleString()} VND</p>

          <hr className="my-4" />

          <p className="text-gray-500 text-sm">TOTAL</p>
          <p className="text-2xl font-bold text-blue-600">
            {total.toLocaleString()} VND
          </p>

          <button className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg">
            Continue →
          </button>

        </div>
      </div>
    </div>
    <Footer />
    </>
  );
};

export default TripDetail;