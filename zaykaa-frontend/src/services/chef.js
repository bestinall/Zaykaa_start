import api from './api';
import { previewAnalytics, previewChefBookings, previewRecipes } from '../data/mockData';
import {
  buildStoredChefAnalyticsForUser,
  ensureStoredChefBookingsForUser,
  ensureStoredManagedRecipesForUser,
  getStoredChefBookingsForUser,
  getStoredManagedRecipesForUser,
  getStoredSessionUser,
  syncStoredChefBookingsForUser,
  syncStoredManagedRecipesForUser,
  updateStoredChefBookingStatusForUser,
  upsertStoredManagedRecipeForUser,
  deleteStoredManagedRecipeForUser,
} from '../utils/chefStudioStorage';

const MOCK_MODE = false;

const unwrapResponse = (response) => response?.data?.data ?? response?.data ?? {};

const normalizeRecipe = (recipe = {}) => ({
  ...recipe,
  preparationTime: recipe.preparationTime || recipe.preparation_time_label || '0 mins',
  views: recipe.views ?? recipe.views_count ?? 0,
});

export const chefService = {
  getChefBookings: async (status = 'all') => {
    const user = getStoredSessionUser();

    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 600));
      return { bookings: ensureStoredChefBookingsForUser(user, previewChefBookings), source: 'preview' };
    }

    try {
      const response = await api.get('/chef/bookings', { params: { status } });
      const data = unwrapResponse(response);
      const bookings = data.bookings || [];

      if (bookings.length > 0) {
        return {
          ...data,
          bookings: syncStoredChefBookingsForUser(user, bookings),
          source: 'live',
        };
      }

      const storedBookings = getStoredChefBookingsForUser(user);
      if (storedBookings.length > 0) {
        return { ...data, bookings: storedBookings, source: 'local' };
      }

      return {
        ...data,
        bookings: ensureStoredChefBookingsForUser(user, previewChefBookings),
        source: 'preview',
      };
    } catch (error) {
      const storedBookings = getStoredChefBookingsForUser(user);
      if (storedBookings.length > 0) {
        return { bookings: storedBookings, source: 'local' };
      }

      return {
        bookings: ensureStoredChefBookingsForUser(user, previewChefBookings),
        source: 'preview',
      };
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
    const user = getStoredSessionUser();

    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        booking: updateStoredChefBookingStatusForUser(user, bookingId, status),
        message: `Booking status updated to ${status}`,
        source: 'local',
      };
    }

    try {
      const response = await api.patch(`/chef/bookings/${bookingId}/status`, { status });
      const data = unwrapResponse(response);
      updateStoredChefBookingStatusForUser(user, bookingId, status);
      return {
        ...data,
        source: 'live',
      };
    } catch (error) {
      const updatedBooking = updateStoredChefBookingStatusForUser(user, bookingId, status);
      if (updatedBooking) {
        return {
          booking: updatedBooking,
          message: `Booking status updated to ${status}`,
          source: 'local',
        };
      }

      throw error;
    }
  },

  getChefRecipes: async () => {
    const user = getStoredSessionUser();

    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 600));
      return { recipes: ensureStoredManagedRecipesForUser(user, previewRecipes.slice(0, 3)), source: 'preview' };
    }

    try {
      const response = await api.get('/chef/recipes');
      const data = unwrapResponse(response);
      const recipes = (data.recipes || []).map(normalizeRecipe);

      if (recipes.length > 0) {
        return {
          ...data,
          recipes: syncStoredManagedRecipesForUser(user, recipes),
          source: 'live',
        };
      }

      const storedRecipes = getStoredManagedRecipesForUser(user);
      if (storedRecipes.length > 0) {
        return {
          ...data,
          recipes: storedRecipes,
          source: 'local',
        };
      }

      return {
        ...data,
        recipes: ensureStoredManagedRecipesForUser(user, previewRecipes.slice(0, 3)),
        source: 'preview',
      };
    } catch (error) {
      const storedRecipes = getStoredManagedRecipesForUser(user);
      if (storedRecipes.length > 0) {
        return { recipes: storedRecipes, source: 'local' };
      }

      return {
        recipes: ensureStoredManagedRecipesForUser(user, previewRecipes.slice(0, 3)),
        source: 'preview',
      };
    }
  },

  addRecipe: async (recipeData) => {
    const user = getStoredSessionUser();

    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        recipe: upsertStoredManagedRecipeForUser(user, normalizeRecipe(recipeData)),
        source: 'local',
      };
    }

    try {
      const response = await api.post('/chef/recipes', recipeData);
      const data = unwrapResponse(response);
      if (data.recipe) {
        data.recipe = normalizeRecipe(data.recipe);
      }
      return {
        ...data,
        recipe: upsertStoredManagedRecipeForUser(user, data.recipe || normalizeRecipe(recipeData)),
        source: 'live',
      };
    } catch (error) {
      return {
        recipe: upsertStoredManagedRecipeForUser(user, normalizeRecipe(recipeData)),
        source: 'local',
      };
    }
  },

  deleteRecipe: async (recipeId) => {
    const user = getStoredSessionUser();

    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 500));
      deleteStoredManagedRecipeForUser(user, recipeId);
      return { message: 'Recipe deleted', source: 'local' };
    }

    try {
      const response = await api.delete(`/chef/recipes/${recipeId}`);
      deleteStoredManagedRecipeForUser(user, recipeId);
      return { ...unwrapResponse(response), source: 'live' };
    } catch (error) {
      deleteStoredManagedRecipeForUser(user, recipeId);
      return { message: 'Recipe deleted', source: 'local' };
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
    const user = getStoredSessionUser();

    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 600));
      return {
        ...(buildStoredChefAnalyticsForUser(user, previewAnalytics) || previewAnalytics),
        source: 'preview',
      };
    }

    try {
      const response = await api.get('/chef/analytics');
      const data = unwrapResponse(response);
      const hasLiveMetrics =
        Number(data.totalBookings || 0) > 0 ||
        Number(data.totalEarnings || 0) > 0 ||
        Number(data.completedBookings || 0) > 0;

      if (hasLiveMetrics) {
        return { ...data, source: 'live' };
      }

      const storedAnalytics = buildStoredChefAnalyticsForUser(user, previewAnalytics);
      return storedAnalytics
        ? { ...storedAnalytics, source: 'local' }
        : { ...previewAnalytics, source: 'preview' };
    } catch (error) {
      const storedAnalytics = buildStoredChefAnalyticsForUser(user, previewAnalytics);
      return storedAnalytics
        ? { ...storedAnalytics, source: 'local' }
        : { ...previewAnalytics, source: 'preview' };
    }
  },
};
