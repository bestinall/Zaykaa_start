import api from './api';

const MOCK_MODE = false;

const unwrapResponse = (response) => response?.data?.data ?? response?.data ?? {};

const normalizeRecipe = (recipe = {}) => ({
  ...recipe,
  preparationTime: recipe.preparationTime || recipe.preparation_time_label || '0 mins',
  views: recipe.views ?? recipe.views_count ?? 0,
});

export const chefService = {
  getChefBookings: async (status = 'all') => {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 600));
      return { bookings: [] };
    }

    try {
      const response = await api.get('/chef/bookings', { params: { status } });
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
      const response = await api.get(`/chef/bookings/${bookingId}`);
      return unwrapResponse(response);
    } catch (error) {
      throw error;
    }
  },

  updateBookingStatus: async (bookingId, status) => {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { message: `Booking status updated to ${status}` };
    }

    try {
      const response = await api.patch(`/chef/bookings/${bookingId}/status`, { status });
      return unwrapResponse(response);
    } catch (error) {
      throw error;
    }
  },

  getChefRecipes: async () => {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 600));
      return { recipes: [] };
    }

    try {
      const response = await api.get('/chef/recipes');
      const data = unwrapResponse(response);
      return {
        ...data,
        recipes: (data.recipes || []).map(normalizeRecipe),
      };
    } catch (error) {
      throw error;
    }
  },

  addRecipe: async (recipeData) => {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return { recipe: recipeData };
    }

    try {
      const response = await api.post('/chef/recipes', recipeData);
      const data = unwrapResponse(response);
      if (data.recipe) {
        data.recipe = normalizeRecipe(data.recipe);
      }
      return data;
    } catch (error) {
      throw error;
    }
  },

  deleteRecipe: async (recipeId) => {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { message: 'Recipe deleted' };
    }

    try {
      const response = await api.delete(`/chef/recipes/${recipeId}`);
      return unwrapResponse(response);
    } catch (error) {
      throw error;
    }
  },

  getAllRecipes: async () => {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 600));
      return { recipes: [] };
    }

    try {
      const response = await api.get('/all-recipes');
      const data = unwrapResponse(response);
      return {
        ...data,
        recipes: (data.recipes || []).map(normalizeRecipe),
      };
    } catch (error) {
      throw error;
    }
  },

  getAnalytics: async () => {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 600));
      return {
        totalBookings: 0,
        totalEarnings: 0,
        averageRating: 0,
        totalReviews: 0,
        upcomingBookings: 0,
        completedBookings: 0,
      };
    }

    try {
      const response = await api.get('/chef/analytics');
      return unwrapResponse(response);
    } catch (error) {
      throw error;
    }
  },
};
