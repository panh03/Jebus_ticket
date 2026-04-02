import { useEffect, useState } from "react";

import nhatrang from "../../assets/routes/nhatrang.jpg";
import Dalat from "../../assets/routes/Dalat.jpg";
import danang from "../../assets/routes/danang.jpg";
import hanoi from "../../assets/routes/hanoi.jpg";

const PopularRoutes = () => {

  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    fetchPopularRoutes();
  }, []);

  const fetchPopularRoutes = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/trips/popular");
      const data = await res.json();
      setRoutes(data);
    } catch (error) {
      console.error("Error fetching routes:", error);
    }
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold">Popular Routes</h2>
            <p className="text-gray-500 text-sm">
              Iconic destinations across the nation at your fingertips
            </p>
          </div>

          <button className="text-blue-600 text-sm font-medium hover:underline">
            View All Routes →
          </button>
        </div>

        {/* Routes Grid */}
        <div className="grid md:grid-cols-4 sm:grid-cols-2 gap-6">

          {routes.map((route) => (
            <div
              key={route.id}
              className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden"
            >

              <div className="p-4">

                <h3 className="font-semibold text-gray-800">
                  {route.from_city} to {route.to_city}
                </h3>

                <p className="text-gray-500 text-sm mt-1">
                  {route.duration || "Daily trips"}
                </p>

                <div className="flex justify-between items-center mt-4">
                  <span className="text-gray-400 text-xs">
                    FROM
                  </span>

                  <span className="text-blue-600 font-bold">
                    {route.price} VND
                  </span>
                </div>

              </div>

            </div>
          ))}

        </div>
      </div>
    </section>
  );
};

export default PopularRoutes;