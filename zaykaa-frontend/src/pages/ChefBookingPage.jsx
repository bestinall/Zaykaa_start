// src/pages/ChefBookingPage.jsx
import React, { useState } from 'react';
import Header from '../components/Common/Header';
import ChefSearch from '../components/ChefBooking/ChefSearch';
import BookingForm from '../components/ChefBooking/BookingForm';

const ChefBookingPage = () => {
  const [selectedChef, setSelectedChef] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const handleChefSelect = (chef) => {
    setSelectedChef(chef);
  };

  const handleBookingSuccess = (booking) => {
    setBookingSuccess(true);
    // Reset after 3 seconds
    setTimeout(() => {
      setSelectedChef(null);
      setBookingSuccess(false);
    }, 3000);
  };

  return (
    <>
      <Header />
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        {selectedChef && !bookingSuccess ? (
          <BookingForm
            chef={selectedChef}
            onBookingSuccess={handleBookingSuccess}
            onBack={() => setSelectedChef(null)}
          />
        ) : bookingSuccess ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: '#efe',
            margin: '40px 20px',
            borderRadius: '10px',
          }}>
            <h2 style={{ color: '#3c3' }}>✓ Booking Confirmed!</h2>
            <p>Your chef booking has been confirmed. Check your email for details.</p>
          </div>
        ) : (
          <ChefSearch onSelectChef={handleChefSelect} />
        )}
      </div>
    </>
  );
};

export default ChefBookingPage;
