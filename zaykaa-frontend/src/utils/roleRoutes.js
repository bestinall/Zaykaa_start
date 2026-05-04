export const isFoodLoverRole = (role) => role === 'user';

export const getHomeRouteForRole = (role) => (role === 'chef' ? '/chef-dashboard' : '/dashboard');
