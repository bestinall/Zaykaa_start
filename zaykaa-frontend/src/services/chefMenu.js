// src/services/chefMenu.js
import api from './api';

export const chefMenuService = {
  // Get my menu items
  getMyMenu: async () => {
    try {
      const response = await api.get('/chef/menu');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Add food item
  addFoodItem: async (foodData) => {
    try {
      const response = await api.post('/chef/menu', foodData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update food item
  updateFoodItem: async (foodId, foodData) => {
    try {
      const response = await api.put(`/chef/menu/${foodId}`, foodData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete food item
  deleteFoodItem: async (foodId) => {
    try {
      const response = await api.delete(`/chef/menu/${foodId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get specific chef's menu
  getChefMenu: async (chefId) => {
    try {
      const response = await api.get(`/chefs/${chefId}/menu`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get all chef menus
  getAllChefMenus: async () => {
    try {
      const response = await api.get('/all-chef-menus');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
