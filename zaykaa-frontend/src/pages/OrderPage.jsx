import React, {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Header from '../components/Common/Header';
import RestaurantBrowse from '../components/Order/RestaurantBrowse';
import MenuDisplay from '../components/Order/MenuDisplay';
import Cart from '../components/Order/Cart';
import PageTransition from '../components/ui/PageTransition';
import { indiaRegionalFoodStates } from '../data/indiaRegionalFoods';
import { orderService } from '../services/order';
import { previewRestaurants } from '../data/mockData';
import { useToast } from '../context/ToastContext';

const DEFAULT_REGIONAL_STATE =
  indiaRegionalFoodStates.find((region) => region.state === 'Maharashtra')?.state ||
  indiaRegionalFoodStates[0]?.state ||
  '';

const restaurantMatchesState = (restaurant, state) => {
  if (!restaurant || !state) {
    return false;
  }

  const locationText = [
    restaurant.location,
    restaurant.locationLabel,
    restaurant.city,
    restaurant.state,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const featuredStates = restaurant.featuredStates || [];
  const dishes = restaurant.dishes || restaurant.menu || [];

  return (
    featuredStates.includes(state) ||
    locationText.includes(String(state).toLowerCase()) ||
    dishes.some((dish) => dish.originState === state)
  );
};

const OrderPage = () => {
  const toast = useToast();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [selectedState, setSelectedState] = useState(DEFAULT_REGIONAL_STATE);
  const [browseMode, setBrowseMode] = useState('state');

  const deferredLocation = useDeferredValue(location);
  const deferredSearch = useDeferredValue(searchQuery);

  useEffect(() => {
    let active = true;

    const loadRestaurants = async () => {
      setLoading(true);

      try {
        const response = await orderService.getRestaurants({
          location: deferredLocation,
        });
        const items = response.restaurants || [];

        const hasOriginState = items.some((r) =>
          (r.dishes || r.menu || []).some((d) => d.originState)
        );

        if (!active) {
          return;
        }

        if (items.length === 0) {
          setRestaurants(previewRestaurants);
          setPreviewMode(true);
        } else {
          setRestaurants(items);
          setPreviewMode(false);
          if (!hasOriginState) {
            setBrowseMode('restaurant');
          }
        }
      } catch (error) {
        if (!active) {
          return;
        }

        setRestaurants(previewRestaurants);
        setPreviewMode(true);
        toast.info('Preview restaurants loaded', 'Live restaurant data is unavailable right now.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadRestaurants();

    return () => {
      active = false;
    };
  }, [deferredLocation, toast]);

  const cuisines = useMemo(
    () => ['All', ...new Set(restaurants.flatMap((restaurant) => restaurant.cuisines || []))],
    [restaurants]
  );

  const baseFilteredRestaurants = useMemo(() => {
    return restaurants.filter((restaurant) => {
      const matchesCuisine =
        selectedCuisine === 'All'
          ? true
          : (restaurant.cuisines || []).some(
              (cuisine) => String(cuisine).toLowerCase() === selectedCuisine.toLowerCase()
            );

      const searchable = [restaurant.name, restaurant.location, ...(restaurant.cuisines || [])]
        .join(' ')
        .toLowerCase();
      const matchesSearch = searchable.includes(deferredSearch.toLowerCase());

      return matchesCuisine && matchesSearch;
    });
  }, [restaurants, selectedCuisine, deferredSearch]);

  const stateRestaurantCount = useMemo(
    () =>
      selectedState
        ? baseFilteredRestaurants.filter((restaurant) => restaurantMatchesState(restaurant, selectedState)).length
        : 0,
    [baseFilteredRestaurants, selectedState]
  );

  const stateDishGroups = useMemo(() => {
    if (!selectedState) {
      return [];
    }

    return baseFilteredRestaurants
      .map((restaurant) => {
        const dishes = (restaurant.dishes || restaurant.menu || []).filter(
          (dish) => dish.originState === selectedState
        );

        if (dishes.length === 0) {
          return null;
        }

        return {
          ...restaurant,
          stateDishes: dishes,
        };
      })
      .filter(Boolean)
      .sort((first, second) => {
        if (Number(second.rating || 0) !== Number(first.rating || 0)) {
          return Number(second.rating || 0) - Number(first.rating || 0);
        }

        return first.name.localeCompare(second.name);
      });
  }, [baseFilteredRestaurants, selectedState]);

  const filteredRestaurants = useMemo(() => {
    if (!selectedState) {
      return baseFilteredRestaurants;
    }

    const matching = [];
    const others = [];

    baseFilteredRestaurants.forEach((restaurant) => {
      if (restaurantMatchesState(restaurant, selectedState)) {
        matching.push(restaurant);
      } else {
        others.push(restaurant);
      }
    });

    return [...matching, ...others];
  }, [baseFilteredRestaurants, selectedState]);

  useEffect(() => {
    if (!selectedRestaurant && filteredRestaurants.length > 0) {
      setSelectedRestaurant(filteredRestaurants[0]);
      return;
    }

    if (
      selectedRestaurant &&
      !filteredRestaurants.some((restaurant) => restaurant.id === selectedRestaurant.id)
    ) {
      setSelectedRestaurant(filteredRestaurants[0] || null);
      return;
    }

    if (selectedRestaurant) {
      const updatedRestaurant = filteredRestaurants.find(
        (restaurant) => restaurant.id === selectedRestaurant.id
      );
      if (updatedRestaurant && updatedRestaurant !== selectedRestaurant) {
        setSelectedRestaurant(updatedRestaurant);
      }
    }
  }, [filteredRestaurants, selectedRestaurant]);

  useEffect(() => {
    if (!selectedState || filteredRestaurants.length === 0) {
      return;
    }

    const firstMatch = filteredRestaurants.find((restaurant) =>
      restaurantMatchesState(restaurant, selectedState)
    );

    if (!firstMatch) {
      return;
    }

    if (!selectedRestaurant || !restaurantMatchesState(selectedRestaurant, selectedState)) {
      setSelectedRestaurant(firstMatch);
    }
  }, [filteredRestaurants, selectedRestaurant, selectedState]);

  return (
    <PageTransition className="app-shell">
      <Header />
      <div className="content-shell space-y-6">
        <RestaurantBrowse
          restaurants={filteredRestaurants}
          loading={loading}
          previewMode={previewMode}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          location={location}
          onLocationChange={setLocation}
          selectedCuisine={selectedCuisine}
          cuisines={cuisines}
          onCuisineChange={setSelectedCuisine}
          browseMode={browseMode}
          onBrowseModeChange={setBrowseMode}
          selectedState={selectedState}
          onStateSelect={setSelectedState}
          regionalShowcase={indiaRegionalFoodStates}
          stateRestaurantCount={stateRestaurantCount}
          stateDishGroups={stateDishGroups}
          selectedRestaurant={selectedRestaurant}
          onSelectRestaurant={(restaurant) =>
            startTransition(() => {
              setSelectedRestaurant(restaurant);
            })
          }
          onOpenRestaurantMenu={(restaurant) =>
            startTransition(() => {
              setSelectedRestaurant(restaurant);
              setBrowseMode('restaurant');
            })
          }
        />
        {browseMode === 'restaurant' && (
          <MenuDisplay restaurant={selectedRestaurant} selectedState={selectedState} />
        )}
        <Cart />
      </div>
    </PageTransition>
  );
};

export default OrderPage;
