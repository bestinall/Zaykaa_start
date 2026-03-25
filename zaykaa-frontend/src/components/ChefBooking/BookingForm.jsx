// src/components/ChefBooking/BookingForm.jsx
import React, { useState, useEffect } from 'react';
import { bookingService } from '../../services/booking';
import '../../styles/BookingForm.css';

const BookingForm = ({ chef, onBookingSuccess, onBack }) => {
  const [bookingData, setBookingData] = useState({
    date: '',
    timeSlot: 'breakfast', // breakfast, lunch, dinner
    guestCount: 2,
    menuPreferences: '',
    dietaryRestrictions: '',
    specialRequests: '',
  });

  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Fetch chef availability
    fetchAvailability();
  }, [chef.id]);

  const fetchAvailability = async () => {
    try {
      const response = await bookingService.getChefAvailability(chef.id);
      setAvailability(response.availability || []);
    } catch (err) {
      setError('Failed to load availability');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await bookingService.createBooking({
        chefId: chef.id,
        ...bookingData,
      });

      setSuccess('Booking created successfully!');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        onBookingSuccess(response.booking);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  const timeSlots = [
    { value: 'breakfast', label: '🌅 Breakfast (7 AM - 10 AM)' },
    { value: 'lunch', label: '🍽️ Lunch (12 PM - 2 PM)' },
    { value: 'dinner', label: '🌙 Dinner (6 PM - 9 PM)' },
  ];

  return (
    <div className="booking-form-container">
      <button className="back-btn" onClick={onBack}>← Back</button>

      <div className="chef-summary">
        <img src={chef.image || 'https://via.placeholder.com/100'} alt={chef.name} />
        <div>
          <h2>{chef.name}</h2>
          <p>{chef.specialties?.join(', ')}</p>
          <p className="rate">₹{chef.hourlyRate}/hour</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="booking-form">
        <h3>Book Your Chef</h3>

        <div className="form-group">
          <label>Date</label>
          <input
            type="date"
            name="date"
            value={bookingData.date}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        <div className="form-group">
          <label>Time Slot</label>
          <div className="time-slots">
            {timeSlots.map(slot => (
              <label key={slot.value} className="slot-option">
                <input
                  type="radio"
                  name="timeSlot"
                  value={slot.value}
                  checked={bookingData.timeSlot === slot.value}
                  onChange={handleChange}
                />
                <span>{slot.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Number of Guests</label>
          <input
            type="number"
            name="guestCount"
            value={bookingData.guestCount}
            onChange={handleChange}
            min="1"
            max="20"
            required
          />
        </div>

        <div className="form-group">
          <label>Menu Preferences (e.g., North Indian, Vegan)</label>
          <input
            type="text"
            name="menuPreferences"
            value={bookingData.menuPreferences}
            onChange={handleChange}
            placeholder="Describe your preferred cuisine or dishes"
          />
        </div>

        <div className="form-group">
          <label>Dietary Restrictions</label>
          <textarea
            name="dietaryRestrictions"
            value={bookingData.dietaryRestrictions}
            onChange={handleChange}
            placeholder="Any allergies or dietary requirements?"
            rows="3"
          />
        </div>

        <div className="form-group">
          <label>Special Requests</label>
          <textarea
            name="specialRequests"
            value={bookingData.specialRequests}
            onChange={handleChange}
            placeholder="Any special instructions or preferences?"
            rows="3"
          />
        </div>

        <div className="price-summary">
          <p>
            <strong>Estimated Cost:</strong> ₹{chef.hourlyRate * 3} (3 hours, 1 session)
          </p>
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Processing...' : 'Confirm Booking'}
        </button>
      </form>
    </div>
  );
};

export default BookingForm;
