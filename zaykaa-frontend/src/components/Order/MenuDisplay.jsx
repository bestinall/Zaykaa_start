 //src/components/Order/MenuDisplay.jsx
import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';

const MenuDisplay = ({ restaurant, onBack }) => {
  const { addToCart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const dishes = restaurant.dishes || restaurant.menu || [];

  const categories = ['All', ...new Set(dishes.map(d => d.category))];
  
  const filteredDishes = selectedCategory === 'All' 
    ? dishes 
    : dishes.filter(d => d.category === selectedCategory);

  return (
    <div className="menu-display">
      <button className="back-btn" onClick={onBack}>← Back</button>

      <div className="restaurant-header">
        <img src={restaurant.image} alt={restaurant.name} />
        <div>
          <h2>{restaurant.name}</h2>
          <p>{restaurant.location} | {restaurant.rating}⭐ ({restaurant.reviews} reviews)</p>
        </div>
      </div>

      <div className="category-filter">
        {categories.map(category => (
          <button
            key={category}
            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="dishes-grid">
        {filteredDishes.map(dish => (
          <div key={dish.id} className="dish-card">
            <div className="dish-info">
              <h4>{dish.name}</h4>
              <p className="category-tag">{dish.category}</p>
              <p className="description">{dish.description}</p>
              <div className="dish-footer">
                <span className="price">₹{dish.price}</span>
                <button 
                  className="add-btn"
                  onClick={() => addToCart(dish, restaurant.id, restaurant.name)}
                >
                  + Add
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuDisplay;
