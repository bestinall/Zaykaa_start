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
  'min-h-[100px] w-full rounded-[1.2rem] border border-white/60 bg-white/80 px-3 py-3 text-sm text-slate-900 shadow-soft outline-none transition placeholder:text-slate-400 focus:border-brand/50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500';

const Icon = ({ path, className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {path}
  </svg>
);

const icons = {
  book: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />,
  search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></>,
  sparkle: <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  mapPin: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>,
  tag: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><path d="M7 7h.01" /></>,
  trash: <><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></>,
  edit: <><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></>,
  eye: <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />,
  check: <path d="M20 6 9 17l-5-5" />,
};

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
  <Card hover={false} padded={false} className="overflow-hidden">
    <div className="relative h-32">
      {recipe.image ? (
        <SmartImage src={recipe.image} alt={recipe.title} className="h-full w-full" />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-orange-200 via-amber-100 to-rose-200 dark:from-orange-500/20 dark:via-amber-500/10 dark:to-rose-500/20" />
      )}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
        <span className="rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-900 backdrop-blur">
          {recipe.category}
        </span>
        <span className="rounded-full bg-slate-950/75 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
          {humanize(recipe.authorRole || 'chef')}
        </span>
      </div>
    </div>
    <div className="space-y-3 p-4">
      <div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400">
          <span className="font-medium">{recipe.authorName}</span>
          {recipe.originState && <span> • {recipe.originState}</span>}
        </p>
        <h3 className="mt-1 font-display text-base font-semibold text-slate-950 dark:text-white line-clamp-1">{recipe.title}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300 line-clamp-2">{recipe.description}</p>
        {recipe.authenticityTag ? (
          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
            <Icon path={icons.check} className="h-2.5 w-2.5" />
            {recipe.authenticityTag}
          </div>
        ) : null}
      </div>
      <div className="grid grid-cols-4 gap-2 text-[10px]">
        <div className="rounded-lg bg-slate-900/5 px-2 py-1.5 dark:bg-white/5">
          <p className="text-slate-500 dark:text-slate-400">Time</p>
          <p className="mt-0.5 font-semibold text-slate-950 dark:text-white">{recipe.cookingTimeMinutes || 0}m</p>
        </div>
        <div className="rounded-lg bg-slate-900/5 px-2 py-1.5 dark:bg-white/5">
          <p className="text-slate-500 dark:text-slate-400">Serves</p>
          <p className="mt-0.5 font-semibold text-slate-950 dark:text-white">{recipe.servings}</p>
        </div>
        <div className="rounded-lg bg-slate-900/5 px-2 py-1.5 dark:bg-white/5">
          <p className="text-slate-500 dark:text-slate-400">State</p>
          <p className="mt-0.5 font-semibold text-slate-950 dark:text-white line-clamp-1">{recipe.originState || '—'}</p>
        </div>
        <div className="rounded-lg bg-slate-900/5 px-2 py-1.5 dark:bg-white/5">
          <p className="text-slate-500 dark:text-slate-400">{recipe.price !== null ? 'Price' : 'Views'}</p>
          <p className="mt-0.5 font-semibold text-slate-950 dark:text-white">
            {recipe.price !== null ? formatCurrency(recipe.price) : recipe.views || 0}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button size="sm" variant="secondary" onClick={() => onView(recipe)}>
          View
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
        const recipes = response.recipes || [];
        setPublicRecipes(recipes);
        setPublicPreviewMode(false);

        // FIX: If API returns empty array, show preview data
        if (recipes.length === 0) {
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
        }
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
    const recipes = response.recipes || [];
    setPublicRecipes(recipes);
    setPublicPreviewMode(false);

    // Also apply preview fallback if empty
    if (recipes.length === 0) {
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
    }
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
      <div className="content-shell space-y-4">
        <Card hover={false} className="overflow-hidden p-0">
          <div className="grid gap-4 bg-hero-wash p-5 dark:bg-hero-wash-dark sm:grid-cols-[1fr_0.5fr] sm:p-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand shadow-soft backdrop-blur dark:border-white/10 dark:bg-white/5">
                <span className="inline-block h-1.5 w-1.5 animate-pulseSoft rounded-full bg-brand" />
                Recipe book
              </div>
              <h1 className="mt-3 font-display text-xl leading-tight text-slate-950 dark:text-white sm:text-2xl">
                Discover regional dishes from chefs and sellers
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300 line-clamp-2">
                Browse food stories by state, category, and contributor. Every dish carries ingredients, steps, and regional origin.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:content-center">
              {[
                { label: 'Recipes', value: String(publicRecipes.length), icon: icons.book },
                { label: 'States', value: String(stateOptions.length - 1), icon: icons.mapPin },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-white/60 bg-white/70 p-3 shadow-soft dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Icon path={stat.icon} className="h-3 w-3" />
                    </span>
                  </div>
                  <p className="mt-2 text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </p>
                  <p className="text-base font-semibold text-slate-950 dark:text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card hover={false}>
          <SectionHeader
            eyebrow="Explore dishes"
            title="Search by name, category, and origin"
            description="Public recipes from chefs and sellers with full preparation details."
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
            <FloatingInput
              label="Search dishes"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="rounded-[1.2rem] border border-white/60 bg-white/80 px-3 py-2.5 text-sm text-slate-900 shadow-soft outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
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
              className="rounded-[1.2rem] border border-white/60 bg-white/80 px-3 py-2.5 text-sm text-slate-900 shadow-soft outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
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
              className="rounded-[1.2rem] border border-white/60 bg-white/80 px-3 py-2.5 text-sm text-slate-900 shadow-soft outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              {regionOptions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
          {publicPreviewMode && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand">
              <Icon path={icons.sparkle} className="h-3 w-3" />
              Showing sample dishes
            </div>
          )}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {publicLoading ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading recipes...</p>
            ) : publicRecipes.length > 0 ? (
              publicRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} onView={setSelectedRecipe} />
              ))
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No dishes matched your filters. Try broader options.
              </p>
            )}
          </div>
        </Card>

        {canManage && (
          <Card hover={false}>
            <SectionHeader
              eyebrow="Your dishes"
              title="Manage your published recipes"
              description="Create, edit, or remove dishes. Origin is linked from your profile."
              action={
                <Button size="sm" onClick={openCreateModal}>
                  Add dish
                </Button>
              }
            />
            {profileOrigin && (
              <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-white/60 bg-white/70 px-3 py-1.5 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                <Icon path={icons.mapPin} className="h-3 w-3" />
                Origin: {profileOrigin}
              </div>
            )}
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {manageLoading ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Loading your dishes...</p>
              ) : myRecipes.length > 0 ? (
                myRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onView={setSelectedRecipe}
                    action={
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEditModal(recipe)}>
                          <Icon path={icons.edit} className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => handleDelete(recipe)}>
                          <Icon path={icons.trash} className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    }
                  />
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  You haven't published any dishes yet.
                </p>
              )}
            </div>
          </Card>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRecipeId ? 'Edit dish' : 'Add new dish'}
        description="Capture ingredients and cooking method so others can learn."
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FloatingInput
            label="Dish title"
            value={formData.title}
            onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))}
            required
          />
          <textarea
            value={formData.description}
            onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
            placeholder="Describe the dish and what makes it regionally special."
            className={textareaClass}
            required
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <select
              value={formData.category}
              onChange={(event) => setFormData((current) => ({ ...current, category: event.target.value }))}
              className="rounded-[1.2rem] border border-white/60 bg-white/80 px-3 py-2.5 text-sm text-slate-900 shadow-soft outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
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
            label="Image URL (optional)"
            value={formData.image}
            onChange={(event) => setFormData((current) => ({ ...current, image: event.target.value }))}
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Ingredients</p>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  setFormData((current) => ({
                    ...current,
                    ingredients: [...current.ingredients, { name: '', quantity: '' }],
                  }))
                }
              >
                Add
              </Button>
            </div>
            {formData.ingredients.map((ingredient, index) => (
              <div key={`ingredient-${index}`} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
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
                  size="sm"
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

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Steps</p>
              <Button
                type="button"
                size="sm"
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
              <div key={`step-${index}`} className="space-y-2">
                <textarea
                  value={step}
                  onChange={(event) => updateStep(index, event.target.value)}
                  placeholder={`Step ${index + 1}`}
                  className={textareaClass}
                  required
                />
                <Button
                  type="button"
                  size="sm"
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
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={(event) => setFormData((current) => ({ ...current, isPublic: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
            />
            Make this dish visible in the public recipe book
          </label>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : editingRecipeId ? 'Update' : 'Publish'}
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
        size="lg"
      >
        {selectedRecipe && (
          <div className="space-y-4">
            {selectedRecipe.image && (
              <SmartImage
                src={selectedRecipe.image}
                alt={selectedRecipe.title}
                className="h-40 w-full rounded-xl"
              />
            )}
            {selectedRecipe.authenticityTag && (
              <div className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
                <Icon path={icons.check} className="h-2.5 w-2.5" />
                {selectedRecipe.authenticityTag}
              </div>
            )}
            <div className="grid gap-3 rounded-xl bg-slate-900/5 p-3 text-xs dark:bg-white/5 sm:grid-cols-2">
              <div>
                <p className="text-slate-500 dark:text-slate-400">Author</p>
                <p className="mt-1 font-semibold text-slate-950 dark:text-white">{selectedRecipe.authorName}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Category</p>
                <p className="mt-1 font-semibold text-slate-950 dark:text-white">{selectedRecipe.category}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Time</p>
                <p className="mt-1 font-semibold text-slate-950 dark:text-white">
                  {selectedRecipe.cookingTimeMinutes || 0} mins
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">Servings</p>
                <p className="mt-1 font-semibold text-slate-950 dark:text-white">{selectedRecipe.servings}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">State</p>
                <p className="mt-1 font-semibold text-slate-950 dark:text-white">
                  {selectedRecipe.originState || 'Profile-linked'}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">{selectedRecipe.price !== null ? 'Price' : 'Views'}</p>
                <p className="mt-1 font-semibold text-slate-950 dark:text-white">
                  {selectedRecipe.price !== null ? formatCurrency(selectedRecipe.price) : selectedRecipe.views || 0}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-950 dark:text-white">Ingredients</h3>
              <div className="mt-2 space-y-1.5">
                {selectedRecipe.ingredients.map((ingredient, index) => (
                  <div
                    key={`detail-ingredient-${index}`}
                    className="flex items-center justify-between rounded-lg border border-white/60 bg-white/70 px-3 py-2 text-xs dark:border-white/10 dark:bg-white/5"
                  >
                    <span className="font-medium text-slate-950 dark:text-white">{ingredient.name}</span>
                    {ingredient.quantity && (
                      <span className="text-slate-500 dark:text-slate-400">{ingredient.quantity}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-950 dark:text-white">Method</h3>
              <div className="mt-2 space-y-2">
                {selectedRecipe.steps.map((step, index) => (
                  <div
                    key={`detail-step-${index}`}
                    className="rounded-xl border border-white/60 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand">
                      Step {step.stepNumber || index + 1}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{step.instruction}</p>
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
