import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import SmartImage from '../ui/SmartImage';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/display';

const Icon = ({ path, className = 'h-4 w-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {path}
  </svg>
);

const icons = {
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10Z" />
      <circle cx="12" cy="11" r="2.5" />
    </>
  ),
};

const StateDishShowcase = ({ selectedState, stateDishGroups, onOpenRestaurantMenu }) => {
  const { cart, addToCart, updateQuantity } = useCart();

  const totalStateDishes = stateDishGroups.reduce(
    (total, restaurant) => total + restaurant.stateDishes.length,
    0
  );

  const getQuantity = (dishId) =>
    cart.items.find((item) => item.id === dishId)?.quantity || 0;

  if (stateDishGroups.length === 0) {
    return (
      <div className="rounded-[1.6rem] border border-dashed border-white/60 bg-white/70 px-4 py-8 text-center dark:border-white/10 dark:bg-white/5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand">
          State-wise ordering
        </p>
        <h3 className="mt-3 font-display text-xl text-slate-950 dark:text-white">
          No {selectedState} dishes match the current filters
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Try another state or switch to restaurant-wise browsing to explore full menus.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[1.4rem] border border-brand/15 bg-brand/8 px-4 py-3 dark:border-brand/20">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand">
            State-wise ordering
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {totalStateDishes} dishes from {stateDishGroups.length} restaurant
            {stateDishGroups.length === 1 ? '' : 's'} for {selectedState}
          </p>
        </div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Each dish stays linked to its restaurant menu
        </p>
      </div>

      <div className="grid gap-4">
        {stateDishGroups.map((restaurant) => (
          <Card key={restaurant.id} hover={false} padded={false} className="p-4">
            <div className="grid gap-4 lg:grid-cols-[120px_1fr_auto]">
              <SmartImage
                src={restaurant.image}
                alt={restaurant.name}
                fallbackText={restaurant.name}
                className="h-28 rounded-[1.3rem]"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-xl text-slate-950 dark:text-white">
                    {restaurant.name}
                  </h3>
                  <span className="rounded-full border border-orange-200/80 bg-gradient-to-r from-orange-100 to-amber-100 px-2.5 py-1 text-[11px] font-semibold text-orange-700 dark:border-orange-400/30 dark:from-orange-500/15 dark:to-amber-400/10 dark:text-orange-200">
                    {selectedState}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <Icon path={icons.pin} className="h-3.5 w-3.5" />
                    {restaurant.location}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Icon path={icons.clock} className="h-3.5 w-3.5" />
                    {restaurant.deliveryTime || 'Fast delivery'}
                  </span>
                  <span>{Number(restaurant.rating || 0).toFixed(1)} rating</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(restaurant.cuisines || []).slice(0, 3).map((cuisine) => (
                    <span
                      key={`${restaurant.id}-${cuisine}`}
                      className="rounded-full bg-slate-900/5 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300"
                    >
                      {cuisine}
                    </span>
                  ))}
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="self-start"
                onClick={() => onOpenRestaurantMenu(restaurant)}
              >
                Open full menu
              </Button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {restaurant.stateDishes.map((dish) => {
                const quantity = getQuantity(dish.id);

                return (
                  <div
                    key={dish.id}
                    className="rounded-[1.3rem] border border-white/60 bg-white/80 p-4 shadow-soft dark:border-white/10 dark:bg-white/5"
                  >
                    <SmartImage
                      src={dish.image}
                      alt={dish.name}
                      fallbackText={dish.name}
                      className="h-32 rounded-[1.1rem]"
                    />
                    <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand">
                      {dish.category || 'Regional special'}
                    </p>
                    <h4 className="mt-1 font-display text-lg leading-snug text-slate-950 dark:text-white">
                      {dish.name}
                    </h4>
                    <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      {dish.description}
                    </p>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-slate-950 dark:text-white">
                          {formatCurrency(dish.price)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {dish.prepTime || 'Quick prep'}
                        </p>
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
                        <Button
                          type="button"
                          size="sm"
                          onClick={() =>
                            addToCart(
                              { ...dish, orderSource: 'state' },
                              restaurant.id,
                              restaurant.name
                            )
                          }
                        >
                          Add to cart
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StateDishShowcase;
