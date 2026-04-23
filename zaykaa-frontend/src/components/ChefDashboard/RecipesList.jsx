import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import { buttonStyles } from '../ui/Button';

const Icon = ({ path, className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {path}
  </svg>
);

const icons = {
  star: <path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.8L6.6 19.7l1-6L3.2 9.4l6.1-.9L12 3z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
};

const RecipesList = ({ recipes, previewMode }) => (
  <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand shadow-soft backdrop-blur dark:border-white/10 dark:bg-white/5">
          <span className="inline-block h-1.5 w-1.5 animate-pulseSoft rounded-full bg-brand" />
          Recipe library
        </div>
        <h3 className="mt-2 font-display text-xl text-slate-950 dark:text-white sm:text-2xl">Your recipes</h3>
        <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          Manage your signature dishes from the Recipe Book
        </p>
      </div>
      <Link to="/recipes" className={buttonStyles()}>
        Open Recipe Book
      </Link>
    </div>

    {previewMode && (
      <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand">
        <Icon path={icons.star} className="h-3 w-3" />
        Sample recipes
      </div>
    )}

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {recipes.map((recipe) => (
        <Card key={recipe.id} hover={false} padded={false} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="inline-flex rounded-full border border-white/60 bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand dark:border-white/10 dark:bg-white/5">
                {recipe.category}
              </span>
              <h4 className="mt-2 font-display text-sm font-semibold text-slate-950 dark:text-white line-clamp-1">
                {recipe.name}
              </h4>
            </div>
            <span className="flex items-center gap-1 rounded-full border border-white/60 bg-white/80 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
              <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 fill-current">
                <path d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              {recipe.views || 0}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Icon path={icons.clock} className="h-3 w-3 shrink-0" />
              <span className="truncate">{recipe.preparationTime}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Icon path={icons.users} className="h-3 w-3 shrink-0" />
              <span>{recipe.servings} servings</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

export default RecipesList;
