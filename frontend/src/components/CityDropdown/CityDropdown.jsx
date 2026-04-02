import { useState } from "react";

const CityDropdown = ({ value, onSelect, placeholder }) => {
  const [open, setOpen] = useState(false);

  const cities = [
    "Ho Chi Minh",
    "Ha Noi",
    "Da Lat",
    "Da Nang"
  ];

  return (
    <div className="relative w-full">

      {/* Input */}
      <div
        onClick={() => setOpen(!open)}
        className="border p-2 rounded cursor-pointer bg-white"
      >
        {value || placeholder}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute bg-white border rounded mt-1 w-full shadow z-10">
          {cities.map((city) => (
            <div
              key={city}
              onClick={() => {
                onSelect(city);
                setOpen(false);
              }}
              className="p-2 hover:bg-gray-100 cursor-pointer"
            >
              {city}
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default CityDropdown;