// src/pages/ChefDashboard.jsx
import React, { useState, useEffect } from 'react';
import Header from '../components/Common/Header';
import BookingsList from '../components/ChefDashboard/BookingsList';
import RecipesList from '../components/ChefDashboard/RecipesList';
import ChefMenuManagement from '../components/ChefDashboard/ChefMenuManagement';
import Analytics from '../components/ChefDashboard/Analytics';
import { chefService } from '../services/chef';
import '../styles/ChefDashboard.css';

const ChefDashboard = () => {
  const [activeTab, setActiveTab] = useState('bookings'); // bookings, recipes, menu, analytics
  const [bookings, setBookings] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'bookings') {
      loadBookings();
    } else if (activeTab === 'recipes') {
      loadRecipes();
    } else if (activeTab === 'menu') {
      // Menu component handles its own loading
    } else if (activeTab === 'analytics') {
      loadAnalytics();
    }
  }, [activeTab]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const response = await chefService.getChefBookings();
      setBookings(response.bookings || []);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecipes = async () => {
    setLoading(true);
    try {
      const response = await chefService.getChefRecipes();
      setRecipes(response.recipes || []);
    } catch (err) {
      console.error('Failed to load recipes:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await chefService.getAnalytics();
      setAnalytics(response);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="chef-dashboard">
        <div className="chef-header">
          <h1>👨‍🍳 Chef Dashboard</h1>
          <p>Manage your bookings, recipes, menu, and track earnings</p>
        </div>

        <div className="chef-tabs">
          <button 
            className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            📅 Bookings
          </button>
          <button 
            className={`tab-btn ${activeTab === 'recipes' ? 'active' : ''}`}
            onClick={() => setActiveTab('recipes')}
          >
            📖 Recipes
          </button>
          <button 
            className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveTab('menu')}
          >
            🍽️ Menu
          </button>
          <button 
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            📊 Analytics
          </button>
        </div>

        <div className="chef-content">
          {loading && activeTab !== 'menu' ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading...</p>
            </div>
          ) : (
            <>
              {activeTab === 'bookings' && <BookingsList bookings={bookings} onRefresh={loadBookings} />}
              {activeTab === 'recipes' && <RecipesList recipes={recipes} onRefresh={loadRecipes} />}
              {activeTab === 'menu' && <ChefMenuManagement />}
              {activeTab === 'analytics' && <Analytics data={analytics} />}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ChefDashboard;
