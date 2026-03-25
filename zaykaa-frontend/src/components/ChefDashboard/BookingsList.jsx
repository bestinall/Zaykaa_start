// src/components/ChefDashboard/BookingsList.jsx
import React, { useState } from 'react';
import { chefService } from '../../services/chef';
import '../../styles/ChefDashboard.css';

const BookingsList = ({ bookings, onRefresh }) => {
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const filteredBookings = filter === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === filter);

  const handleStatusUpdate = async (bookingId, newStatus) => {
    setLoading(true);
    try {
      await chefService.updateBookingStatus(bookingId, newStatus);
      setMessage(`Booking ${newStatus} successfully!`);
      onRefresh();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to update booking');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return '#FFC107';
      case 'confirmed': return '#28A745';
      case 'completed': return '#007BFF';
      case 'cancelled': return '#DC3545';
      default: return '#6C757D';
    }
  };

  const timeSlotLabel = {
    breakfast: '🌅 Breakfast (7-10 AM)',
    lunch: '🍽️ Lunch (12-2 PM)',
    dinner: '🌙 Dinner (6-9 PM)',
  };

  return (
    <div className="bookings-list">
      <div className="list-header">
        <h2>📅 Your Bookings</h2>
        
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({bookings.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button 
            className={`filter-btn ${filter === 'confirmed' ? 'active' : ''}`}
            onClick={() => setFilter('confirmed')}
          >
            Confirmed
          </button>
          <button 
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
        </div>
      </div>

      {message && <div className="success-message">{message}</div>}

      {filteredBookings.length === 0 ? (
        <div className="empty-state">
          <p>No bookings found with this filter.</p>
        </div>
      ) : (
        <div className="bookings-cards">
          {filteredBookings.map(booking => (
            <div key={booking.id} className="booking-card">
              <div className="booking-header">
                <div>
                  <h3>{booking.userName}</h3>
                  <p className="booking-id">Booking #{booking.id}</p>
                </div>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(booking.status) }}
                >
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </div>

              <div className="booking-details">
                <div className="detail-row">
                  <span className="label">📅 Date:</span>
                  <span>{booking.date}</span>
                </div>
                <div className="detail-row">
                  <span className="label">⏰ Time:</span>
                  <span>{timeSlotLabel[booking.timeSlot]}</span>
                </div>
                <div className="detail-row">
                  <span className="label">👥 Guests:</span>
                  <span>{booking.guestCount} people</span>
                </div>
                <div className="detail-row">
                  <span className="label">🍳 Menu:</span>
                  <span>{booking.menuPreferences}</span>
                </div>
                <div className="detail-row">
                  <span className="label">💰 Amount:</span>
                  <span className="amount">₹{booking.amount}</span>
                </div>
              </div>

              <div className="booking-actions">
                {booking.status === 'pending' && (
                  <>
                    <button 
                      className="btn-confirm"
                      onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                      disabled={loading}
                    >
                      ✓ Confirm
                    </button>
                    <button 
                      className="btn-cancel"
                      onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                      disabled={loading}
                    >
                      ✕ Decline
                    </button>
                  </>
                )}
                {booking.status === 'confirmed' && (
                  <button 
                    className="btn-complete"
                    onClick={() => handleStatusUpdate(booking.id, 'completed')}
                    disabled={loading}
                  >
                    ✓ Mark Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingsList;
