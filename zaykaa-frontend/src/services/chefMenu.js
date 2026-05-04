import api from './api';
import { previewMenuItems } from '../data/mockData';
import {
  deleteStoredChefMenuItemForUser,
  ensureStoredChefMenuForUser,
  getStoredSessionUser,
  getStoredChefMenuForUser,
  syncStoredChefMenuForUser,
  upsertStoredChefMenuItemForUser,
} from '../utils/chefStudioStorage';

const unwrapResponse = (response) => response?.data?.data ?? response?.data ?? {};

const normalizeFoodItem = (food = {}) => ({
  ...food,
  id: food.id || food.foodId || food._id || null,
  name: food.name || '',
  description: food.description || '',
  price: Number(food.price || 0),
  category: food.category || 'Main Course',
  image_url: food.image_url || food.imageUrl || food.image || '',
  image: food.image || food.image_url || food.imageUrl || '',
  views: Number(food.views || 0),
});

export const chefMenuService = {
  // Get my menu items
  getMyMenu: async () => {
    const user = getStoredSessionUser();

    try {
      const response = await api.get('/chef/menu');
      const data = unwrapResponse(response);
      const foods = (data.foods || data.menu || data.items || []).map(normalizeFoodItem);

      if (foods.length > 0) {
        return {
          ...data,
          foods: syncStoredChefMenuForUser(user, foods),
          source: 'live',
        };
      }

      const storedFoods = getStoredChefMenuForUser(user);
      if (storedFoods.length > 0) {
        return { ...data, foods: storedFoods, source: 'local' };
      }

      return {
        ...data,
        foods: ensureStoredChefMenuForUser(user, previewMenuItems),
        source: 'preview',
      };
    } catch (error) {
      const storedFoods = getStoredChefMenuForUser(user);
      if (storedFoods.length > 0) {
        return { foods: storedFoods, source: 'local' };
      }

      return {
        foods: ensureStoredChefMenuForUser(user, previewMenuItems),
        source: 'preview',
      };
    }
  },

  // Add food item
  addFoodItem: async (foodData) => {
    const user = getStoredSessionUser();

    try {
      const response = await api.post('/chef/menu', foodData);
      const data = unwrapResponse(response);
      const storedFood = upsertStoredChefMenuItemForUser(
        user,
        normalizeFoodItem(data.food || data.item || data.menuItem || foodData)
      );

      return {
        ...data,
        food: storedFood,
        source: 'live',
      };
    } catch (error) {
      const storedFood = upsertStoredChefMenuItemForUser(user, normalizeFoodItem(foodData));
      return {
        food: storedFood,
        source: 'local',
      };
    }
  },

  // Update food item
  updateFoodItem: async (foodId, foodData) => {
    const user = getStoredSessionUser();

    try {
      const response = await api.put(`/chef/menu/${foodId}`, foodData);
      const data = unwrapResponse(response);
      const storedFood = upsertStoredChefMenuItemForUser(
        user,
        normalizeFoodItem(data.food || data.item || data.menuItem || { ...foodData, id: foodId }),
        foodId
      );

      return {
        ...data,
        food: storedFood,
        source: 'live',
      };
    } catch (error) {
      const storedFood = upsertStoredChefMenuItemForUser(
        user,
        normalizeFoodItem({ ...foodData, id: foodId }),
        foodId
      );
      return {
        food: storedFood,
        source: 'local',
      };
    }
  },

  // Delete food item
  deleteFoodItem: async (foodId) => {
    const user = getStoredSessionUser();

    try {
      const response = await api.delete(`/chef/menu/${foodId}`);
      deleteStoredChefMenuItemForUser(user, foodId);
      return {
        ...unwrapResponse(response),
        source: 'live',
      };
    } catch (error) {
      deleteStoredChefMenuItemForUser(user, foodId);
      return {
        message: 'Menu item deleted locally',
        source: 'local',
      };
    }
  },

  // Get specific chef's menu
  getChefMenu: async (chefId) => {
    try {
      const response = await api.get(`/chefs/${chefId}/menu`);
      const data = unwrapResponse(response);
      return {
        ...data,
        foods: (data.foods || data.menu || data.items || []).map(normalizeFoodItem),
      };
    } catch (error) {
      throw error;
    }
  },

  // Get all chef menus
  getAllChefMenus: async () => {
    try {
      const response = await api.get('/all-chef-menus');
      const data = unwrapResponse(response);
      return {
        ...data,
        menus: data.menus || data.items || [],
      };
    } catch (error) {
      throw error;
    }
  },
};
