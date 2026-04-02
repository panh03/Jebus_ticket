import { FaMoneyBillWave, FaShieldAlt, FaHeadset } from "react-icons/fa";

const features = [
  {
    id: 1,
    icon: <FaMoneyBillWave size={28} />,
    title: "Best Price Guaranteed",
    desc: "We match any price and offer the lowest booking fees in the market, ensuring you get the most value.",
  },
  {
    id: 2,
    icon: <FaShieldAlt size={28} />,
    title: "Verified Operators",
    desc: "We only partner with top-rated, luxury and licensed bus operators for your ultimate comfort and safety.",
  },
  {
    id: 3,
    icon: <FaHeadset size={28} />,
    title: "24/7 Support",
    desc: "Our dedicated concierge team is ready to assist you around the clock, ensuring a seamless journey.",
  },
];

const WhyChoose = () => {
  return (
    <section className="py-20 bg-blue-50">
      <div className="max-w-6xl mx-auto px-4 text-center">

        {/* Title */}
        <h2 className="text-3xl font-bold mb-2">
          Why Choose BusTicket?
        </h2>

        <p className="text-gray-500 mb-14">
          The most trusted booking experience in the country
        </p>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-10">

          {features.map((item) => (
            <div key={item.id} className="flex flex-col items-center">

              {/* Icon box */}
              <div className="bg-blue-100 text-blue-600 p-5 rounded-xl mb-5">
                {item.icon}
              </div>

              {/* Title */}
              <h3 className="font-semibold text-lg mb-2">
                {item.title}
              </h3>

              {/* Description */}
              <p className="text-gray-500 text-sm max-w-xs">
                {item.desc}
              </p>

            </div>
          ))}

        </div>

      </div>
    </section>
  );
};

export default WhyChoose;