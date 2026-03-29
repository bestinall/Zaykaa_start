import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import Header from '../components/Common/Header';
import SmartImage from '../components/ui/SmartImage';
import PageTransition from '../components/ui/PageTransition';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import FloatingInput from '../components/ui/FloatingInput';
import Modal from '../components/ui/Modal';
import SectionHeader from '../components/ui/SectionHeader';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { previewRecipes } from '../data/mockData';
import { recipeService } from '../services/recipe';
import { formatCurrency, humanize } from '../utils/display';

const BASE_CATEGORY_OPTIONS = ['Veg', 'Non-Veg', 'Dessert', 'Breakfast', 'Lunch', 'Dinner', 'Main Course'];
const ALL_CATEGORIES = 'All';
const ALL_STATES = 'All states';
const ALL_REGIONS = 'All regions';
const textareaClass =
  'min-h-[120px] w-full rounded-[1.5rem] border border-white/60 bg-white/80 px-4 py-4 text-sm text-slate-900 shadow-soft outline-none transition placeholder:text-slate-400 focus:border-brand/50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500';

const createEmptyRecipeForm = () => ({
  title: '',
  description: '',
  category: 'Veg',
  cookingTimeMinutes: '30',
  servings: '2',
  price: '',
  image: '',
  isPublic: true,
  ingredients: [{ name: '', quantity: '' }],
  steps: [''],
});

const getOriginLabel = (recipe) =>
  [recipe.originRegion, recipe.originState].filter(Boolean).join(', ') || 'Profile-linked origin';

const mapRecipeToForm = (recipe) => ({
  title: recipe.title || recipe.name || '',
  description: recipe.description || '',
  category: recipe.category || 'Veg',
  cookingTimeMinutes: String(recipe.cookingTimeMinutes || recipe.cookTimeMinutes || 0),
  servings: String(recipe.servings || 1),
  price: recipe.price === null || recipe.price === undefined ? '' : String(recipe.price),
  image: recipe.imageUrl || recipe.image || '',
  isPublic: recipe.isPublic ?? true,
  ingredients:
    recipe.ingredients?.length > 0
      ? recipe.ingredients.map((ingredient) => ({
          name: ingredient.name || ingredient.ingredient_name || '',
          quantity:
            ingredient.quantity && ingredient.unit
              ? `${ingredient.quantity} ${ingredient.unit}`.trim()
              : ingredient.quantity || '',
        }))
      : [{ name: '', quantity: '' }],
  steps:
    recipe.steps?.length > 0
      ? recipe.steps.map((step) => step.instruction || '')
      : [''],
});

const buildRecipePayload = (formData) => {
  const cookingTimeMinutes = Number(formData.cookingTimeMinutes || 0);
  const payload = {
    title: formData.title,
    description: formData.description,
    category: formData.category,
    cookingTimeMinutes,
    cookTimeMinutes: cookingTimeMinutes,
    preparationTime: `${cookingTimeMinutes} mins`,
    servings: Number(formData.servings || 1),
    isPublic: formData.isPublic,
    ingredients: formData.ingredients
      .filter((ingredient) => ingredient.name.trim())
      .map((ingredient, index) => ({
        name: ingredient.name.trim(),
        quantity: ingredient.quantity.trim(),
        sortOrder: index + 1,
      })),
    steps: formData.steps
      .map((step) => step.trim())
      .filter(Boolean)
      .map((instruction, index) => ({
        stepNumber: index + 1,
        instruction,
      })),
  };
  if (formData.image.trim()) {
    payload.image = formData.image.trim();
  }
  if (formData.price.trim()) {
    payload.price = formData.price.trim();
  }
  return payload;
};

const RecipeCard = ({ recipe, onView, action }) => (
  <Card hover={false} className="overflow-hidden p-0">
    <div className="relative h-48">
      {recipe.image ? (
        <SmartImage src={recipe.image} alt={recipe.title} className="h-full w-full" />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-orange-200 via-amber-100 to-rose-200 dark:from-orange-500/20 dark:via-amber-500/10 dark:to-rose-500/20" />
      )}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
        <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-900 backdrop-blur">
          {recipe.category}
        </span>
        <span className="rounded-full bg-slate-950/75 px-3 py-1 text-xs font-medium text-white backdrop-blur">
          {humanize(recipe.authorRole || 'chef')}
        </span>
      </div>
    </div>
    <div className="space-y-5 p-5">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{recipe.authorName}</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{getOriginLabel(recipe)}</p>
        <h3 className="mt-2 font-display text-3xl text-slate-950 dark:text-white">{recipe.title}</h3>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{recipe.description}</p>
        {recipe.authenticityTag ? (
          <div className="mt-4 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
            {recipe.authenticityTag}
          </div>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm xl:grid-cols-4">
        <div className="rounded-[1.25rem] bg-slate-900/5 px-3 py-3 dark:bg-white/5">
          <p className="text-slate-500 dark:text-slate-400">Time</p>
          <p className="mt-1 font-semibold text-slate-950 dark:text-white">{recipe.cookingTimeMinutes || 0} mins</p>
        </div>
        <div className="rounded-[1.25rem] bg-slate-900/5 px-3 py-3 dark:bg-white/5">
          <p className="text-slate-500 dark:text-slate-400">Servings</p>
          <p className="mt-1 font-semibold text-slate-950 dark:text-white">{recipe.servings}</p>
        </div>
        <div className="rounded-[1.25rem] bg-slate-900/5 px-3 py-3 dark:bg-white/5">
          <p className="text-slate-500 dark:text-slate-400">State</p>
          <p className="mt-1 font-semibold text-slate-950 dark:text-white">{recipe.originState || 'Linked'}</p>
        </div>
        <div className="rounded-[1.25rem] bg-slate-900/5 px-3 py-3 dark:bg-white/5">
          <p className="text-slate-500 dark:text-slate-400">{recipe.price !== null ? 'Price' : 'Views'}</p>
          <p className="mt-1 font-semibold text-slate-950 dark:text-white">
            {recipe.price !== null ? formatCurrency(recipe.price) : recipe.views || 0}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="secondary" onClick={() => onView(recipe)}>
          View dish
        </Button>
        {action}
      </div>
    </div>
  </Card>
);

const RecipeBook = () => {
  const { user } = useAuth();
  const toast = useToast();
  const canManage = user?.role === 'chef' || user?.role === 'seller';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);
  const [selectedState, setSelectedState] = useState(ALL_STATES);
  const [selectedRegion, setSelectedRegion] = useState(ALL_REGIONS);
  const [publicRecipes, setPublicRecipes] = useState([]);
  const [myRecipes, setMyRecipes] = useState([]);
  const [publicLoading, setPublicLoading] = useState(true);
  const [manageLoading, setManageLoading] = useState(canManage);
  const [publicPreviewMode, setPublicPreviewMode] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState(null);
  const [formData, setFormData] = useState(createEmptyRecipeForm());
  const [submitting, setSubmitting] = useState(false);
  const deferredSearch = useDeferredValue(searchTerm);
  const profileOrigin = [user?.nativeRegion || user?.native_region, user?.nativeState || user?.native_state]
    .filter(Boolean)
    .join(', ');

  const loadMyRecipes = useCallback(async () => {
    if (!canManage) {
      setMyRecipes([]);
      setManageLoading(false);
      return;
    }
    setManageLoading(true);
    try {
      const response = await recipeService.getMyRecipes();
      setMyRecipes(response.recipes || []);
    } catch (error) {
      setMyRecipes([]);
      toast.info('Recipe management unavailable', 'We could not load your recipe workspace right now.');
    } finally {
      setManageLoading(false);
    }
  }, [canManage, toast]);

  useEffect(() => {
    let active = true;
    const loadPublicRecipes = async () => {
      setPublicLoading(true);
      try {
        const response = await recipeService.getPublicRecipes({
          q: deferredSearch.trim() || undefined,
          category: selectedCategory !== ALL_CATEGORIES ? selectedCategory : undefined,
          state: selectedState !== ALL_STATES ? selectedState : undefined,
          region: selectedRegion !== ALL_REGIONS ? selectedRegion : undefined,
        });
        if (!active) {
          return;
        }
        setPublicRecipes(response.recipes || []);
        setPublicPreviewMode(false);
      } catch (error) {
        if (!active) {
          return;
        }
        const filteredPreview = previewRecipes.filter((recipe) => {
          const matchesSearch =
            !deferredSearch.trim() ||
            recipe.title.toLowerCase().includes(deferredSearch.trim().toLowerCase());
          const matchesCategory =
            selectedCategory === ALL_CATEGORIES || recipe.category === selectedCategory;
          const matchesState =
            selectedState === ALL_STATES || recipe.originState === selectedState;
          const matchesRegion =
            selectedRegion === ALL_REGIONS || recipe.originRegion === selectedRegion;
          return matchesSearch && matchesCategory && matchesState && matchesRegion;
        });
        setPublicRecipes(filteredPreview);
        setPublicPreviewMode(true);
      } finally {
        if (active) {
          setPublicLoading(false);
        }
      }
    };

    loadPublicRecipes();
    return () => {
      active = false;
    };
  }, [deferredSearch, selectedCategory, selectedRegion, selectedState]);

  useEffect(() => {
    loadMyRecipes();
  }, [loadMyRecipes]);

  const categoryOptions = useMemo(() => {
    const categories = new Set(BASE_CATEGORY_OPTIONS);
    [...publicRecipes, ...myRecipes, ...previewRecipes].forEach((recipe) => {
      if (recipe.category) {
        categories.add(recipe.category);
      }
    });
    return [ALL_CATEGORIES, ...Array.from(categories)];
  }, [myRecipes, publicRecipes]);

  const stateOptions = useMemo(() => {
    const states = new Set();
    [...publicRecipes, ...myRecipes, ...previewRecipes].forEach((recipe) => {
      if (recipe.originState) {
        states.add(recipe.originState);
      }
    });
    return [ALL_STATES, ...Array.from(states)];
  }, [myRecipes, publicRecipes]);

  const regionOptions = useMemo(() => {
    const regions = new Set();
    [...publicRecipes, ...myRecipes, ...previewRecipes].forEach((recipe) => {
      const matchesState = selectedState === ALL_STATES || recipe.originState === selectedState;
      if (matchesState && recipe.originRegion) {
        regions.add(recipe.originRegion);
      }
    });
    return [ALL_REGIONS, ...Array.from(regions)];
  }, [myRecipes, publicRecipes, selectedState]);

  const openCreateModal = () => {
    setEditingRecipeId(null);
    setFormData(createEmptyRecipeForm());
    setModalOpen(true);
  };

  const openEditModal = (recipe) => {
    setEditingRecipeId(recipe.id);
    setFormData(mapRecipeToForm(recipe));
    setModalOpen(true);
  };

  const updateIngredient = (index, field, value) => {
    setFormData((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredient, ingredientIndex) =>
        ingredientIndex === index ? { ...ingredient, [field]: value } : ingredient
      ),
    }));
  };

  const updateStep = (index, value) => {
    setFormData((current) => ({
      ...current,
      steps: current.steps.map((step, stepIndex) => (stepIndex === index ? value : step)),
    }));
  };

  const refreshPublicRecipes = async () => {
    const response = await recipeService.getPublicRecipes({
      q: deferredSearch.trim() || undefined,
      category: selectedCategory !== ALL_CATEGORIES ? selectedCategory : undefined,
      state: selectedState !== ALL_STATES ? selectedState : undefined,
      region: selectedRegion !== ALL_REGIONS ? selectedRegion : undefined,
    });
    setPublicRecipes(response.recipes || []);
    setPublicPreviewMode(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (user?.role === 'seller' && !formData.price.trim()) {
      toast.error('Price required', 'Seller listings need a selling price before they can be published.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = buildRecipePayload(formData);
      if (editingRecipeId) {
        await recipeService.updateRecipe(editingRecipeId, payload);
        toast.success('Dish updated', 'Your changes are now live in the Recipe Book.');
      } else {
        await recipeService.createRecipe(payload);
        toast.success('Dish published', 'Your regional dish is now part of the Recipe Book.');
      }
      setModalOpen(false);
      setEditingRecipeId(null);
      setFormData(createEmptyRecipeForm());
      await loadMyRecipes();
      await refreshPublicRecipes();
    } catch (error) {
      const message = error.response?.data?.message || 'Please review the recipe fields and try again.';
      toast.error('Unable to save dish', message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (recipe) => {
    const confirmed = window.confirm(`Delete "${recipe.title}" from your recipe book?`);
    if (!confirmed) {
      return;
    }
    try {
      await recipeService.deleteRecipe(recipe.id);
      toast.success('Dish deleted', 'The dish has been removed from your collection.');
      await loadMyRecipes();
      setPublicRecipes((current) => current.filter((item) => item.id !== recipe.id));
      if (selectedRecipe?.id === recipe.id) {
        setSelectedRecipe(null);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'The dish could not be deleted right now.';
      toast.error('Delete failed', message);
    }
  };

  return (
    <PageTransition className="app-shell">
      <Header />
      <div className="content-shell space-y-8">
        <Card hover={false} className="overflow-hidden p-0">
          <div className="grid gap-6 bg-hero-wash p-8 dark:bg-hero-wash-dark lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Recipe book</p>
              <h1 className="mt-4 max-w-3xl font-display text-5xl leading-tight text-slate-950 dark:text-white">
                Discover regional dishes from chefs and sellers, complete with authentic preparation details.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">
                Browse food stories by state, category, and contributor. Every published dish carries
                ingredients, step-by-step preparation, and a region linked to the creator profile.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.75rem] border border-white/60 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5">
                <p className="text-sm text-slate-500 dark:text-slate-400">Recipes visible</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{publicRecipes.length}</p>
              </div>
              <div className="rounded-[1.75rem] border border-white/60 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5">
                <p className="text-sm text-slate-500 dark:text-slate-400">States featured</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{stateOptions.length - 1}</p>
              </div>
              <div className="rounded-[1.75rem] border border-white/60 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5">
                <p className="text-sm text-slate-500 dark:text-slate-400">Contributor access</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">
                  {canManage ? 'Enabled' : 'Browse'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card hover={false}>
          <SectionHeader
            eyebrow="Explore regional dishes"
            title="Search food by name, category, and origin"
            description="Public dishes from chefs and food sellers are grouped here so every visitor can explore authentic preparation details."
          />
          <div className="mt-8 grid gap-4 xl:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
            <FloatingInput
              label="Search dishes by name"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="rounded-[1.5rem] border border-white/60 bg-white/80 px-4 py-4 text-sm text-slate-900 shadow-soft outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select
              value={selectedState}
              onChange={(event) => {
                setSelectedState(event.target.value);
                setSelectedRegion(ALL_REGIONS);
              }}
              className="rounded-[1.5rem] border border-white/60 bg-white/80 px-4 py-4 text-sm text-slate-900 shadow-soft outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              {stateOptions.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            <select
              value={selectedRegion}
              onChange={(event) => setSelectedRegion(event.target.value)}
              className="rounded-[1.5rem] border border-white/60 bg-white/80 px-4 py-4 text-sm text-slate-900 shadow-soft outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              {regionOptions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
          {publicPreviewMode && (
            <div className="mt-6 rounded-[1.5rem] border border-brand/20 bg-brand/10 px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
              Showing sample regional dishes because the live feed is unavailable right now.
            </div>
          )}
          <div className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {publicLoading ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading recipes...</p>
            ) : publicRecipes.length > 0 ? (
              publicRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} onView={setSelectedRecipe} />
              ))
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No dishes matched your current search, category, state, or region filters.
              </p>
            )}
          </div>
        </Card>

        {canManage && (
          <Card hover={false}>
            <SectionHeader
              eyebrow="Contributor studio"
              title="Manage your regional dishes"
              description="Chefs and sellers can publish, edit, or remove dishes while keeping preparation details tied to their regional identity."
              action={
                <Button type="button" onClick={openCreateModal}>
                  Add regional dish
                </Button>
              }
            />
            <div className="mt-6 rounded-[1.5rem] border border-brand/20 bg-brand/10 px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
              Origin is linked automatically from your contributor profile{profileOrigin ? `: ${profileOrigin}.` : '.'}
            </div>
            <div className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
              {manageLoading ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Loading your dishes...</p>
              ) : myRecipes.length > 0 ? (
                myRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onView={setSelectedRecipe}
                    action={
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="ghost" onClick={() => openEditModal(recipe)}>
                          Edit
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => handleDelete(recipe)}>
                          Delete
                        </Button>
                      </div>
                    }
                  />
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  You have not published a regional dish yet. Start with one of your signature specialties.
                </p>
              )}
            </div>
          </Card>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRecipeId ? 'Edit regional dish' : 'Add a new regional dish'}
        description="Capture the dish, ingredient list, and full traditional cooking method so others can learn how it is made."
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-[1.5rem] border border-brand/20 bg-brand/10 px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
            Your dish origin will be linked from your profile to preserve regional authenticity
            {profileOrigin ? `: ${profileOrigin}.` : '.'}
          </div>
          <FloatingInput
            label="Dish title"
            value={formData.title}
            onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))}
            required
          />
          <textarea
            value={formData.description}
            onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
            placeholder="Describe the dish and what makes the preparation regionally special."
            className={textareaClass}
            required
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <select
              value={formData.category}
              onChange={(event) => setFormData((current) => ({ ...current, category: event.target.value }))}
              className="rounded-[1.5rem] border border-white/60 bg-white/80 px-4 py-4 text-sm text-slate-900 shadow-soft outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              {categoryOptions.filter((category) => category !== ALL_CATEGORIES).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <FloatingInput
              label="Cooking time (mins)"
              type="number"
              min="1"
              value={formData.cookingTimeMinutes}
              onChange={(event) =>
                setFormData((current) => ({ ...current, cookingTimeMinutes: event.target.value }))
              }
              required
            />
            <FloatingInput
              label="Servings"
              type="number"
              min="1"
              value={formData.servings}
              onChange={(event) => setFormData((current) => ({ ...current, servings: event.target.value }))}
              required
            />
          </div>
          <FloatingInput
            label={user?.role === 'seller' ? 'Selling price (Rs.)' : 'Price (optional)'}
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={(event) => setFormData((current) => ({ ...current, price: event.target.value }))}
            required={user?.role === 'seller'}
          />
          <FloatingInput
            label="Dish image URL (optional)"
            value={formData.image}
            onChange={(event) => setFormData((current) => ({ ...current, image: event.target.value }))}
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Ingredients</p>
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  setFormData((current) => ({
                    ...current,
                    ingredients: [...current.ingredients, { name: '', quantity: '' }],
                  }))
                }
              >
                Add ingredient
              </Button>
            </div>
            {formData.ingredients.map((ingredient, index) => (
              <div key={`ingredient-${index}`} className="grid gap-3 sm:grid-cols-[1fr_0.9fr_auto]">
                <FloatingInput
                  label={`Ingredient ${index + 1}`}
                  value={ingredient.name}
                  onChange={(event) => updateIngredient(index, 'name', event.target.value)}
                  required
                />
                <FloatingInput
                  label="Quantity"
                  value={ingredient.quantity}
                  onChange={(event) => updateIngredient(index, 'quantity', event.target.value)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setFormData((current) => ({
                      ...current,
                      ingredients:
                        current.ingredients.length === 1
                          ? [{ name: '', quantity: '' }]
                          : current.ingredients.filter((_, ingredientIndex) => ingredientIndex !== index),
                    }))
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Cooking steps</p>
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  setFormData((current) => ({
                    ...current,
                    steps: [...current.steps, ''],
                  }))
                }
              >
                Add step
              </Button>
            </div>
            {formData.steps.map((step, index) => (
              <div key={`step-${index}`} className="space-y-3">
                <textarea
                  value={step}
                  onChange={(event) => updateStep(index, event.target.value)}
                  placeholder={`Step ${index + 1}`}
                  className={textareaClass}
                  required
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setFormData((current) => ({
                      ...current,
                      steps:
                        current.steps.length === 1
                          ? ['']
                          : current.steps.filter((_, stepIndex) => stepIndex !== index),
                    }))
                  }
                >
                  Remove step
                </Button>
              </div>
            ))}
          </div>

          <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={(event) => setFormData((current) => ({ ...current, isPublic: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
            />
            Make this dish visible in the public regional recipe book
          </label>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : editingRecipeId ? 'Update dish' : 'Publish dish'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(selectedRecipe)}
        onClose={() => setSelectedRecipe(null)}
        title={selectedRecipe?.title || 'Recipe details'}
        description={selectedRecipe?.description || 'Open the ingredient list and cooking steps.'}
        size="lg"
      >
        {selectedRecipe && (
          <div className="space-y-6">
            {selectedRecipe.authenticityTag ? (
              <div className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
                {selectedRecipe.authenticityTag}
              </div>
            ) : null}
            <div className="grid gap-4 rounded-[1.5rem] bg-slate-900/5 p-4 text-sm dark:bg-white/5 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-slate-500 dark:text-slate-400">Author</p>
                <p className="mt-1 font-semibold text-slate-950 dark:text-white">{selectedRecipe.authorName}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Category</p>
                <p className="mt-1 font-semibold text-slate-950 dark:text-white">{selectedRecipe.category}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Cooking time</p>
                <p className="mt-1 font-semibold text-slate-950 dark:text-white">
                  {selectedRecipe.cookingTimeMinutes || 0} mins
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">State of origin</p>
                <p className="mt-1 font-semibold text-slate-950 dark:text-white">
                  {selectedRecipe.originState || 'Profile-linked'}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Region</p>
                <p className="mt-1 font-semibold text-slate-950 dark:text-white">
                  {selectedRecipe.originRegion || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">{selectedRecipe.price !== null ? 'Price' : 'Views'}</p>
                <p className="mt-1 font-semibold text-slate-950 dark:text-white">
                  {selectedRecipe.price !== null ? formatCurrency(selectedRecipe.price) : selectedRecipe.views || 0}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Servings</p>
                <p className="mt-1 font-semibold text-slate-950 dark:text-white">{selectedRecipe.servings}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Ingredients</h3>
              <div className="mt-3 space-y-2">
                {selectedRecipe.ingredients.map((ingredient, index) => (
                  <div
                    key={`detail-ingredient-${index}`}
                    className="rounded-[1.25rem] border border-white/60 bg-white/70 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5"
                  >
                    <span className="font-medium text-slate-950 dark:text-white">{ingredient.name}</span>
                    {ingredient.quantity ? (
                      <span className="ml-2 text-slate-500 dark:text-slate-400">{ingredient.quantity}</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Method</h3>
              <div className="mt-3 space-y-3">
                {selectedRecipe.steps.map((step, index) => (
                  <div
                    key={`detail-step-${index}`}
                    className="rounded-[1.5rem] border border-white/60 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
                      Step {step.stepNumber || index + 1}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-200">{step.instruction}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PageTransition>
  );
};

export default RecipeBook;
