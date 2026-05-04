import React, { useMemo, useState } from 'react';
import Card from '../ui/Card';
import SmartImage from '../ui/SmartImage';
import Button from '../ui/Button';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/display';

const Icon = ({ path, className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {path}
  </svg>
);

const icons = {
  bowl: <><path d="M3 11h18" /><path d="M5 11a7 7 0 0 0 14 0" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  star: <path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.8L6.6 19.7l1-6L3.2 9.4l6.1-.9L12 3z" />,
};

const MenuDisplay = ({ restaurant, selectedState }) => {
  const { cart, addToCart, updateQuantity } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('All');

  const dishes = useMemo(() => restaurant?.dishes || restaurant?.menu || [], [restaurant]);
  const categories = useMemo(
    () => ['All', ...new Set(dishes.map((dish) => dish.category).filter(Boolean))],
    [dishes]
  );
  const filteredDishes =
    selectedCategory === 'All'
      ? dishes
      : dishes.filter((dish) => dish.category === selectedCategory);

  const getQuantity = (dishId) => cart.items.find((item) => item.id === dishId)?.quantity || 0;

  if (!restaurant) {
    return (
      <Card hover={false} className="flex min-h-[280px] items-center justify-center p-8 text-center">
        <div>
          <div className="flex justify-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              <Icon path={icons.bowl} className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand">Menu</p>
          <h3 className="mt-2 font-display text-xl text-slate-950 dark:text-white">
            Select a restaurant to view its menu
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Once you pick a kitchen, its menu categories and quick add controls will appear here.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card hover={false} className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[240px_1fr]">
          <SmartImage
            src={restaurant.image}
            alt={restaurant.name}
            fallbackText={restaurant.name}
            className="h-full min-h-[180px]"
          />
          <div className="bg-hero-wash p-5 dark:bg-hero-wash-dark sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand">Selected restaurant</p>
            <h2 className="mt-2 font-display text-2xl leading-snug text-slate-950 dark:text-white sm:text-3xl">
              {restaurant.name}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300 line-clamp-2">
              {restaurant.offer || 'Signature dishes and curated combos are highlighted below.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(restaurant.cuisines || []).map((cuisine) => (
                <span
                  key={cuisine}
                  className="rounded-full bg-slate-900/5 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300"
                >
                  {cuisine}
                </span>
              ))}
              {selectedState && (
                <span className="rounded-full border border-orange-200/80 bg-gradient-to-r from-orange-100 to-amber-100 px-2.5 py-1 text-xs font-medium text-orange-700 dark:border-orange-400/30 dark:from-orange-500/15 dark:to-amber-400/10 dark:text-orange-200">
                  Regional focus: {selectedState}
                </span>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Icon path={icons.clock} className="h-3.5 w-3.5" />
                {restaurant.deliveryTime || 'Fast delivery'}
              </span>
              <span>&bull;</span>
              <span className="inline-flex items-center gap-1">
                <Icon path={icons.star} className="h-3.5 w-3.5" />
                {Number(restaurant.rating || 0).toFixed(1)} rating
              </span>
              <span>&bull;</span>
              <span>{dishes.length} dishes</span>
            </div>
          </div>
        </div>
      </Card>

      <Card hover={false}>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                selectedCategory === category
                  ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                  : 'border border-white/60 bg-white/80 text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {filteredDishes.map((dish) => {
            const quantity = getQuantity(dish.id);
            const stateIsActive = selectedState && dish.originState === selectedState;

            return (
              <Card key={dish.id} hover={false} padded={false} className="p-4">
                <SmartImage
                  src={dish.image}
                  alt={dish.name}
                  fallbackText={dish.name}
                  className="h-36 rounded-[1.2rem]"
                />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand">
                      {dish.category || 'Chef special'}
                    </p>
                    <h3 className="mt-1 font-display text-lg leading-snug text-slate-950 dark:text-white line-clamp-2">
                      {dish.name}
                    </h3>
                    <p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400 line-clamp-2">
                      {dish.description || 'Freshly prepared menu item from this kitchen.'}
                    </p>
                    {dish.originState && (
                      <div className="mt-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                            stateIsActive
                              ? 'border border-orange-200/80 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 dark:border-orange-400/30 dark:from-orange-500/15 dark:to-amber-400/10 dark:text-orange-200'
                              : 'bg-slate-900/5 text-slate-600 dark:bg-white/10 dark:text-slate-300'
                          }`}
                        >
                          {dish.originState}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="rounded-[1.2rem] bg-slate-900/5 px-3 py-2 text-right dark:bg-white/5">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      Price
                    </p>
                    <p className="mt-1 text-base font-semibold text-slate-950 dark:text-white">
                      {formatCurrency(dish.price)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Icon path={icons.clock} className="h-3.5 w-3.5" />
                    <span>{dish.prepTime || 'Fast prep'}</span>
                  </div>
                  {quantity > 0 ? (
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-2.5 py-1 dark:border-white/10 dark:bg-white/5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(dish.id, quantity - 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                      >
                        -
                      </button>
                      <span className="min-w-4 text-center text-xs font-semibold text-slate-900 dark:text-white">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(dish.id, quantity + 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <Button size="sm" onClick={() => addToCart(dish, restaurant.id, restaurant.name)}>
                      Add to cart
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default MenuDisplay;
