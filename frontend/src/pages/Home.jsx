import Hero from "../components/Hero/Hero";
import TestimonialCarousel from "../components/TestimonialCarousel/TestimonialCarousel";
import SpecialPromotions from "../components/SpecialPromotions/SpecialPromotions";

const Home = () => {
  return (
    <div className="home-page">
      <Hero />
      <div className="container" style={{ padding: "4rem 1.5rem" }}>
        <h2 style={{ fontSize: "2.5rem", fontWeight: "800", color: "#1e293b", marginBottom: "2rem" }}>
          Why choose JEBus?
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
          <div className="feature-card">
            <img 
              src="https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&q=80&w=600&h=400" 
              alt="Easy Booking" 
              style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "0.5rem", marginBottom: "1rem" }} 
            />
            <h3>Easy Booking</h3>
            <p>Book your tickets in just a few clicks from the comfort of your home.</p>
          </div>
          <div className="feature-card">
            <img 
              src="https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?auto=format&fit=crop&q=80&w=600&h=400" 
              alt="Multiple Routes" 
              style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "0.5rem", marginBottom: "1rem" }} 
            />
            <h3>Multiple Routes</h3>
            <p>Connect with major cities across the country with our extensive network.</p>
          </div>
          <div className="feature-card">
            <img 
              src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=600&h=400" 
              alt="Reliable Operators" 
              style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "0.5rem", marginBottom: "1rem" }} 
            />
            <h3>Reliable Operators</h3>
            <p>We partner with the best bus operators to ensure a safe and comfortable journey.</p>
          </div>
        </div>
      </div>
      <TestimonialCarousel />
      <SpecialPromotions />
    </div>
  );
};

export default Home;