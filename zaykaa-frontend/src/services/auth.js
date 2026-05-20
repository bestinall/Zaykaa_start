import api from './api';

const MOCK_MODE = false;

const unwrapResponse = (response) => response?.data?.data ?? response?.data ?? {};

const normalizeUser = (user = {}) => ({
  ...user,
  name: user.name || user.full_name || user.displayName || '',
  nativeState: user.nativeState || user.native_state || '',
  nativeRegion: user.nativeRegion || user.native_region || '',
});

export const authService = {
  register: async (userData) => {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        message: 'Registration successful',
        user: normalizeUser(userData),
      };
    }

    try {
      const payload = {
        ...userData,
        full_name: userData.full_name || userData.name,
        native_state: userData.native_state || userData.nativeState,
        native_region: userData.native_region || userData.nativeRegion,
      };
      delete payload.name;
      delete payload.nativeState;
      delete payload.nativeRegion;
      const response = await api.post('/auth/register', payload);
      const data = unwrapResponse(response);
      if (data.user) {
        data.user = normalizeUser(data.user);
      }
      return data;
    } catch (error) {
      throw error;
    }
  },

  login: async (email, password) => {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        token: 'mock-token',
        user: { id: 1, email, name: 'Test User', role: 'user' },
      };
    }

    try {
      const response = await api.post('/auth/login', { email, password });
      const data = unwrapResponse(response);
      if (data.user) {
        data.user = normalizeUser(data.user);
      }
      return data;
    } catch (error) {
      throw error;
    }
  },

  logout: async () => {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return { message: 'Logged out' };
    }

    try {
      const response = await api.post('/auth/logout');
      return unwrapResponse(response);
    } catch (error) {
      throw error;
    }
  },

  verifyToken: async () => {
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return { valid: true };
    }

    try {
      const response = await api.get('/auth/verify');
      const data = unwrapResponse(response);
      if (data.user) {
        data.user = normalizeUser(data.user);
      }
      return data;
    } catch (error) {
      throw error;
    }
  },
};
