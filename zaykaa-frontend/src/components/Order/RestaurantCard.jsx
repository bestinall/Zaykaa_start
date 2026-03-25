// src/components/Order/RestaurantCard.jsx
import React from 'react';

const RestaurantCard = ({ restaurant, onSelect }) => {
  return (
    <div className="restaurant-card">
      <div className="restaurant-image">
        <img src={restaurant.image} alt={restaurant.name} />
        <span className="rating-badge">{restaurant.rating}⭐</span>
      </div>

      <div className="restaurant-info">
        <h3>{restaurant.name}</h3>
        <p className="location">📍 {restaurant.location}</p>
        <p className="reviews">({restaurant.reviews} reviews)</p>

        <button 
          className="order-btn"
          onClick={() => onSelect(restaurant)}
        >
          Order Now
        </button>
      </div>
    </div>
  );
};

export default RestaurantCard;
