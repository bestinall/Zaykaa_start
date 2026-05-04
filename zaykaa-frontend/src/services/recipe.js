import api from './api';
import {
  deleteStoredManagedRecipeForUser,
  getStoredPublicManagedRecipes,
  getStoredSessionUser,
  getStoredManagedRecipesForUser,
  syncStoredManagedRecipesForUser,
  upsertStoredManagedRecipeForUser,
} from '../utils/chefStudioStorage';

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

const matchesRecipeFilters = (recipe = {}, filters = {}) => {
  const searchQuery = String(filters.q || '').trim().toLowerCase();
  const category = String(filters.category || '').trim();
  const state = String(filters.state || '').trim();
  const region = String(filters.region || '').trim();

  const searchableText = [
    recipe.title,
    recipe.name,
    recipe.description,
    recipe.authorName,
    recipe.originState,
    recipe.originRegion,
    recipe.category,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (searchQuery && !searchableText.includes(searchQuery)) {
    return false;
  }

  if (category && recipe.category !== category) {
    return false;
  }

  if (state && recipe.originState !== state) {
    return false;
  }

  if (region && recipe.originRegion !== region) {
    return false;
  }

  return true;
};

const mergeRecipes = (...recipeCollections) => {
  const recipeMap = new Map();

  recipeCollections.flat().forEach((recipe) => {
    const normalizedRecipe = normalizeRecipe(recipe);
    const recipeKey = normalizedRecipe.id || normalizedRecipe.title || normalizedRecipe.name;

    if (recipeKey) {
      recipeMap.set(String(recipeKey), normalizedRecipe);
    }
  });

  return Array.from(recipeMap.values());
};

export const recipeService = {
  getPublicRecipes: async (filters = {}) => {
    const storedRecipes = getStoredPublicManagedRecipes()
      .map(normalizeRecipe)
      .filter((recipe) => matchesRecipeFilters(recipe, filters));

    try {
      const response = await api.get('/v1/recipes', { params: filters });
      const data = unwrapResponse(response);
      return {
        ...data,
        recipes: mergeRecipes((data.recipes || []).map(normalizeRecipe), storedRecipes),
      };
    } catch (error) {
      return {
        recipes: storedRecipes,
        source: storedRecipes.length > 0 ? 'local' : 'empty',
      };
    }
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
    const user = getStoredSessionUser();

    try {
      const response = await api.get('/v1/recipes/manage');
      const data = unwrapResponse(response);
      const recipes = (data.recipes || []).map(normalizeRecipe);

      if (recipes.length > 0) {
        return {
          ...data,
          recipes: syncStoredManagedRecipesForUser(user, recipes),
          source: 'live',
        };
      }

      return {
        ...data,
        recipes: getStoredManagedRecipesForUser(user),
        source: 'local',
      };
    } catch (error) {
      return {
        recipes: getStoredManagedRecipesForUser(user),
        source: 'local',
      };
    }
  },

  createRecipe: async (payload) => {
    const user = getStoredSessionUser();

    try {
      const response = await api.post('/v1/recipes/manage', payload);
      const data = unwrapResponse(response);
      const normalizedRecipe = normalizeRecipe(data.recipe || payload);

      return {
        ...data,
        recipe: upsertStoredManagedRecipeForUser(user, normalizedRecipe),
        source: 'live',
      };
    } catch (error) {
      return {
        recipe: upsertStoredManagedRecipeForUser(user, normalizeRecipe(payload)),
        source: 'local',
      };
    }
  },

  updateRecipe: async (recipeId, payload) => {
    const user = getStoredSessionUser();

    try {
      const response = await api.put(`/v1/recipes/manage/${recipeId}`, payload);
      const data = unwrapResponse(response);
      const normalizedRecipe = normalizeRecipe(data.recipe || { ...payload, id: recipeId });

      return {
        ...data,
        recipe: upsertStoredManagedRecipeForUser(user, normalizedRecipe, recipeId),
        source: 'live',
      };
    } catch (error) {
      return {
        recipe: upsertStoredManagedRecipeForUser(
          user,
          normalizeRecipe({ ...payload, id: recipeId }),
          recipeId
        ),
        source: 'local',
      };
    }
  },

  deleteRecipe: async (recipeId) => {
    const user = getStoredSessionUser();

    try {
      const response = await api.delete(`/v1/recipes/manage/${recipeId}`);
      deleteStoredManagedRecipeForUser(user, recipeId);
      return { ...unwrapResponse(response), source: 'live' };
    } catch (error) {
      deleteStoredManagedRecipeForUser(user, recipeId);
      return {
        message: 'Recipe deleted locally',
        source: 'local',
      };
    }
  },
};
