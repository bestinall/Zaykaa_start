// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ChefBookingPage from './pages/ChefBookingPage';
import OrderPage from './pages/OrderPage';
import ChefDashboard from './pages/ChefDashboard';
import './styles/Global.css';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // If a specific role is required, check it
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/chef-dashboard" 
              element={
                <ProtectedRoute requiredRole="chef">
                  <ChefDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/book-chef" 
              element={
                <ProtectedRoute>
                  <ChefBookingPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/order" 
              element={
                <ProtectedRoute>
                  <OrderPage />
                </ProtectedRoute>
              } 
            />
            
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
