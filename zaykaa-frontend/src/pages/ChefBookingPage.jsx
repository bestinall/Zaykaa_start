import React, { useState } from 'react';
import Header from '../components/Common/Header';
import ChefSearch from '../components/ChefBooking/ChefSearch';
import BookingForm from '../components/ChefBooking/BookingForm';
import Modal from '../components/ui/Modal';
import PageTransition from '../components/ui/PageTransition';
import { useToast } from '../context/ToastContext';

const ChefBookingPage = () => {
  const [selectedChef, setSelectedChef] = useState(null);
  const toast = useToast();

  const handleBookingSuccess = () => {
    toast.success('Chef booked', 'Your request has been placed and the chef has been notified.');
    setSelectedChef(null);
  };

  return (
    <PageTransition className="app-shell">
      <Header />
      <div className="content-shell">
        <ChefSearch onSelectChef={setSelectedChef} />
      </div>

      <Modal
        isOpen={Boolean(selectedChef)}
        onClose={() => setSelectedChef(null)}
        title={selectedChef ? `Book ${selectedChef.name}` : ''}
        description="Choose your dining date, guest count, and hosting preferences."
        size="xl"
      >
        {selectedChef && (
          <BookingForm
            chef={selectedChef}
            onBookingSuccess={handleBookingSuccess}
            onCancel={() => setSelectedChef(null)}
          />
        )}
      </Modal>
    </PageTransition>
  );
};

export default ChefBookingPage;
