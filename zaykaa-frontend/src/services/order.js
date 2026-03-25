import api from './api';

const MOCK_MODE = false;

const unwrapResponse = (response) => response?.data?.data ?? response?.data ?? {};

const normalizeRestaurant = (restaurant = {}) => ({
  ...restaurant,
  reviews: restaurant.reviews ?? restaurant.reviewsCount ?? 0,
  dishes: restaurant.dishes || restaurant.menu || [],
});

const normalizeOrder = (order = {}) => ({
  ...order,
  totalAmount: order.totalAmount ?? order.amount ?? 0,
  items: order.items || [],
  statusHistory: order.statusHistory || [],
});

export const orderService = {
  getRestaurants: async (filters = {}) => {
    if (MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return { restaurants: [] };
    }

    try {
      const response = await api.get('/restaurants', { params: filters });
      const data = unwrapResponse(response);
      return {
        ...data,
        restaurants: (data.restaurants || []).map(normalizeRestaurant),
      };
    } catch (error) {
      throw error;
    }
  },

  getRestaurantDetails: async (restaurantId) => {
    if (MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { restaurant: {} };
    }

    try {
      const response = await api.get(`/restaurants/${restaurantId}`);
      const data = unwrapResponse(response);
      if (data.restaurant) {
        data.restaurant = normalizeRestaurant(data.restaurant);
      }
      return data;
    } catch (error) {
      throw error;
    }
  },

  getCart: async () => {
    if (MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { cart: { items: [] } };
    }

    try {
      const response = await api.get('/orders/cart');
      return unwrapResponse(response);
    } catch (error) {
      throw error;
    }
  },

  saveCart: async (cartData) => {
    if (MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { cart: cartData };
    }

    try {
      const response = await api.put('/orders/cart', cartData);
      return unwrapResponse(response);
    } catch (error) {
      throw error;
    }
  },

  clearCart: async () => {
    if (MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { cart: { items: [] } };
    }

    try {
      const response = await api.delete('/orders/cart');
      return unwrapResponse(response);
    } catch (error) {
      throw error;
    }
  },

  validateCoupon: async (payload) => {
    if (MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { coupon: null };
    }

    try {
      const response = await api.post('/coupons/validate', payload);
      return unwrapResponse(response);
    } catch (error) {
      throw error;
    }
  },

  createOrder: async (orderData) => {
    if (MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return {
        order: normalizeOrder({ id: Date.now(), ...orderData, status: 'confirmed' }),
      };
    }

    try {
      const response = await api.post('/orders', orderData);
      const data = unwrapResponse(response);
      if (data.order) {
        data.order = normalizeOrder(data.order);
      }
      return data;
    } catch (error) {
      throw error;
    }
  },

  getUserOrders: async () => {
    if (MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return { orders: [] };
    }

    try {
      const response = await api.get('/orders/my');
      const data = unwrapResponse(response);
      return {
        ...data,
        orders: (data.orders || []).map(normalizeOrder),
      };
    } catch (error) {
      throw error;
    }
  },

  getRecentOrders: async () => {
    if (MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return { orders: [] };
    }

    try {
      const response = await api.get('/orders/recent');
      const data = unwrapResponse(response);
      return {
        ...data,
        orders: (data.orders || []).map(normalizeOrder),
      };
    } catch (error) {
      throw error;
    }
  },

  getOrderDetails: async (orderId) => {
    if (MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return { order: {} };
    }

    try {
      const response = await api.get(`/orders/${orderId}`);
      const data = unwrapResponse(response);
      if (data.order) {
        data.order = normalizeOrder(data.order);
      }
      return data;
    } catch (error) {
      throw error;
    }
  },

  trackOrder: async (orderId) => {
    if (MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return { tracking: { status: 'confirmed' } };
    }

    try {
      const response = await api.get(`/orders/${orderId}/track`);
      return unwrapResponse(response);
    } catch (error) {
      throw error;
    }
  },

  cancelOrder: async (orderId, reason) => {
    if (MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { message: 'Order cancelled successfully' };
    }

    try {
      const response = await api.patch(`/orders/${orderId}/cancel`, { reason });
      const data = unwrapResponse(response);
      if (data.order) {
        data.order = normalizeOrder(data.order);
      }
      return data;
    } catch (error) {
      throw error;
    }
  },
};
