import api from './api';

const unwrapResponse = (response) => response?.data?.data ?? response?.data ?? {};

export const paymentService = {
  initiatePayment: async (payload) => {
    const response = await api.post('/payments', payload);
    return unwrapResponse(response);
  },

  verifyPayment: async (paymentId, payload) => {
    const response = await api.post(`/payments/${paymentId}/verify`, payload);
    return unwrapResponse(response);
  },

  refundPayment: async (paymentId, payload) => {
    const response = await api.post(`/payments/${paymentId}/refund`, payload);
    return unwrapResponse(response);
  },

  getMyPayments: async (params = {}) => {
    const response = await api.get('/payments/my', { params });
    return unwrapResponse(response);
  },

  getPaymentById: async (paymentId) => {
    const response = await api.get(`/payments/${paymentId}`);
    return unwrapResponse(response);
  },

  getPaymentsByOrder: async (orderId) => {
    const response = await api.get(`/payments/order/${orderId}`);
    return unwrapResponse(response);
  },

  getPaymentRefunds: async (paymentId) => {
    const response = await api.get(`/payments/${paymentId}/refunds`);
    return unwrapResponse(response);
  },

  getPaymentEvents: async (paymentId) => {
    const response = await api.get(`/payments/${paymentId}/events`);
    return unwrapResponse(response);
  },

  createPayout: async (payload) => {
    const response = await api.post('/payouts', payload);
    return unwrapResponse(response);
  },

  getPayouts: async (params = {}) => {
    const response = await api.get('/payouts', { params });
    return unwrapResponse(response);
  },

  getPayoutById: async (payoutId) => {
    const response = await api.get(`/payouts/${payoutId}`);
    return unwrapResponse(response);
  },
};
