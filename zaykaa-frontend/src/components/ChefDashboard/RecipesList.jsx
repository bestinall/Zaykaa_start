import React, { useState } from 'react';
import { chefService } from '../../services/chef';
import Card from '../ui/Card';
import Button from '../ui/Button';
import FloatingInput from '../ui/FloatingInput';
import Modal from '../ui/Modal';
import { useToast } from '../../context/ToastContext';

const initialFormData = {
  name: '',
  category: 'Main Course',
  preparationTime: '',
  servings: 2,
};

const RecipesList = ({ recipes, onRefresh, previewMode }) => {
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleAddRecipe = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      await chefService.addRecipe({
        ...formData,
        servings: Number(formData.servings),
      });
      toast.success('Recipe added', 'Your recipe library has been updated.');
      setFormData(initialFormData);
      setShowModal(false);
      onRefresh();
    } catch (error) {
      toast.error('Unable to add recipe', 'Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Recipe library</p>
          <h3 className="mt-3 font-display text-4xl text-slate-950 dark:text-white">Signature recipes</h3>
        </div>
        <Button type="button" onClick={() => setShowModal(true)}>
          Add recipe
        </Button>
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
                <span className="font-medium text-slate-950 dark:text-white">
                  {recipe.preparationTime}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Servings</span>
                <span className="font-medium text-slate-950 dark:text-white">{recipe.servings}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add a signature recipe"
        description="Keep your chef studio updated with dishes you want to highlight."
        size="md"
      >
        <form onSubmit={handleAddRecipe} className="space-y-4">
          <FloatingInput
            label="Recipe name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="rounded-[1.5rem] border border-white/60 bg-white/80 px-4 py-4 text-sm text-slate-900 shadow-soft outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              <option>Main Course</option>
              <option>Appetizer</option>
              <option>Dessert</option>
              <option>Bread</option>
              <option>Side Dish</option>
            </select>
            <FloatingInput
              label="Preparation time"
              name="preparationTime"
              value={formData.preparationTime}
              onChange={handleChange}
              required
            />
          </div>
          <FloatingInput
            label="Servings"
            type="number"
            name="servings"
            min="1"
            value={formData.servings}
            onChange={handleChange}
            required
          />
          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save recipe'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RecipesList;
