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
  { key: 'under1800', label: 'Under ₹1,800' },
  { key: '1800to2400', label: '₹1,800-2,400' },
  { key: '2400plus', label: 'Above ₹2,400' },
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

const Icon = ({ path, className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {path}
  </svg>
);

const icons = {
  star: <path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.8L6.6 19.7l1-6L3.2 9.4l6.1-.9L12 3z" />,
  search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
  filter: <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></>,
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

        // FIX: If API returns empty array, show preview data
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
        toast.info('Preview mode', 'Live chef discovery is unavailable right now.');
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
    <div className="space-y-4">
      <Card hover={false} className="overflow-hidden p-0">
        <div className="grid gap-4 bg-hero-wash p-5 dark:bg-hero-wash-dark sm:grid-cols-[1fr_0.5fr] sm:p-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand shadow-soft backdrop-blur dark:border-white/10 dark:bg-white/5">
              <span className="inline-block h-1.5 w-1.5 animate-pulseSoft rounded-full bg-brand" />
              Chef discovery
            </div>
            <h1 className="mt-3 font-display text-xl leading-tight text-slate-950 dark:text-white sm:text-2xl">
              Reserve a chef who matches your taste
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300 line-clamp-2">
              Filter by cuisine, budget, and rating, then open a refined booking flow.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:content-center">
            {[
              { label: 'Chefs', value: String(chefs.length || previewChefs.length), icon: icons.star },
              { label: 'Filters', value: 'Live', icon: icons.filter },
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
          eyebrow="Search filters"
          title="Find the right match faster"
          description="Search by city or chef name, then refine by cuisine, budget and rating."
        />

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
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
            className="rounded-[1.2rem] border border-white/60 bg-white/80 px-3 py-2.5 text-sm text-slate-900 shadow-soft outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
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
            className="rounded-[1.2rem] border border-white/60 bg-white/80 px-3 py-2.5 text-sm text-slate-900 shadow-soft outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
          <div className="flex flex-wrap gap-2">
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
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  filters.budget === filter.key
                    ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                    : 'border border-white/60 bg-white/80 text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
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
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
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
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand">
            <Icon path={icons.star} className="h-3 w-3" />
            Showing sample chefs
          </div>
        )}
      </Card>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : filteredChefs.length === 0 ? (
        <Card hover={false} className="text-center p-6">
          <div className="flex justify-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              <Icon path={icons.search} className="h-5 w-5" />
            </span>
          </div>
          <h3 className="mt-3 font-display text-lg text-slate-950 dark:text-white">
            No chefs match those filters
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Try widening the budget range or choosing a broader cuisine category.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredChefs.map((chef) => (
            <ChefCard key={chef.id} chef={chef} onSelect={onSelectChef} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ChefSearch;
