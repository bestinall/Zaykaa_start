import api from './api';
import { bookingService } from './booking';
import { recipeService } from './recipe';

const unwrapResponse = (response) => response?.data?.data ?? response?.data ?? {};

const roleHeadlines = {
  seller: 'Publishes regional dishes that food lovers can discover instantly.',
  agent: 'Supports smoother order handoffs and last-mile delivery operations.',
  vlogger: 'Shares creator-led food stories, collaborations, and culinary features.',
};

const normalizeMember = (member = {}) => {
  const role = member.role || 'member';
  const nativeState = member.nativeState || member.native_state || '';
  const nativeRegion = member.nativeRegion || member.native_region || '';
  const locationLabel =
    member.locationLabel ||
    [nativeRegion, nativeState].filter(Boolean).join(', ') ||
    'Region shared after onboarding';

  return {
    ...member,
    name: member.name || member.fullName || member.full_name || '',
    fullName: member.fullName || member.full_name || member.name || '',
    role,
    nativeState,
    nativeRegion,
    locationLabel,
    headline: member.headline || roleHeadlines[role] || 'Part of the Zaykaa food network.',
    joinedAt: member.joinedAt || member.created_at || null,
    updatedAt: member.updatedAt || member.updated_at || null,
    lastSeenAt: member.lastSeenAt || member.last_login_at || null,
  };
};

export const communityService = {
  getDirectoryMembers: async (filters = {}) => {
    const response = await api.get('/v1/users/directory', { params: filters });
    const data = unwrapResponse(response);
    return {
      ...data,
      members: (data.members || []).map(normalizeMember),
    };
  },

  getFoodNetworkFeed: async () => {
    const [chefResponse, recipeResponse, memberResponse] = await Promise.all([
      bookingService.getAvailableChefs({ limit: 3, sort: 'recent' }),
      recipeService.getPublicRecipes({ limit: 3, sort: 'recent' }),
      communityService.getDirectoryMembers({
        limit: 4,
        roles: 'seller,agent,vlogger',
        sort: 'recent',
      }),
    ]);

    return {
      chefs: chefResponse.chefs || [],
      recipes: recipeResponse.recipes || [],
      members: memberResponse.members || [],
    };
  },
};
