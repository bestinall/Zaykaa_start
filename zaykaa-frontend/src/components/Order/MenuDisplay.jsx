import React, { useMemo, useState } from 'react';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import SmartImage from '../ui/SmartImage';
import Button from '../ui/Button';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/display';

const MenuDisplay = ({ restaurant }) => {
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
      <Card hover={false} className="flex min-h-[360px] items-center justify-center text-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Menu</p>
          <h3 className="mt-4 font-display text-4xl text-slate-950 dark:text-white">
            Select a restaurant to view its menu
          </h3>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Once you pick a kitchen, its menu categories and quick add controls will appear here.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card hover={false} className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[300px_1fr]">
          <SmartImage src={restaurant.image} alt={restaurant.name} fallbackText={restaurant.name} className="h-full min-h-[260px]" />
          <div className="bg-hero-wash p-8 dark:bg-hero-wash-dark">
            <SectionHeader
              eyebrow="Selected restaurant"
              title={restaurant.name}
              description={restaurant.offer || 'Signature dishes and curated combos are highlighted below.'}
            />
            <div className="mt-6 flex flex-wrap gap-3">
              {(restaurant.cuisines || []).map((cuisine) => (
                <span
                  key={cuisine}
                  className="rounded-full border border-white/60 bg-white/80 px-3 py-1.5 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                >
                  {cuisine}
                </span>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
              <span>{restaurant.deliveryTime || 'Fast delivery'}</span>
              <span>{Number(restaurant.rating || 0).toFixed(1)} rating</span>
              <span>{restaurant.reviews || 0} reviews</span>
              <span>{dishes.length} dishes</span>
            </div>
          </div>
        </div>
      </Card>

      <Card hover={false}>
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${
                selectedCategory === category
                  ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                  : 'border border-white/60 bg-white/80 text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-2">
          {filteredDishes.map((dish) => {
            const quantity = getQuantity(dish.id);

            return (
              <Card key={dish.id} hover={false} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">
                      {dish.category || 'Chef special'}
                    </p>
                    <h3 className="mt-3 font-display text-2xl text-slate-950 dark:text-white">
                      {dish.name}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {dish.description || 'Freshly prepared menu item from this kitchen.'}
                    </p>
                  </div>
                  <div className="rounded-[1.35rem] bg-slate-900/5 px-4 py-3 text-right dark:bg-white/5">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      Price
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                      {formatCurrency(dish.price)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between gap-4">
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {dish.prepTime || 'Fast prep'} • {dish.spicyLevel || 'Balanced flavors'}
                  </div>
                  {quantity > 0 ? (
                    <div className="inline-flex items-center gap-3 rounded-full border border-white/60 bg-white/80 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(dish.id, quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                      >
                        -
                      </button>
                      <span className="min-w-5 text-center text-sm font-semibold text-slate-900 dark:text-white">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(dish.id, quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <Button onClick={() => addToCart(dish, restaurant.id, restaurant.name)}>Add to cart</Button>
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
