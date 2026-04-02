import { useState } from "react";

const Filters = () => {

  const [departure, setDeparture] = useState("night");
  const [price, setPrice] = useState(500000);

  const [busTypes, setBusTypes] = useState({
    limousine: true,
    sleeper: true,
    seating: false,
  });

  const toggleBusType = (type) => {
    setBusTypes({
      ...busTypes,
      [type]: !busTypes[type],
    });
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow">

      {/* Header */}
      <div className="flex justify-between mb-4">
        <h2 className="font-semibold">Filters</h2>
        <button className="text-red-500 text-sm">Clear all</button>
      </div>

      {/* Departure Time */}
      <p className="font-medium mb-2">Departure Time</p>

      <div className="grid grid-cols-2 gap-2 mb-6">

        {["early","morning","afternoon","night"].map((time) => (
          <button
            key={time}
            onClick={() => setDeparture(time)}
            className={`border rounded-lg p-2 text-sm 
              ${departure === time ? "bg-red-500 text-white" : "hover:bg-gray-100"}
            `}
          >
            {time === "early" && "Early (00:00 - 06:00)"}
            {time === "morning" && "Morning (06:00 - 12:00)"}
            {time === "afternoon" && "Afternoon (12:00 - 18:00)"}
            {time === "night" && "Night (18:00 - 24:00)"}
          </button>
        ))}

      </div>

      {/* Price Range */}
      <p className="font-medium mb-2">Price Range</p>

      <input
        type="range"
        min="100000"
        max="1000000"
        step="10000"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="w-full mb-2"
      />

      <div className="flex justify-between text-sm text-gray-500 mb-6">
        <span>100.000</span>
        <span>{Number(price).toLocaleString()}</span>
      </div>

      {/* Bus Type */}
      <p className="font-medium mb-2">Bus Type</p>

      <div className="space-y-2 mb-6">

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={busTypes.limousine}
            onChange={() => toggleBusType("limousine")}
          />
          Limousine Cabinet
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={busTypes.sleeper}
            onChange={() => toggleBusType("sleeper")}
          />
          Sleeper Bus
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={busTypes.seating}
            onChange={() => toggleBusType("seating")}
          />
          Seating Bus
        </label>

      </div>

      {/* Bus Operator */}
      <p className="font-medium mb-2">Bus Operator</p>

      <div className="space-y-2 mb-4">

        <label className="flex items-center gap-2">
          <input type="checkbox" />
          Phuong Trang (Futa)
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" />
          Thanh Buoi
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" />
          Kumho Samco
        </label>

      </div>

      <button className="text-red-500 text-sm">
        Show 12 more...
      </button>

      {/* Pick-up / Drop-off */}
      <p className="font-medium mt-6 mb-2">
        Pick-up / Drop-off
      </p>

      <p className="text-xs text-gray-400 mb-1">
        PICK-UP LOCATION
      </p>

      <select className="border rounded-lg px-3 py-2 w-full mb-4">
        <option>All locations</option>
      </select>

      <p className="text-xs text-gray-400 mb-1">
        DROP-OFF LOCATION
      </p>

      <select className="border rounded-lg px-3 py-2 w-full">
        <option>All locations</option>
      </select>

    </div>
  );
};

export default Filters;