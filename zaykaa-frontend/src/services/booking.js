import api from './api';

const MOCK_MODE = false;

const unwrapResponse = (response) => response?.data?.data ?? response?.data ?? {};

const normalizeChef = (chef = {}) => ({
  ...chef,
  name: chef.name || chef.displayName || '',
  hourlyRate: chef.hourlyRate ?? chef.hourly_rate ?? 0,
  availableDays: chef.availableDays || chef.available_days || 'Schedule available on request',
  image: chef.image || chef.profileImageUrl || 'https://via.placeholder.com/300?text=Chef',
  reviews: chef.reviews ?? chef.totalReviews ?? 0,
  rating: chef.rating ?? chef.averageRating ?? 0,
});

export const bookingService = {
  getAvailableChefs: async (filters = {}) => {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 600));
      return { chefs: [] };
    }

    try {
      const response = await api.get('/chefs/available', { params: filters });
      const data = unwrapResponse(response);
      return {
        ...data,
        chefs: (data.chefs || []).map(normalizeChef),
      };
    } catch (error) {
      throw error;
    }
  },

  getChefDetails: async (chefId) => {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { chef: {} };
    }

    try {
      const response = await api.get(`/chefs/${chefId}`);
      const data = unwrapResponse(response);
      return {
        ...data,
        chef: normalizeChef(data.chef || data),
      };
    } catch (error) {
      throw error;
    }
  },

  getChefAvailability: async (chefId) => {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { availability: [] };
    }

    try {
      const response = await api.get(`/chefs/${chefId}/availability`);
      return unwrapResponse(response);
    } catch (error) {
      throw error;
    }
  },

  createBooking: async (bookingData) => {
    // Detect preview chefs by string IDs (chef-1, chef-2, etc.) - use mock mode for them only
    const isPreviewChef = typeof bookingData.chefId === 'string' && bookingData.chefId.startsWith('chef-');

    if (MOCK_MODE || isPreviewChef) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        booking: {
          id: Math.floor(Math.random() * 10000),
          bookingReference: `DEMO-${Date.now().toString(36).toUpperCase()}`,
          status: 'pending',
          ...bookingData,
        },
        message: 'Demo booking created',
      };
    }

    try {
      const response = await api.post('/bookings', bookingData);
      return unwrapResponse(response);
    } catch (error) {
      throw error;
    }
  },

  getUserBookings: async () => {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { bookings: [] };
    }

    try {
      const response = await api.get('/bookings/my');
      return unwrapResponse(response);
    } catch (error) {
      throw error;
    }
  },

  getBookingDetails: async (bookingId) => {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { booking: {} };
    }

    try {
      const response = await api.get(`/bookings/${bookingId}`);
      return unwrapResponse(response);
    } catch (error) {
      throw error;
    }
  },

  cancelBooking: async (bookingId, reason) => {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { message: 'Booking cancelled' };
    }

    try {
      const response = await api.patch(`/bookings/${bookingId}/cancel`, { reason });
      return unwrapResponse(response);
    } catch (error) {
      throw error;
    }
  },
};
