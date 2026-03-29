import React, { useState } from 'react';
import { chefMenuService } from '../../services/chefMenu';
import Card from '../ui/Card';
import Button from '../ui/Button';
import FloatingInput from '../ui/FloatingInput';
import Modal from '../ui/Modal';
import SmartImage from '../ui/SmartImage';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/display';

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Live menu</p>
          <h3 className="mt-3 font-display text-4xl text-slate-950 dark:text-white">Menu management</h3>
        </div>
        <Button type="button" onClick={openCreateModal}>
          Add food item
        </Button>
      </div>

      {previewMode && (
        <div className="rounded-[1.5rem] border border-brand/20 bg-brand/10 px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
          Showing sample menu items while the live chef menu is unavailable.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {foods.map((food) => (
          <Card key={food.id} hover={false} className="overflow-hidden p-0">
            <SmartImage
              src={food.image_url}
              alt={food.name}
              fallbackText={food.name}
              className="h-52"
            />
            <div className="space-y-5 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">
                    {food.category}
                  </p>
                  <h4 className="mt-3 font-display text-2xl text-slate-950 dark:text-white">
                    {food.name}
                  </h4>
                </div>
                <span className="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-white/5 dark:text-slate-200">
                  {food.views || 0} views
                </span>
              </div>

              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                {food.description || 'Chef special with a custom description.'}
              </p>

              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-slate-950 dark:text-white">
                  {formatCurrency(food.price)}
                </p>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="secondary" onClick={() => openEditModal(food)}>
                    Edit
                  </Button>
                  <Button type="button" size="sm" variant="danger" onClick={() => handleDelete(food.id)}>
                    Delete
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
        description="Create a polished menu card with a short description, price, and image."
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
          <div className="grid gap-4 sm:grid-cols-2">
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
              className="rounded-[1.5rem] border border-white/60 bg-white/80 px-4 py-4 text-sm text-slate-900 shadow-soft outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
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
          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editingId ? 'Update item' : 'Add item'}
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
