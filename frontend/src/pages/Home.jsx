import Navbar from "../components/Navbar/Navbar";
import Hero from "../components/Hero/Hero";
import PopularRoutes from "../components/PopularRoutes/PopularRoutes";
import WhyChoose from "../components/WhyChoose/WhyChoose";


import Footer from "../components/Footer/Footer";

const Home = () => {
  return (
    <div>

      <Navbar />

      <Hero />
      <PopularRoutes />
      <WhyChoose />

      <Footer />

    </div>
  );
};

export default Home;