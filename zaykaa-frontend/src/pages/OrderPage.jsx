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
import { orderService } from '../services/order';
import { previewRestaurants } from '../data/mockData';
import { useToast } from '../context/ToastContext';

const OrderPage = () => {
  const toast = useToast();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');

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

        if (!active) {
          return;
        }

        if (items.length === 0) {
          setRestaurants(previewRestaurants);
          setPreviewMode(true);
        } else {
          setRestaurants(items);
          setPreviewMode(false);
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

  const filteredRestaurants = useMemo(() => {
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

  return (
    <PageTransition className="app-shell">
      <Header />
      <div className="content-shell space-y-8">
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-6">
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
              selectedRestaurant={selectedRestaurant}
              onSelectRestaurant={(restaurant) =>
                startTransition(() => {
                  setSelectedRestaurant(restaurant);
                })
              }
            />
            <MenuDisplay restaurant={selectedRestaurant} />
          </div>
          <Cart />
        </div>
      </div>
    </PageTransition>
  );
};

export default OrderPage;
