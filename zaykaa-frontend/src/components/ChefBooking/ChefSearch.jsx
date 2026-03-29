import React, {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { bookingService } from '../../services/booking';
import { previewChefs } from '../../data/mockData';
import ChefCard from './ChefCard';
import Card from '../ui/Card';
import FloatingInput from '../ui/FloatingInput';
import Skeleton, { SkeletonCard } from '../ui/Skeleton';
import SectionHeader from '../ui/SectionHeader';
import { useToast } from '../../context/ToastContext';

const priceFilters = [
  { key: 'all', label: 'Any budget' },
  { key: 'under1800', label: 'Under Rs. 1,800' },
  { key: '1800to2400', label: 'Rs. 1,800-2,400' },
  { key: '2400plus', label: 'Above Rs. 2,400' },
];

const ratingFilters = [
  { key: 'all', label: 'Any rating' },
  { key: '4.5', label: '4.5+' },
  { key: '4.8', label: '4.8+' },
];

const matchesBudget = (chef, budget) => {
  const rate = Number(chef.hourlyRate || 0);
  if (budget === 'under1800') {
    return rate < 1800;
  }
  if (budget === '1800to2400') {
    return rate >= 1800 && rate <= 2400;
  }
  if (budget === '2400plus') {
    return rate > 2400;
  }
  return true;
};

const ChefSearch = ({ onSelectChef }) => {
  const toast = useToast();
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [filters, setFilters] = useState({
    location: '',
    cuisine: 'All',
    date: '',
    query: '',
    budget: 'all',
    rating: 'all',
  });

  const deferredQuery = useDeferredValue(filters.query);

  useEffect(() => {
    const loadChefs = async () => {
      setLoading(true);

      try {
        const response = await bookingService.getAvailableChefs({
          location: filters.location,
          cuisine: filters.cuisine,
          date: filters.date,
        });
        const items = response.chefs || [];

        if (items.length === 0) {
          setChefs(previewChefs);
          setPreviewMode(true);
        } else {
          setChefs(items);
          setPreviewMode(false);
        }
      } catch (error) {
        setChefs(previewChefs);
        setPreviewMode(true);
        toast.info('Preview chefs loaded', 'Live chef discovery is unavailable right now.');
      } finally {
        setLoading(false);
      }
    };

    loadChefs();
  }, [filters.location, filters.cuisine, filters.date, toast]);

  const filteredChefs = useMemo(() => {
    return chefs.filter((chef) => {
      const searchable = [
        chef.name,
        chef.location,
        chef.cuisine,
        ...(chef.specialties || []),
      ]
        .join(' ')
        .toLowerCase();

      const queryMatch = searchable.includes(deferredQuery.toLowerCase());
      const ratingValue = Number(chef.rating || 0);
      const ratingMatch =
        filters.rating === 'all' ? true : ratingValue >= Number(filters.rating || 0);
      const cuisineMatch =
        filters.cuisine === 'All'
          ? true
          : [chef.cuisine, ...(chef.specialties || [])].some((item) =>
              String(item || '').toLowerCase().includes(filters.cuisine.toLowerCase())
            );

      return queryMatch && ratingMatch && matchesBudget(chef, filters.budget) && cuisineMatch;
    });
  }, [chefs, deferredQuery, filters.budget, filters.cuisine, filters.rating]);

  return (
    <div className="space-y-8">
      <Card hover={false} className="overflow-hidden p-0">
        <div className="grid gap-6 bg-hero-wash p-8 dark:bg-hero-wash-dark lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">
              Chef discovery
            </p>
            <h1 className="mt-4 font-display text-5xl leading-tight text-slate-950 dark:text-white">
              Reserve a chef who matches your taste and the tone of your table.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">
              Filter by cuisine, budget, and rating, then open a refined booking flow without
              leaving the discovery surface.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ['Curated chefs', `${chefs.length || previewChefs.length}+`],
              ['Premium filters', 'Cuisine, price, rating'],
              ['Booking style', 'Motion modal with live form'],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-[1.7rem] border border-white/60 bg-white/75 p-5 shadow-soft dark:border-white/10 dark:bg-white/5"
              >
                <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
                <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card hover={false}>
        <SectionHeader
          eyebrow="Search filters"
          title="Find the right match faster"
          description="Search by city or chef name, then refine by cuisine, budget and guest expectations."
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_220px_220px]">
          <FloatingInput
            label="Search chef, city or specialty"
            value={filters.query}
            onChange={(event) =>
              startTransition(() =>
                setFilters((currentFilters) => ({
                  ...currentFilters,
                  query: event.target.value,
                }))
              )
            }
          />
          <select
            value={filters.cuisine}
            onChange={(event) =>
              setFilters((currentFilters) => ({
                ...currentFilters,
                cuisine: event.target.value,
              }))
            }
            className="rounded-[1.5rem] border border-white/60 bg-white/80 px-4 py-4 text-sm text-slate-900 shadow-soft outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
          >
            <option>All</option>
            <option>North Indian</option>
            <option>South Indian</option>
            <option>Fusion</option>
            <option>Coastal</option>
            <option>Continental</option>
            <option>Mughlai</option>
          </select>
          <input
            type="date"
            value={filters.date}
            min={new Date().toISOString().split('T')[0]}
            onChange={(event) =>
              setFilters((currentFilters) => ({
                ...currentFilters,
                date: event.target.value,
              }))
            }
            className="rounded-[1.5rem] border border-white/60 bg-white/80 px-4 py-4 text-sm text-slate-900 shadow-soft outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_auto]">
          <div className="flex flex-wrap gap-3">
            {priceFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() =>
                  startTransition(() =>
                    setFilters((currentFilters) => ({
                      ...currentFilters,
                      budget: filter.key,
                    }))
                  )
                }
                className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${
                  filters.budget === filter.key
                    ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                    : 'border border-white/60 bg-white/80 text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            {ratingFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() =>
                  startTransition(() =>
                    setFilters((currentFilters) => ({
                      ...currentFilters,
                      rating: filter.key,
                    }))
                  )
                }
                className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${
                  filters.rating === filter.key
                    ? 'bg-brand text-white shadow-glow'
                    : 'border border-white/60 bg-white/80 text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {previewMode && !loading && (
          <div className="mt-6 rounded-[1.5rem] border border-brand/20 bg-brand/10 px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
            Showing curated sample chef profiles for preview while live discovery is unavailable.
          </div>
        )}
      </Card>

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : filteredChefs.length === 0 ? (
        <Card hover={false} className="text-center">
          <Skeleton className="mx-auto h-14 w-14 rounded-full" />
          <h3 className="mt-5 font-display text-3xl text-slate-950 dark:text-white">
            No chefs match those filters yet
          </h3>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Try widening the budget range or choosing a broader cuisine category.
          </p>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredChefs.map((chef) => (
            <ChefCard key={chef.id} chef={chef} onSelect={onSelectChef} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ChefSearch;
