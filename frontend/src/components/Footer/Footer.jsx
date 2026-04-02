import { FaBus, FaTwitter, FaInstagram, FaFacebookF } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-black text-gray-300">

      {/* Top Footer */}
      <div className="max-w-7xl mx-auto px-6 py-14 grid md:grid-cols-4 gap-10">

        {/* Logo + Description */}
        <div>
          <div className="flex items-center gap-2 text-white text-xl font-semibold mb-4">
            <FaBus className="text-white-500" />
            J E B U S
          </div>

          <p className="text-gray-400 text-sm leading-relaxed">
            Redefining bus travel through premium technology
            and world-class service. Experience the journey
            you deserve.
          </p>
        </div>

        {/* Services */}
        <div>
          <h3 className="text-white font-semibold mb-4 tracking-wide">
            SERVICES
          </h3>

          <ul className="space-y-2 text-sm">
            <li className="hover:text-white cursor-pointer">Booking</li>
            <li className="hover:text-white cursor-pointer">Operators</li>
            <li className="hover:text-white cursor-pointer">Car Rental</li>
            <li className="hover:text-white cursor-pointer">Station Info</li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h3 className="text-white font-semibold mb-4 tracking-wide">
            COMPANY
          </h3>

          <ul className="space-y-2 text-sm">
            <li className="hover:text-white cursor-pointer">Our Story</li>
            <li className="hover:text-white cursor-pointer">Careers</li>
            <li className="hover:text-white cursor-pointer">Newsroom</li>
            <li className="hover:text-white cursor-pointer">Travel Blog</li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-white font-semibold mb-4 tracking-wide">
            SUPPORT
          </h3>

          <ul className="space-y-2 text-sm">
            <li className="hover:text-white cursor-pointer">Help Center</li>
            <li className="hover:text-white cursor-pointer">Terms</li>
            <li className="hover:text-white cursor-pointer">Privacy</li>
            <li className="hover:text-white cursor-pointer">Refunds</li>
          </ul>
        </div>

      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between text-sm text-gray-400">

          <p>
            © 2026 BusTicket Global Inc. All rights reserved.
          </p>

          <div className="flex items-center gap-5 mt-3 md:mt-0 text-lg">
            <FaTwitter className="cursor-pointer hover:text-white" />
            <FaInstagram className="cursor-pointer hover:text-white" />
            <FaFacebookF className="cursor-pointer hover:text-white" />
          </div>

        </div>
      </div>

    </footer>
  );
};

export default Footer;