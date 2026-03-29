import React from 'react';
import Card from '../ui/Card';
import FloatingInput from '../ui/FloatingInput';
import SectionHeader from '../ui/SectionHeader';
import { SkeletonCard } from '../ui/Skeleton';
import RestaurantCard from './RestaurantCard';

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
  <div className="space-y-6">
    <Card hover={false} className="overflow-hidden p-0">
      <div className="grid gap-6 bg-hero-wash p-8 dark:bg-hero-wash-dark lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">
            Restaurant ordering
          </p>
          <h1 className="mt-4 font-display text-5xl leading-tight text-slate-950 dark:text-white">
            Browse restaurants like a premium delivery app, not a basic CRUD list.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">
            Discover kitchens, scan menu sections, add items instantly, and keep checkout visible
            the whole time.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ['Restaurants', String(restaurants.length).padStart(2, '0')],
            ['Sticky cart', 'Live totals'],
            ['Preview ready', previewMode ? 'Sample mode' : 'Live mode'],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-[1.7rem] border border-white/60 bg-white/75 p-5 shadow-soft dark:border-white/10 dark:bg-white/5"
            >
              <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">{value}</p>
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

      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1fr_220px]">
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
          className="rounded-[1.5rem] border border-white/60 bg-white/80 px-4 py-4 text-sm text-slate-900 shadow-soft outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
        >
          {cuisines.map((cuisine) => (
            <option key={cuisine}>{cuisine}</option>
          ))}
        </select>
      </div>

      {previewMode && !loading && (
        <div className="mt-6 rounded-[1.5rem] border border-brand/20 bg-brand/10 px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
          Showing sample restaurants for preview while live restaurant data is unavailable.
        </div>
      )}

      <div className="mt-8 space-y-4">
        {loading ? (
          <div className="grid gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} className="p-4" />
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <Card hover={false} className="text-center">
            <h3 className="font-display text-3xl text-slate-950 dark:text-white">No restaurants found</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Try a broader area or remove the cuisine filter.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
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
