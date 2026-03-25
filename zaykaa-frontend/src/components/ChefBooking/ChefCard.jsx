// src/components/ChefBooking/ChefCard.jsx
import React from 'react';

const ChefCard = ({ chef, onSelect }) => {
  const rating = chef.rating || 0;
  const reviewCount = chef.reviews || 0;

  const renderStars = (rating) => {
    return '⭐'.repeat(Math.floor(rating)) + (rating % 1 !== 0 ? '✨' : '');
  };

  return (
    <div className="chef-card">
      <div className="chef-image">
        <img 
          src={chef.image || 'https://via.placeholder.com/300?text=Chef'} 
          alt={chef.name}
        />
        <span className="rating-badge">{rating.toFixed(1)}</span>
      </div>

      <div className="chef-info">
        <h3>{chef.name}</h3>
        
        <div className="stars">
          {renderStars(rating)} ({reviewCount} reviews)
        </div>

        <p className="specialties">
          {chef.specialties?.slice(0, 3).join(', ')}
        </p>

        <div className="pricing">
          <span className="rate">₹{chef.hourlyRate}/hour</span>
        </div>

        <div className="availability">
          <p><strong>Available:</strong> {chef.availableDays}</p>
        </div>

        <button 
          className="book-btn"
          onClick={() => onSelect(chef)}
        >
          View & Book
        </button>
      </div>
    </div>
  );
};

export default ChefCard;
