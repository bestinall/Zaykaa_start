import React from 'react';
import Card from '../ui/Card';
import FloatingInput from '../ui/FloatingInput';
import SectionHeader from '../ui/SectionHeader';
import { SkeletonCard } from '../ui/Skeleton';
import RestaurantCard from './RestaurantCard';

const Icon = ({ path, className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {path}
  </svg>
);

const icons = {
  search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></>,
  location: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>,
  bowl: <><path d="M3 11h18" /><path d="M5 11a7 7 0 0 0 14 0" /></>,
  star: <path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.8L6.6 19.7l1-6L3.2 9.4l6.1-.9L12 3z" />,
};

const RestaurantBrowse = ({
  restaurants,
  loading,
  previewMode,
  searchQuery,
  onSearchQueryChange,
  location,
  onLocationChange,
  selectedCuisine,
  cuisines,
  onCuisineChange,
  selectedRestaurant,
  onSelectRestaurant,
}) => (
  <div className="space-y-5">
    <Card hover={false} className="overflow-hidden p-0">
      <div className="grid gap-0 bg-hero-wash p-5 dark:bg-hero-wash-dark sm:p-6 lg:grid-cols-[1fr_0.6fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand shadow-soft backdrop-blur dark:border-white/10 dark:bg-white/5">
            <span className="inline-block h-1.5 w-1.5 animate-pulseSoft rounded-full bg-brand" />
            Order food
          </div>
          <h1 className="mt-4 font-display text-2xl leading-tight text-slate-950 dark:text-white sm:text-3xl">
            Browse restaurants like a premium delivery app
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Discover kitchens, scan menu sections, add items instantly, and keep checkout visible.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 lg:content-center">
          {[
            { label: 'Restaurants', value: String(restaurants.length).padStart(2, '0'), icon: icons.bowl },
            { label: 'Sticky cart', value: 'Live', icon: icons.star, tone: 'live' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/60 bg-white/75 p-3 shadow-soft dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <Icon path={stat.icon} className="h-3.5 w-3.5" />
                </span>
                {stat.tone === 'live' && (
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                )}
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
        eyebrow="Discover kitchens"
        title="Search by area, restaurant name, or cuisine"
        description="Left-side discovery keeps restaurant browsing visible while the cart stays pinned on the right."
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_180px]">
        <FloatingInput
          label="Search restaurant or cuisine"
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
        />
        <FloatingInput
          label="Delivery area"
          value={location}
          onChange={(event) => onLocationChange(event.target.value)}
        />
        <select
          value={selectedCuisine}
          onChange={(event) => onCuisineChange(event.target.value)}
          className="rounded-[1.2rem] border border-white/60 bg-white/80 px-3 py-2.5 text-sm text-slate-900 shadow-soft outline-none transition dark:border-white/10 dark:bg-white/5 dark:text-white"
        >
          {cuisines.map((cuisine) => (
            <option key={cuisine}>{cuisine}</option>
          ))}
        </select>
      </div>

      {previewMode && !loading && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand-deep dark:text-amber-200">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
          Showing sample restaurants for preview
        </div>
      )}

      <div className="mt-5 space-y-3">
        {loading ? (
          <div className="grid gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonCard key={index} className="p-4" />
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <Card hover={false} className="text-center p-8">
            <div className="flex justify-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                <Icon path={icons.search} className="h-5 w-5" />
              </span>
            </div>
            <h3 className="mt-4 font-display text-xl text-slate-950 dark:text-white">No restaurants found</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Try a broader area or remove the cuisine filter.
            </p>
          </Card>
        ) : (
          <div className="grid gap-3">
            {restaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onSelect={onSelectRestaurant}
                isActive={selectedRestaurant?.id === restaurant.id}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  </div>
);

export default RestaurantBrowse;
