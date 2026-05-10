import React, { useState, useEffect, useRef } from 'react';
import './TestimonialCarousel.css';

const testimonials = [
  {
    id: 1,
    name: "Nguyen Van A",
    subtitle: "Frequent Traveler",
    text: "JEBus made my trip from Ho Chi Minh City to Da Lat so much easier! The booking process is seamless, and the operators are top-notch.",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg"
  },
  {
    id: 2,
    name: "Tran Thi B",
    subtitle: "Business Consultant",
    text: "I travel frequently for work and always rely on JEBus. The ease of checking schedules and confirming seats saves me so much time.",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg"
  },
  {
    id: 3,
    name: "Le Van C",
    subtitle: "Student",
    text: "Great prices and amazing support. I love how I can view the exact seat layouts and choose where I want to sit.",
    avatar: "https://randomuser.me/api/portraits/men/86.jpg"
  },
  {
    id: 4,
    name: "Pham Thi D",
    subtitle: "Tourist",
    text: "The points and discount system is a fantastic feature. I've already saved so much on my weekend getaways!",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg"
  },
  {
    id: 5,
    name: "Hoang Van E",
    subtitle: "Photographer",
    text: "Very reliable platform. I've never had an issue with my bookings, and the user interface is just beautiful and easy to use.",
    avatar: "https://randomuser.me/api/portraits/men/46.jpg"
  }
];

const TestimonialCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsToShow, setItemsToShow] = useState(3);
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const updateItemsToShow = () => {
      if (window.innerWidth < 768) {
        setItemsToShow(1);
      } else if (window.innerWidth < 1024) {
        setItemsToShow(2);
      } else {
        setItemsToShow(3);
      }
    };
    
    updateItemsToShow();
    window.addEventListener('resize', updateItemsToShow);
    return () => window.removeEventListener('resize', updateItemsToShow);
  }, []);

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const nextSlide = () => {
    setCurrentIndex(prev => (prev === testimonials.length - itemsToShow ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => (prev === 0 ? testimonials.length - itemsToShow : prev - 1));
  };

  useEffect(() => {
    resetTimeout();
    if (!isHovered) {
      timeoutRef.current = setTimeout(() => {
        nextSlide();
      }, 4000); // 4 seconds
    }
    return () => resetTimeout();
  }, [currentIndex, isHovered, itemsToShow]);

  return (
    <div className="testimonial-section">
      <div className="container">
        <h2 className="testimonial-title">Client Testimonials</h2>
        
        <div 
          className="carousel-container"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div 
            className="carousel-track"
            style={{ transform: `translateX(-${currentIndex * (100 / itemsToShow)}%)` }}
          >
            {testimonials.map(testimonial => (
              <div 
                key={testimonial.id} 
                className="carousel-item"
                style={{ flex: `0 0 ${100 / itemsToShow}%` }}
              >
                <div className="testimonial-card">
                  <div className="rating-stars">
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                  </div>
                  <p className="testimonial-text">"{testimonial.text}"</p>
                  <div className="user-info">
                    <img src={testimonial.avatar} alt={testimonial.name} className="user-avatar" />
                    <div className="user-details">
                      <span className="user-name">{testimonial.name}</span>
                      <span className="user-subtitle">{testimonial.subtitle}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="carousel-btn prev" onClick={prevSlide} aria-label="Previous testimonial">
            <i className="fas fa-chevron-left"></i>
          </button>
          <button className="carousel-btn next" onClick={nextSlide} aria-label="Next testimonial">
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>

        <div className="pagination-dots">
          {Array.from({ length: testimonials.length - itemsToShow + 1 }).map((_, idx) => (
            <button 
              key={idx} 
              className={`dot ${currentIndex === idx ? 'active' : ''}`}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            ></button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestimonialCarousel;
