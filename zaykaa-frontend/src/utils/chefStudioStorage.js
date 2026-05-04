const STORAGE_KEY = 'zaykaa-chef-studio-state';

const createDefaultState = () => ({
  chefBookings: [],
  chefMenusByScope: {},
  managedRecipesByScope: {},
});

const canUseStorage = () => typeof window !== 'undefined' && Boolean(window.localStorage);

const readState = () => {
  if (!canUseStorage()) {
    return createDefaultState();
  }

  try {
    const rawState = window.localStorage.getItem(STORAGE_KEY);
    const parsedState = rawState ? JSON.parse(rawState) : createDefaultState();
    return {
      ...createDefaultState(),
      ...(parsedState && typeof parsedState === 'object' ? parsedState : {}),
    };
  } catch (error) {
    return createDefaultState();
  }
};

const writeState = (nextState) => {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  } catch (error) {
    // Ignore storage failures so the UI can keep working.
  }
};

const createLocalId = (prefix) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeScopeValue = (value) => String(value || '').trim();

const normalizeLookupKey = (value) => String(value || '').trim().toLowerCase();

const getArray = (value) => (Array.isArray(value) ? value : []);

const getUniqueValues = (values = []) =>
  Array.from(new Set(values.map((value) => value).filter(Boolean)));

const sortByRecent = (items = []) =>
  [...items].sort((firstItem, secondItem) => {
    const secondTime = Date.parse(secondItem.updatedAt || secondItem.createdAt || secondItem.date || 0) || 0;
    const firstTime = Date.parse(firstItem.updatedAt || firstItem.createdAt || firstItem.date || 0) || 0;
    return secondTime - firstTime;
  });

const dedupeBy = (items, getKey) => {
  const itemMap = new Map();

  items.forEach((item) => {
    if (!item) {
      return;
    }

    const itemKey = getKey(item);
    if (!itemKey) {
      return;
    }

    itemMap.set(itemKey, item);
  });

  return Array.from(itemMap.values());
};

const matchesLookupKeys = (recordKeys = [], activeKeys = []) =>
  getArray(recordKeys).some((recordKey) => activeKeys.includes(normalizeLookupKey(recordKey)));

export const getStoredSessionUser = () => {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const rawUser = window.localStorage.getItem('user');
    return rawUser ? JSON.parse(rawUser) : null;
  } catch (error) {
    return null;
  }
};

export const getUserStorageScope = (user = getStoredSessionUser()) =>
  normalizeScopeValue(user?.id || user?._id || user?.email || user?.username || user?.name || 'guest');

export const getUserLookupKeys = (user = getStoredSessionUser()) =>
  getUniqueValues(
    [
      user?.id,
      user?._id,
      user?.email,
      user?.username,
      user?.name,
      user?.full_name,
      user?.displayName,
    ].map(normalizeLookupKey)
  );

export const getChefLookupKeys = (chef = {}) =>
  getUniqueValues(
    [
      chef.id,
      chef._id,
      chef.email,
      chef.username,
      chef.name,
      chef.displayName,
    ].map(normalizeLookupKey)
  );

const normalizeStoredBooking = (booking = {}, options = {}) => {
  const chefLookupKeys = getUniqueValues([
    ...getArray(booking.chefLookupKeys),
    ...getArray(options.chefLookupKeys),
    booking.chefId,
    booking.chefName,
    booking?.chef?.name,
  ].map(normalizeLookupKey));

  const createdAt = booking.createdAt || booking.bookedAt || options.createdAt || new Date().toISOString();
  const amount = Number(booking.amount ?? booking.totalAmount ?? booking.price ?? 0);

  return {
    ...booking,
    id: booking.id || booking.bookingId || createLocalId('chef-booking'),
    bookingId: booking.bookingId || booking.id || null,
    bookingReference:
      booking.bookingReference || booking.reference || `CHEF-${Date.now().toString(36).toUpperCase()}`,
    status: booking.status || 'pending',
    date: booking.date || options.date || new Date().toISOString().split('T')[0],
    timeSlot: booking.timeSlot || 'dinner',
    guestCount: Number(booking.guestCount ?? booking.guests ?? booking.partySize ?? 0),
    menuPreferences:
      booking.menuPreferences ||
      booking.specialRequests ||
      booking.dietaryRestrictions ||
      options.menuPreferences ||
      '',
    amount,
    totalAmount: amount,
    chefId: booking.chefId || options.chefId || '',
    chefName: booking.chefName || booking?.chef?.name || options.chefName || '',
    chefLocation: booking.chefLocation || booking?.chef?.location || options.chefLocation || '',
    userName:
      booking.userName || booking.customerName || booking?.user?.name || options.customerName || 'Guest',
    customerName:
      booking.customerName || booking.userName || booking?.user?.name || options.customerName || 'Guest',
    createdAt,
    updatedAt: booking.updatedAt || createdAt,
    chefLookupKeys,
  };
};

const getStoredChefBookings = () => sortByRecent(readState().chefBookings);

const writeChefBookings = (chefBookings) => {
  const nextState = readState();
  nextState.chefBookings = sortByRecent(
    dedupeBy(chefBookings, (booking) => booking.bookingReference || booking.id || booking.bookingId)
  );
  writeState(nextState);
  return nextState.chefBookings;
};

export const getStoredChefBookingsForUser = (user = getStoredSessionUser()) => {
  const activeKeys = getUserLookupKeys(user);
  if (activeKeys.length === 0) {
    return [];
  }

  return getStoredChefBookings().filter((booking) => matchesLookupKeys(booking.chefLookupKeys, activeKeys));
};

export const ensureStoredChefBookingsForUser = (user = getStoredSessionUser(), fallbackBookings = []) => {
  const existingBookings = getStoredChefBookingsForUser(user);
  const activeKeys = getUserLookupKeys(user);

  if (existingBookings.length > 0 || activeKeys.length === 0 || fallbackBookings.length === 0) {
    return existingBookings;
  }

  const seededBookings = fallbackBookings.map((booking) =>
    normalizeStoredBooking(booking, {
      chefLookupKeys: activeKeys,
      chefName: user?.name || 'Chef Studio',
      chefId: user?.id || user?._id || '',
    })
  );

  writeChefBookings([...getStoredChefBookings(), ...seededBookings]);
  return getStoredChefBookingsForUser(user);
};

export const syncStoredChefBookingsForUser = (user = getStoredSessionUser(), bookings = []) => {
  const activeKeys = getUserLookupKeys(user);
  if (activeKeys.length === 0) {
    return [];
  }

  const preservedBookings = getStoredChefBookings().filter(
    (booking) => !matchesLookupKeys(booking.chefLookupKeys, activeKeys)
  );

  const syncedBookings = bookings.map((booking) =>
    normalizeStoredBooking(booking, {
      chefLookupKeys: activeKeys,
      chefName: booking.chefName || user?.name || '',
      chefId: booking.chefId || user?.id || user?._id || '',
    })
  );

  writeChefBookings([...preservedBookings, ...syncedBookings]);
  return getStoredChefBookingsForUser(user);
};

export const saveStudioChefBookingForChef = (
  chef,
  booking,
  customerUser = getStoredSessionUser()
) => {
  const chefLookupKeys = getChefLookupKeys(chef);
  if (chefLookupKeys.length === 0) {
    return null;
  }

  const normalizedBooking = normalizeStoredBooking(booking, {
    chefLookupKeys,
    chefId: chef?.id || '',
    chefName: chef?.name || '',
    chefLocation: chef?.location || chef?.city || chef?.state || '',
    customerName: customerUser?.name || booking?.userName || booking?.customerName || 'Guest',
  });

  const existingBookings = getStoredChefBookings().filter(
    (storedBooking) =>
      (storedBooking.bookingReference || storedBooking.id) !==
      (normalizedBooking.bookingReference || normalizedBooking.id)
  );

  writeChefBookings([normalizedBooking, ...existingBookings]);
  return normalizedBooking;
};

export const updateStoredChefBookingStatusForUser = (
  user = getStoredSessionUser(),
  bookingId,
  status
) => {
  const activeKeys = getUserLookupKeys(user);
  if (activeKeys.length === 0) {
    return null;
  }

  let updatedBooking = null;
  const nextBookings = getStoredChefBookings().map((booking) => {
    const matchesChef = matchesLookupKeys(booking.chefLookupKeys, activeKeys);
    const matchesId =
      String(booking.id) === String(bookingId) ||
      String(booking.bookingId) === String(bookingId) ||
      String(booking.bookingReference) === String(bookingId);

    if (matchesChef && matchesId) {
      updatedBooking = {
        ...booking,
        status,
        updatedAt: new Date().toISOString(),
      };
      return updatedBooking;
    }

    return booking;
  });

  writeChefBookings(nextBookings);
  return updatedBooking;
};

const normalizeStoredMenuItem = (food = {}) => ({
  ...food,
  id: food.id || createLocalId('menu-item'),
  name: food.name || '',
  description: food.description || '',
  price: Number(food.price || 0),
  category: food.category || 'Main Course',
  image_url: food.image_url || food.imageUrl || food.image || '',
  image: food.image || food.image_url || food.imageUrl || '',
  views: Number(food.views || 0),
  updatedAt: food.updatedAt || new Date().toISOString(),
});

export const getStoredChefMenuForUser = (user = getStoredSessionUser()) => {
  const scope = getUserStorageScope(user);
  const state = readState();
  return sortByRecent(getArray(state.chefMenusByScope[scope]).map(normalizeStoredMenuItem));
};

export const ensureStoredChefMenuForUser = (user = getStoredSessionUser(), fallbackItems = []) => {
  const scope = getUserStorageScope(user);
  const existingItems = getStoredChefMenuForUser(user);

  if (existingItems.length > 0 || fallbackItems.length === 0) {
    return existingItems;
  }

  const nextState = readState();
  nextState.chefMenusByScope[scope] = fallbackItems.map(normalizeStoredMenuItem);
  writeState(nextState);
  return getStoredChefMenuForUser(user);
};

export const syncStoredChefMenuForUser = (user = getStoredSessionUser(), items = []) => {
  const scope = getUserStorageScope(user);
  const nextState = readState();
  nextState.chefMenusByScope[scope] = items.map(normalizeStoredMenuItem);
  writeState(nextState);
  return getStoredChefMenuForUser(user);
};

export const upsertStoredChefMenuItemForUser = (user = getStoredSessionUser(), foodItem, editingId = null) => {
  const scope = getUserStorageScope(user);
  const currentItems = getStoredChefMenuForUser(user);
  const normalizedItem = normalizeStoredMenuItem({
    ...foodItem,
    id: editingId || foodItem?.id,
    updatedAt: new Date().toISOString(),
  });

  const nextItems = currentItems
    .filter((item) => String(item.id) !== String(editingId || normalizedItem.id))
    .concat(normalizedItem);

  const nextState = readState();
  nextState.chefMenusByScope[scope] = sortByRecent(nextItems);
  writeState(nextState);
  return normalizedItem;
};

export const deleteStoredChefMenuItemForUser = (user = getStoredSessionUser(), foodId) => {
  const scope = getUserStorageScope(user);
  const nextState = readState();
  nextState.chefMenusByScope[scope] = getStoredChefMenuForUser(user).filter(
    (item) => String(item.id) !== String(foodId)
  );
  writeState(nextState);
  return true;
};

const normalizeStoredRecipe = (recipe = {}, user = getStoredSessionUser()) => {
  const cookingTimeMinutes = Number(
    recipe.cookingTimeMinutes ?? recipe.cookTimeMinutes ?? recipe.preparationTimeMinutes ?? 0
  );
  const priceValue =
    recipe.price === null || recipe.price === undefined || recipe.price === ''
      ? null
      : Number(recipe.price);

  return {
    ...recipe,
    id: recipe.id || createLocalId('recipe'),
    title: recipe.title || recipe.name || '',
    name: recipe.name || recipe.title || '',
    description: recipe.description || '',
    category: recipe.category || 'Veg',
    cookingTimeMinutes,
    cookTimeMinutes: cookingTimeMinutes,
    preparationTime: recipe.preparationTime || `${cookingTimeMinutes} mins`,
    servings: Number(recipe.servings || 1),
    price: Number.isFinite(priceValue) ? priceValue : null,
    image: recipe.image || recipe.imageUrl || '',
    imageUrl: recipe.imageUrl || recipe.image || '',
    isPublic: recipe.isPublic ?? true,
    ingredients: getArray(recipe.ingredients),
    steps: getArray(recipe.steps),
    authorName: recipe.authorName || user?.name || 'Zaykaa Contributor',
    authorRole: recipe.authorRole || user?.role || 'chef',
    originState: recipe.originState || user?.nativeState || user?.native_state || '',
    originRegion: recipe.originRegion || user?.nativeRegion || user?.native_region || '',
    views: Number(recipe.views || 0),
    createdAt: recipe.createdAt || new Date().toISOString(),
    updatedAt: recipe.updatedAt || new Date().toISOString(),
  };
};

export const getStoredManagedRecipesForUser = (user = getStoredSessionUser()) => {
  const scope = getUserStorageScope(user);
  const state = readState();
  return sortByRecent(getArray(state.managedRecipesByScope[scope]).map((recipe) => normalizeStoredRecipe(recipe, user)));
};

export const ensureStoredManagedRecipesForUser = (user = getStoredSessionUser(), fallbackRecipes = []) => {
  const scope = getUserStorageScope(user);
  const existingRecipes = getStoredManagedRecipesForUser(user);

  if (existingRecipes.length > 0 || fallbackRecipes.length === 0) {
    return existingRecipes;
  }

  const nextState = readState();
  nextState.managedRecipesByScope[scope] = fallbackRecipes.map((recipe) => normalizeStoredRecipe(recipe, user));
  writeState(nextState);
  return getStoredManagedRecipesForUser(user);
};

export const syncStoredManagedRecipesForUser = (user = getStoredSessionUser(), recipes = []) => {
  const scope = getUserStorageScope(user);
  const nextState = readState();
  nextState.managedRecipesByScope[scope] = recipes.map((recipe) => normalizeStoredRecipe(recipe, user));
  writeState(nextState);
  return getStoredManagedRecipesForUser(user);
};

export const upsertStoredManagedRecipeForUser = (
  user = getStoredSessionUser(),
  recipe,
  editingId = null
) => {
  const scope = getUserStorageScope(user);
  const currentRecipes = getStoredManagedRecipesForUser(user);
  const normalizedRecipe = normalizeStoredRecipe(
    {
      ...recipe,
      id: editingId || recipe?.id,
      updatedAt: new Date().toISOString(),
    },
    user
  );

  const nextRecipes = currentRecipes
    .filter((currentRecipe) => String(currentRecipe.id) !== String(editingId || normalizedRecipe.id))
    .concat(normalizedRecipe);

  const nextState = readState();
  nextState.managedRecipesByScope[scope] = sortByRecent(nextRecipes);
  writeState(nextState);
  return normalizedRecipe;
};

export const deleteStoredManagedRecipeForUser = (user = getStoredSessionUser(), recipeId) => {
  const scope = getUserStorageScope(user);
  const nextState = readState();
  nextState.managedRecipesByScope[scope] = getStoredManagedRecipesForUser(user).filter(
    (recipe) => String(recipe.id) !== String(recipeId)
  );
  writeState(nextState);
  return true;
};

export const getStoredPublicManagedRecipes = () => {
  const state = readState();

  return sortByRecent(
    Object.values(state.managedRecipesByScope)
      .flatMap((recipes) => getArray(recipes))
      .filter((recipe) => recipe?.isPublic !== false)
      .map((recipe) => normalizeStoredRecipe(recipe))
  );
};

const buildMonthlyRevenue = (bookings = []) => {
  const monthFormatter = new Intl.DateTimeFormat('en-IN', { month: 'short' });
  const monthlyMap = new Map();

  bookings.forEach((booking) => {
    const parsedDate = new Date(booking.date || booking.createdAt || booking.updatedAt || Date.now());
    if (Number.isNaN(parsedDate.getTime())) {
      return;
    }

    const monthKey = `${parsedDate.getFullYear()}-${parsedDate.getMonth()}`;
    const currentValue = monthlyMap.get(monthKey) || {
      label: monthFormatter.format(parsedDate),
      value: 0,
      year: parsedDate.getFullYear(),
      month: parsedDate.getMonth(),
    };

    currentValue.value += Number(booking.amount || booking.totalAmount || 0);
    monthlyMap.set(monthKey, currentValue);
  });

  return Array.from(monthlyMap.values())
    .sort((firstMonth, secondMonth) => {
      if (firstMonth.year !== secondMonth.year) {
        return firstMonth.year - secondMonth.year;
      }
      return firstMonth.month - secondMonth.month;
    })
    .slice(-6)
    .map(({ label, value }) => ({ label, value }));
};

const buildBookingTrend = (bookings = []) => {
  const groupedBookings = bookings.slice(0, 5).map((booking, index) => ({
    label: `Week ${index + 1}`,
    value: 1,
  }));

  return groupedBookings.length > 0 ? groupedBookings : [];
};

const buildCuisineMix = (menuItems = [], recipes = []) => {
  const categoryCounts = new Map();

  [...menuItems, ...recipes].forEach((item) => {
    const category = item.category || 'Other';
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
  });

  const total = Array.from(categoryCounts.values()).reduce((sum, value) => sum + value, 0);
  if (total === 0) {
    return [];
  }

  return Array.from(categoryCounts.entries())
    .slice(0, 5)
    .map(([label, value]) => ({
      label,
      value: Math.round((value / total) * 100),
    }));
};

export const buildStoredChefAnalyticsForUser = (user = getStoredSessionUser(), fallbackAnalytics = {}) => {
  const bookings = getStoredChefBookingsForUser(user);
  const menuItems = getStoredChefMenuForUser(user);
  const recipes = getStoredManagedRecipesForUser(user);

  if (bookings.length === 0 && menuItems.length === 0 && recipes.length === 0) {
    return null;
  }

  const totalBookings = bookings.length;
  const completedBookings = bookings.filter((booking) => booking.status === 'completed').length;
  const upcomingBookings = bookings.filter((booking) =>
    ['pending', 'confirmed'].includes(String(booking.status || '').toLowerCase())
  ).length;
  const totalEarnings = bookings.reduce(
    (sum, booking) => sum + Number(booking.amount || booking.totalAmount || 0),
    0
  );

  return {
    ...fallbackAnalytics,
    totalBookings,
    totalEarnings,
    averageRating: fallbackAnalytics.averageRating || 4.8,
    totalReviews: fallbackAnalytics.totalReviews || Math.max(totalBookings * 2, 0),
    upcomingBookings,
    completedBookings,
    monthlyRevenue: buildMonthlyRevenue(bookings),
    bookingTrend: buildBookingTrend(bookings),
    cuisineMix: buildCuisineMix(menuItems, recipes),
  };
};
