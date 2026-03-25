// src/components/ChefDashboard/ChefMenuManagement.jsx
import React, { useState, useEffect } from 'react';
import { chefMenuService } from '../../services/chefMenu';
import '../../styles/ChefMenuManagement.css';

const ChefMenuManagement = () => {
  const [foods, setFoods] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Main Course',
    image_url: '',
  });

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      const response = await chefMenuService.getMyMenu();
      setFoods(response.foods || []);
    } catch (err) {
      setMessage('Failed to load menu ❌');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        await chefMenuService.updateFoodItem(editingId, formData);
        setMessage('Food item updated ✅');
      } else {
        await chefMenuService.addFoodItem(formData);
        setMessage('Food item added ✅');
      }

      setFormData({ name: '', description: '', price: '', category: 'Main Course', image_url: '' });
      setShowForm(false);
      setEditingId(null);
      loadMenu();

      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(editingId ? 'Failed to update ❌' : 'Failed to add food ❌');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (food) => {
    setFormData(food);
    setEditingId(food.id);
    setShowForm(true);
  };

  const handleDelete = async (foodId) => {
    if (window.confirm('Delete this food item?')) {
      try {
        await chefMenuService.deleteFoodItem(foodId);
        setMessage('Food item deleted ✅');
        loadMenu();
      } catch (err) {
        setMessage('Failed to delete ❌');
      }
    }
  };

  return (
    <div className="menu-management">
      <div className="menu-header">
        <h2>🍽️ My Menu</h2>
        <button 
          className="btn-add-food"
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ name: '', description: '', price: '', category: 'Main Course', image_url: '' });
          }}
        >
          + Add Food Item
        </button>
      </div>

      {message && <div className="message">{message}</div>}

      {showForm && (
        <form className="food-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Food Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Butter Chicken"
                required
              />
            </div>
            <div className="form-group">
              <label>Price (₹) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="350"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select name="category" value={formData.category} onChange={handleInputChange}>
                <option>Main Course</option>
                <option>Appetizer</option>
                <option>Dessert</option>
                <option>Bread</option>
                <option>Side Dish</option>
                <option>Beverage</option>
              </select>
            </div>
            <div className="form-group">
              <label>Image URL</label>
              <input
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleInputChange}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="e.g., Tender chicken in creamy tomato sauce with butter"
              rows="3"
            />
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editingId ? 'Update Item' : 'Add Item'}
            </button>
            <button 
              type="button" 
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="foods-grid">
        {foods.length === 0 ? (
          <div className="empty">No food items yet. Add your first item!</div>
        ) : (
          foods.map(food => (
            <div key={food.id} className="food-card">
              <div className="food-image">
                <img src={food.image_url} alt={food.name} />
              </div>
              <div className="food-info">
                <h3>{food.name}</h3>
                <p className="category">{food.category}</p>
                <p className="description">{food.description}</p>
                <div className="food-footer">
                  <span className="price">₹{food.price}</span>
                  <span className="views">👁️ {food.views}</span>
                </div>
              </div>
              <div className="food-actions">
                <button 
                  className="btn-edit"
                  onClick={() => handleEdit(food)}
                >
                  ✏️ Edit
                </button>
                <button 
                  className="btn-delete"
                  onClick={() => handleDelete(food.id)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChefMenuManagement;
