import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Card from '../ui/Card';
import FloatingInput from '../ui/FloatingInput';
import SectionHeader from '../ui/SectionHeader';
import { SkeletonCard } from '../ui/Skeleton';
import { cn } from '../../utils/cn';
import IndiaFoodMap from './IndiaFoodMap';
import RestaurantCard from './RestaurantCard';
import StateDishShowcase from './StateDishShowcase';

const Icon = ({ path, className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {path}
  </svg>
);

const icons = {
  search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></>,
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
  browseMode,
  onBrowseModeChange,
  selectedState,
  onStateSelect,
  regionalShowcase,
  stateRestaurantCount,
  stateDishGroups,
  selectedRestaurant,
  onSelectRestaurant,
  onOpenRestaurantMenu,
}) => {
  const activeRegion =
    regionalShowcase.find((region) => region.state === selectedState) || regionalShowcase[0];
  const stateDishCount = stateDishGroups.reduce(
    (total, restaurant) => total + restaurant.stateDishes.length,
    0
  );

  return (
    <div className="space-y-5">
      <Card hover={false} className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="bg-hero-wash p-5 dark:bg-hero-wash-dark sm:p-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand shadow-soft backdrop-blur dark:border-white/10 dark:bg-white/5">
              <span className="inline-block h-1.5 w-1.5 animate-pulseSoft rounded-full bg-brand" />
              Regional food trail
            </div>
            <h1 className="mt-4 font-display text-2xl leading-tight text-slate-950 dark:text-white sm:text-3xl">
              Explore India through the dishes each state is known for
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Pick a state from the India map and the left panel will surface its signature foods before
              you jump into the restaurant flow.
            </p>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeRegion.state}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="mt-5 rounded-[2rem] border border-white/70 bg-white/[0.76] p-5 shadow-soft backdrop-blur dark:border-white/10 dark:bg-white/[0.06]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand">
                      {activeRegion.belt}
                    </p>
                    <h2 className="mt-2 font-display text-2xl leading-tight text-slate-950 dark:text-white">
                      {activeRegion.state}
                    </h2>
                  </div>
                  <div className="rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-amber-300 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white shadow-soft">
                    Featured state
                  </div>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {activeRegion.description}
                </p>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {activeRegion.specialties.map((specialty) => (
                    <div
                      key={`${activeRegion.state}-${specialty.name}`}
                      className="rounded-[1.4rem] border border-white/65 bg-white/75 p-3 shadow-soft dark:border-white/10 dark:bg-white/5"
                    >
                      <p className="text-sm font-semibold text-slate-950 dark:text-white">{specialty.name}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{specialty.note}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-brand/20 bg-brand/10 px-3 py-1.5 font-medium text-brand-deep dark:text-amber-200">
                    {regionalShowcase.length} states curated
                  </span>
                  <span className="rounded-full border border-white/60 bg-white/80 px-3 py-1.5 font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                    {stateRestaurantCount > 0
                      ? `${stateRestaurantCount} matching kitchens in the browse list`
                      : 'Regional spotlight extends beyond current kitchen inventory'}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center border-t border-white/60 bg-white/[0.34] p-3 dark:border-white/10 dark:bg-white/[0.03] sm:p-5 lg:border-l lg:border-t-0 lg:p-6">
            <IndiaFoodMap
              regionalStates={regionalShowcase}
              selectedState={activeRegion.state}
              onSelectState={onStateSelect}
            />
          </div>
        </div>
      </Card>

      <Card hover={false}>
        <SectionHeader
          eyebrow={browseMode === 'state' ? 'Discover regional dishes' : 'Discover kitchens'}
          title={
            browseMode === 'state'
              ? `Choose ${activeRegion.state} dishes by restaurant`
              : 'Search by area, restaurant name, or cuisine'
          }
          description={
            browseMode === 'state'
              ? 'Browse orderable dishes from the selected state, with every item attached to the restaurant that prepares it.'
              : 'Browse kitchens directly, then open a full menu to order restaurant by restaurant.'
          }
          action={
            <div className="inline-flex rounded-full border border-white/65 bg-white/80 p-1 shadow-soft dark:border-white/10 dark:bg-white/5">
              {[
                { key: 'state', label: 'State wise' },
                { key: 'restaurant', label: 'Restaurant wise' },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => onBrowseModeChange(option.key)}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-semibold transition',
                    browseMode === option.key
                      ? 'bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950'
                      : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          }
        />

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_220px_200px]">
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
            value={selectedState}
            onChange={(event) => onStateSelect(event.target.value)}
            className="rounded-[1.2rem] border border-white/60 bg-white/80 px-3 py-2.5 text-sm text-slate-900 shadow-soft outline-none transition dark:border-white/10 dark:bg-white/5 dark:text-white"
          >
            {regionalShowcase.map((region) => (
              <option key={region.state} value={region.state}>
                {region.state}
              </option>
            ))}
          </select>
          <select
            value={selectedCuisine}
            onChange={(event) => onCuisineChange(event.target.value)}
            className="rounded-[1.2rem] border border-white/60 bg-white/80 px-3 py-2.5 text-sm text-slate-900 shadow-soft outline-none transition dark:border-white/10 dark:bg-white/5 dark:text-white"
          >
            {cuisines.map((cuisine) => (
              <option key={cuisine}>
                {cuisine === 'All' ? 'All cuisines' : cuisine}
              </option>
            ))}
          </select>
        </div>

        {previewMode && !loading && (
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand-deep dark:text-amber-200">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
              Showing sample restaurants for preview
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/70 bg-orange-100/70 px-3 py-1.5 text-xs font-medium text-orange-700 dark:border-orange-400/30 dark:bg-orange-500/10 dark:text-orange-200">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-500" />
              Regional focus: {activeRegion.state}
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-100/80 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-500" />
              {stateDishCount} state-wise dishes ready to order
            </div>
          </div>
        )}

        <div className="mt-5 space-y-3">
          {loading ? (
            <div className="grid gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <SkeletonCard key={index} className="p-4" />
              ))}
            </div>
          ) : browseMode === 'state' ? (
            <StateDishShowcase
              selectedState={activeRegion.state}
              stateDishGroups={stateDishGroups}
              onOpenRestaurantMenu={onOpenRestaurantMenu}
            />
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
                  selectedState={activeRegion.state}
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
};

export default RestaurantBrowse;
