import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Common/Header';
import { orderService } from '../services/order';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [recentOrders, setRecentOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchRecentOrders = async () => {
      try {
        const response = await orderService.getRecentOrders();
        if (active) {
          setRecentOrders(response.orders || []);
        }
      } catch (error) {
        if (active) {
          setRecentOrders([]);
        }
      } finally {
        if (active) {
          setOrdersLoading(false);
        }
      }
    };

    fetchRecentOrders();

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <Header />
      <div className="dashboard-container">
        <div className="welcome-section">
          <h1>Welcome back, {user?.name}!</h1>
          <p>Explore authentic culinary experiences from around India</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-icon">Search</div>
            <h3>Explore Chefs</h3>
            <p>Discover talented chefs specializing in regional cuisine</p>
            <a href="/book-chef" style={{ textDecoration: 'none' }}>
              <button>Browse Chefs</button>
            </a>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">Book</div>
            <h3>Book a Chef</h3>
            <p>Book a chef to cook at your home for special occasions</p>
            <a href="/book-chef" style={{ textDecoration: 'none' }}>
              <button>Book Now</button>
            </a>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">Meal</div>
            <h3>Order Food</h3>
            <p>Order delicious dishes prepared by local chefs</p>
            <a href="/order" style={{ textDecoration: 'none' }}>
              <button>Order Food</button>
            </a>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">Rate</div>
            <h3>My Reviews</h3>
            <p>Share your experience and read reviews from others</p>
            <button>View Reviews</button>
          </div>
        </div>

        <section className="recent-section">
          <h2>Recent Orders</h2>
          {ordersLoading ? (
            <div className="empty-state">
              <p>Loading recent orders...</p>
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="empty-state">
              <p>No recent orders yet. Start exploring!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {recentOrders.map((order) => (
                <div key={order.id} className="dashboard-card" style={{ textAlign: 'left' }}>
                  <h3>{order.restaurantName}</h3>
                  <p>Status: {String(order.status || '').replaceAll('_', ' ')}</p>
                  <p>Total: Rs. {order.totalAmount}</p>
                  <p>Placed: {new Date(order.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
};

export default Dashboard;
