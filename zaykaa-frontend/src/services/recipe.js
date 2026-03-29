import api from './api';

const unwrapResponse = (response) => response?.data?.data ?? response?.data ?? {};

const normalizePrice = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeIngredient = (ingredient = {}) => ({
  ...ingredient,
  name: ingredient.name || ingredient.ingredient_name || '',
  quantity:
    ingredient.quantity && ingredient.unit
      ? `${ingredient.quantity} ${ingredient.unit}`.trim()
      : ingredient.quantity || '',
});

const normalizeStep = (step = {}, index = 0) => ({
  ...step,
  stepNumber: step.stepNumber ?? step.step_number ?? index + 1,
  instruction: step.instruction || step.text || '',
});

const normalizeRecipe = (recipe = {}) => ({
  ...recipe,
  title: recipe.title || recipe.name || '',
  name: recipe.name || recipe.title || '',
  authorName: recipe.authorName || recipe.contributorName || recipe.chefName || 'Zaykaa Contributor',
  authorRole: recipe.authorRole || recipe.contributorRole || 'chef',
  image: recipe.image || recipe.imageUrl || null,
  imageUrl: recipe.imageUrl || recipe.image || null,
  cookingTimeMinutes:
    recipe.cookingTimeMinutes ?? recipe.cookTimeMinutes ?? recipe.preparationTimeMinutes ?? 0,
  preparationTime:
    recipe.preparationTime ||
    `${recipe.cookingTimeMinutes ?? recipe.cookTimeMinutes ?? recipe.preparationTimeMinutes ?? 0} mins`,
  servings: recipe.servings ?? 1,
  price: normalizePrice(recipe.price),
  originState: recipe.originState || recipe.origin_state || '',
  originRegion: recipe.originRegion || recipe.origin_region || '',
  isAuthenticRegionalSpecialty:
    recipe.isAuthenticRegionalSpecialty ??
    recipe.is_authentic_regional ??
    Boolean(recipe.authenticityTag),
  authenticityTag:
    recipe.authenticityTag ||
    (recipe.isAuthenticRegionalSpecialty || recipe.is_authentic_regional
      ? 'Authentic Regional Specialty'
      : null),
  ingredients: (Array.isArray(recipe.ingredients) ? recipe.ingredients : []).map(normalizeIngredient),
  steps: (Array.isArray(recipe.steps) ? recipe.steps : []).map(normalizeStep),
  views: recipe.views ?? recipe.views_count ?? 0,
});

export const recipeService = {
  getPublicRecipes: async (filters = {}) => {
    const response = await api.get('/v1/recipes', { params: filters });
    const data = unwrapResponse(response);
    return {
      ...data,
      recipes: (data.recipes || []).map(normalizeRecipe),
    };
  },

  getRecipe: async (recipeId) => {
    const response = await api.get(`/v1/recipes/${recipeId}`);
    const data = unwrapResponse(response);
    if (data.recipe) {
      data.recipe = normalizeRecipe(data.recipe);
    }
    return data;
  },

  getMyRecipes: async () => {
    const response = await api.get('/v1/recipes/manage');
    const data = unwrapResponse(response);
    return {
      ...data,
      recipes: (data.recipes || []).map(normalizeRecipe),
    };
  },

  createRecipe: async (payload) => {
    const response = await api.post('/v1/recipes/manage', payload);
    const data = unwrapResponse(response);
    if (data.recipe) {
      data.recipe = normalizeRecipe(data.recipe);
    }
    return data;
  },

  updateRecipe: async (recipeId, payload) => {
    const response = await api.put(`/v1/recipes/manage/${recipeId}`, payload);
    const data = unwrapResponse(response);
    if (data.recipe) {
      data.recipe = normalizeRecipe(data.recipe);
    }
    return data;
  },

  deleteRecipe: async (recipeId) => {
    const response = await api.delete(`/v1/recipes/manage/${recipeId}`);
    return unwrapResponse(response);
  },
};
