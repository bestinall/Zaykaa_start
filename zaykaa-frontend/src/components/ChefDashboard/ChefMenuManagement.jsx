import React, { useState } from 'react';
import { chefMenuService } from '../../services/chefMenu';
import Card from '../ui/Card';
import Button from '../ui/Button';
import FloatingInput from '../ui/FloatingInput';
import Modal from '../ui/Modal';
import SmartImage from '../ui/SmartImage';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/display';

const Icon = ({ path, className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {path}
  </svg>
);

const icons = {
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  edit: <><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></>,
  trash: <><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></>,
  utensils: <><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" /></>,
  eye: <path d="M2 12s3-7 10-7 10 7 7 7-7 10 7-7 7-7-10 7-7-10Z" />,
};

const initialFormData = {
  name: '',
  description: '',
  price: '',
  category: 'Main Course',
  image_url: '',
};

const ChefMenuManagement = ({ foods, onRefresh, previewMode }) => {
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  const openEditModal = (food) => {
    setEditingId(food.id);
    setFormData({
      name: food.name || '',
      description: food.description || '',
      price: food.price || '',
      category: food.category || 'Main Course',
      image_url: food.image_url || '',
    });
    setShowModal(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        await chefMenuService.updateFoodItem(editingId, formData);
        toast.success('Menu item updated', 'Your menu now reflects the latest changes.');
      } else {
        await chefMenuService.addFoodItem(formData);
        toast.success('Menu item added', 'Your menu has a new featured dish.');
      }
      setShowModal(false);
      setFormData(initialFormData);
      setEditingId(null);
      onRefresh();
    } catch (error) {
      toast.error('Unable to save item', 'Please try updating the menu again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (foodId) => {
    try {
      await chefMenuService.deleteFoodItem(foodId);
      toast.success('Menu item removed', 'The dish has been removed from your menu.');
      onRefresh();
    } catch (error) {
      toast.error('Unable to delete item', 'Please try again in a moment.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand shadow-soft backdrop-blur dark:border-white/10 dark:bg-white/5">
            <Icon path={icons.utensils} className="h-3 w-3" />
            Menu
          </div>
          <h3 className="mt-2 font-display text-xl text-slate-950 dark:text-white sm:text-2xl">Live menu</h3>
        </div>
        <Button size="sm" onClick={openCreateModal}>
          Add item
        </Button>
      </div>

      {previewMode && (
        <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand">
          Sample menu
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {foods.map((food) => (
          <Card key={food.id} hover={false} padded={false} className="overflow-hidden p-0">
            <SmartImage
              src={food.image_url}
              alt={food.name}
              fallbackText={food.name}
              className="h-32"
            />
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="inline-flex rounded-full border border-white/60 bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand dark:border-white/10 dark:bg-white/5">
                  {food.category}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {food.views || 0} views
                </span>
              </div>
              <h4 className="mt-2 font-display text-sm font-semibold text-slate-950 dark:text-white line-clamp-1">
                {food.name}
              </h4>
              <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300 line-clamp-2">
                {food.description || 'Chef special'}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-950 dark:text-white">
                  {formatCurrency(food.price)}
                </p>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEditModal(food)}>
                    <Icon path={icons.edit} className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(food.id)}>
                    <Icon path={icons.trash} className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Edit menu item' : 'Add menu item'}
        description="Create a menu item with name, description, price, and image."
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FloatingInput label="Food name" name="name" value={formData.name} onChange={handleChange} required />
          <FloatingInput
            label="Description"
            name="description"
            as="textarea"
            value={formData.description}
            onChange={handleChange}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <FloatingInput
              label="Price"
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
            />
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="rounded-[1.2rem] border border-white/60 bg-white/80 px-3 py-2.5 text-sm text-slate-900 shadow-soft outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              <option>Main Course</option>
              <option>Appetizer</option>
              <option>Dessert</option>
              <option>Bread</option>
              <option>Side Dish</option>
              <option>Beverage</option>
            </select>
          </div>
          <FloatingInput
            label="Image URL"
            type="url"
            name="image_url"
            value={formData.image_url}
            onChange={handleChange}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editingId ? 'Update' : 'Add'}
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

export default ChefMenuManagement;
