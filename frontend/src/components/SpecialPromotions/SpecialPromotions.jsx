import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SpecialPromotions.css';

const promotions = [
  {
    id: 1,
    title: "Travel for Less with JEBus Points",
    subtitle: "Redeem your earned points to get instant discounts on your next bus ticket booking.",
    image: "/loyalty_points_banner.png",
    link: "/"
  },
  {
    id: 2,
    title: "Summer Coastal Getaways",
    subtitle: "Enjoy up to 20% off on all coastal routes this summer. Book early to secure your seat and start your vacation right!",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
    link: "/"
  },
  {
    id: 3,
    title: "New Route: Hanoi to Sapa",
    subtitle: "Experience our luxury sleeper buses on the newly launched Hanoi - Sapa route. Enjoy the scenic mountain views in comfort.",
    image: "/sapa_promo.png",
    link: "/"
  }
];

const SpecialPromotions = () => {
  const navigate = useNavigate();

  return (
    <div className="promotions-section">
      <div className="container">
        <h2 className="promotions-title">Special Promotions</h2>
        
        <div className="promo-scroll-container">
          {promotions.map(promo => (
            <div key={promo.id} className="promo-card">
              <img src={promo.image} alt={promo.title} className="promo-image" />
              <div className="promo-content">
                <h3 className="promo-card-title">{promo.title}</h3>
                <p className="promo-card-subtitle">{promo.subtitle}</p>
                <button 
                  className="promo-btn"
                  onClick={() => navigate(promo.link)}
                >
                  Learn More <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpecialPromotions;
