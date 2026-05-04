import React, { useState } from 'react';
import Header from '../components/Common/Header';
import ChefSearch from '../components/ChefBooking/ChefSearch';
import BookingForm from '../components/ChefBooking/BookingForm';
import Modal from '../components/ui/Modal';
import PageTransition from '../components/ui/PageTransition';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { saveStudioChefBookingForChef } from '../utils/chefStudioStorage';
import { getChefBookingStorageScope, saveStoredChefBooking } from '../utils/userChefBookings';

const ChefBookingPage = () => {
  const [selectedChef, setSelectedChef] = useState(null);
  const { user } = useAuth();
  const toast = useToast();

  const handleBookingSuccess = (booking) => {
    if (selectedChef) {
      const estimatedSessionAmount = Number(selectedChef.hourlyRate || 0) * 3;

      saveStoredChefBooking(getChefBookingStorageScope(user), {
        ...booking,
        chefId: booking?.chefId || selectedChef.id,
        chefName: booking?.chefName || booking?.chef?.name || selectedChef.name,
        chefImage: booking?.chefImage || booking?.chef?.image || selectedChef.image,
        chefCuisine: booking?.chefCuisine || booking?.chef?.cuisine || selectedChef.cuisine,
        chefLocation:
          booking?.chefLocation ||
          booking?.chef?.location ||
          selectedChef.location ||
          selectedChef.city ||
          selectedChef.state ||
          '',
        amount: Number(booking?.amount ?? booking?.totalAmount ?? estimatedSessionAmount),
        createdAt: booking?.createdAt || new Date().toISOString(),
      });

      saveStudioChefBookingForChef(selectedChef, booking, user);
    }

    toast.success('Chef booked', 'Your request has been placed and is now visible in your dashboard.');
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
