import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import { buttonStyles } from '../ui/Button';

const RecipesList = ({ recipes, previewMode }) => (
  <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Recipe library</p>
        <h3 className="mt-3 font-display text-4xl text-slate-950 dark:text-white">Signature recipes</h3>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
          Your full create, edit, and delete workflow now lives in the shared Recipe Book so chefs
          and sellers use one consistent publishing experience.
        </p>
      </div>
      <Link to="/recipes" className={buttonStyles()}>
        Open Recipe Book
      </Link>
    </div>

    {previewMode && (
      <div className="rounded-[1.5rem] border border-brand/20 bg-brand/10 px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
        Showing sample recipes while live chef recipes are unavailable.
      </div>
    )}

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {recipes.map((recipe) => (
        <Card key={recipe.id} hover={false} className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">
                {recipe.category}
              </p>
              <h4 className="mt-3 font-display text-2xl text-slate-950 dark:text-white">
                {recipe.name}
              </h4>
            </div>
            <span className="rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
              {recipe.views || 0} views
            </span>
          </div>
          <div className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-center justify-between">
              <span>Preparation</span>
              <span className="font-medium text-slate-950 dark:text-white">{recipe.preparationTime}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Servings</span>
              <span className="font-medium text-slate-950 dark:text-white">{recipe.servings}</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

export default RecipesList;
