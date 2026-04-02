import CityDropdown from "../CityDropdown/CityDropdown";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Hero = () => {
  const navigate = useNavigate();

  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [date, setDate] = useState("");

  const handleSearch = () => {
    if (!fromCity || !toCity || !date) {
      alert("Please fill all fields");
      return;
    }

    navigate(
      `/search?from=${fromCity}&to=${toCity}&date=${date}`
    );
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow flex gap-4">

      {/* FROM */}
      <CityDropdown
        value={fromCity}
        onSelect={setFromCity}
        placeholder="From where?"
      />

      {/* TO */}
      <CityDropdown
        value={toCity}
        onSelect={setToCity}
        placeholder="To where?"
      />

      {/* DATE */}
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="border p-2 rounded"
      />

      {/* SEARCH */}
      <button
        onClick={handleSearch}
        className="bg-orange-500 text-white px-4 rounded"
      >
        Search
      </button>

    </div>
  );
};

export default Hero;