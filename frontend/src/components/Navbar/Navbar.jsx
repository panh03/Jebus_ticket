import { useState } from "react";

const Navbar = () => {

  const [open, setOpen] = useState(false);

  const MenuLinks = [
    { name: "Ticket", link: "#" },
    { name: "Bus Operators", link: "#" },
    { name: "Rent a Car", link: "#" },
    { name: "Promotions", link: "#" },
  ];

  return (
    <div className="bg-white border-b">

      <div className="container flex items-center justify-between py-4">

        {/* LEFT SIDE */}
        <div className="flex items-center gap-6 lg:gap-10">

          {/* Logo */}
          <h1 className="text-xl font-bold text-primary">
            J E B U S
          </h1>

          {/* Desktop Menu */}
          <ul className="hidden md:flex items-center gap-6 lg:gap-8 text-gray-700 font-medium">
            {MenuLinks.map((data, index) => (
              <li key={index}>
                <a
                  href={data.link}
                  className="hover:text-primary duration-200"
                >
                  {data.name}
                </a>
              </li>
            ))}
          </ul>

        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-4 md:gap-6">

          {/* Desktop Login */}
          <a
            href="#"
            className="hidden md:block text-gray-700 font-medium hover:text-primary"
          >
            Login
          </a>

          {/* Desktop Sign Up */}
          <button className="hidden md:block bg-primary text-white px-5 py-2 rounded-lg font-medium hover:bg-red-600 transition">
            Sign Up
          </button>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-2xl"
            onClick={() => setOpen(!open)}
          >
            ☰
          </button>

        </div>

      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-white border-t">

          <ul className="flex flex-col items-center gap-4 py-6 text-gray-700 font-medium">

            {MenuLinks.map((data, index) => (
              <li key={index}>
                <a
                  href={data.link}
                  className="hover:text-primary"
                >
                  {data.name}
                </a>
              </li>
            ))}

            <a href="#" className="hover:text-primary">
              Login
            </a>

            <button className="bg-primary text-white px-5 py-2 rounded-lg">
              Sign Up
            </button>

          </ul>

        </div>
      )}

    </div>
  );
};

export default Navbar;