// src/components/Common/Header.jsx (updated)
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const chefDashboardLink = user?.role === 'chef' ? '/chef-dashboard' : null;

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
           <h2>🍜 Zaykaa</h2>
         
        </div>
        
        <nav className="nav-menu">
          <ul>
            <li><a href="/dashboard">Home</a></li>
            <li><a href="/book-chef">Book Chef</a></li>
            <li><a href="/order">Order</a></li>
            {chefDashboardLink && <li><a href={chefDashboardLink}>My Chef Profile</a></li>}
          </ul>
        </nav>
        
        <div className="user-section">
          <span className="user-name">{user?.name}</span>
          <span className="user-role">({user?.role})</span>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
    
  );
};

export default Header;
