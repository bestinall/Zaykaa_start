// src/components/ChefBooking/ChefSearch.jsx
import React, { useState, useEffect } from 'react';
import { bookingService } from '../../services/booking';
import ChefCard from './ChefCard';
import '../../styles/ChefBooking.css';

const ChefSearch = ({ onSelectChef }) => {
  const [chefs, setChefs] = useState([]);
  const [filters, setFilters] = useState({
    location: '',
    cuisine: 'All',
    date: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch chefs on component load or filter change
  useEffect(() => {
    fetchChefs();
  }, []);

  const fetchChefs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await bookingService.getAvailableChefs(filters);
      setChefs(response.chefs || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load chefs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchChefs();
  };

  return (
    <div className="chef-search">
      <h2>Find Your Perfect Chef</h2>
      
      <form className="search-form" onSubmit={handleSearch}>
        <div className="form-row">
          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
              placeholder="Enter your city or area"
            />
          </div>

          <div className="form-group">
            <label>Cuisine Type</label>
            <select
              name="cuisine"
              value={filters.cuisine}
              onChange={handleFilterChange}
            >
              <option>All</option>
              <option>North Indian</option>
              <option>South Indian</option>
              <option>Chinese</option>
              <option>Italian</option>
              <option>Continental</option>
              <option>Fusion</option>
            </select>
          </div>

          <div className="form-group">
            <label>Preferred Date</label>
            <input
              type="date"
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <button type="submit" className="search-btn">Search</button>
        </div>
      </form>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-state">Loading chefs...</div>
      ) : chefs.length === 0 ? (
        <div className="empty-state">
          <p>No chefs available with your filters. Try adjusting your search.</p>
        </div>
      ) : (
        <div className="chefs-grid">
          {chefs.map(chef => (
            <ChefCard
              key={chef.id}
              chef={chef}
              onSelect={onSelectChef}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ChefSearch;
