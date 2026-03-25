// src/components/Order/RestaurantBrowse.jsx
import React, { useState, useEffect } from 'react';
import { orderService } from '../../services/order';
import RestaurantCard from './RestaurantCard';
import '../../styles/Order.css';

const RestaurantBrowse = ({ onSelectRestaurant }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRestaurants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRestaurants = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await orderService.getRestaurants({ location });
      setRestaurants(response.restaurants || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRestaurants();
  };

  return (
    <div className="restaurant-browse">
      <h2>Order Delicious Food</h2>
      
      <form className="search-form" onSubmit={handleSearch}>
        <div className="form-group">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter your location or area"
          />
          <button type="submit">Search</button>
        </div>
      </form>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-state">Loading restaurants...</div>
      ) : restaurants.length === 0 ? (
        <div className="empty-state">
          <p>No restaurants found. Try a different location.</p>
        </div>
      ) : (
        <div className="restaurants-grid">
          {restaurants.map(restaurant => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              onSelect={onSelectRestaurant}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RestaurantBrowse;
