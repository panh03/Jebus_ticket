import Hero from "../components/Hero/Hero";

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
            <h3>Easy Booking</h3>
            <p>Book your tickets in just a few clicks from the comfort of your home.</p>
          </div>
          <div className="feature-card">
            <h3>Multiple Routes</h3>
            <p>Connect with major cities across the country with our extensive network.</p>
          </div>
          <div className="feature-card">
            <h3>Reliable Operators</h3>
            <p>We partner with the best bus operators to ensure a safe and comfortable journey.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;