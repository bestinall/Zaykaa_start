// src/components/ChefDashboard/RecipesList.jsx
import React, { useState } from 'react';
import { chefService } from '../../services/chef';

const RecipesList = ({ recipes, onRefresh }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Main Course',
    preparationTime: '',
    servings: 2,
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddRecipe = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await chefService.addRecipe(formData);
      setFormData({ name: '', category: 'Main Course', preparationTime: '', servings: 2 });
      setShowAddForm(false);
      onRefresh();
    } catch (err) {
      console.error('Failed to add recipe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recipes-list">
      <div className="list-header">
        <h2>📖 My Recipes</h2>
        <button 
          className="btn-add-recipe"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          + Add Recipe
        </button>
      </div>

      {showAddForm && (
        <form className="add-recipe-form" onSubmit={handleAddRecipe}>
          <div className="form-row">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Recipe name"
              required
            />
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
            >
              <option>Main Course</option>
              <option>Appetizer</option>
              <option>Dessert</option>
              <option>Bread</option>
              <option>Side Dish</option>
            </select>
          </div>
          <div className="form-row">
            <input
              type="text"
              name="preparationTime"
              value={formData.preparationTime}
              onChange={handleInputChange}
              placeholder="e.g., 30 mins"
              required
            />
            <input
              type="number"
              name="servings"
              value={formData.servings}
              onChange={handleInputChange}
              min="1"
              required
            />
          </div>
          <div className="form-actions">
            <button type="submit" disabled={loading}>Save Recipe</button>
            <button type="button" onClick={() => setShowAddForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {recipes.length === 0 ? (
        <div className="empty-state">
          <p>No recipes yet. Add your first recipe!</p>
        </div>
      ) : (
        <div className="recipes-grid">
          {recipes.map(recipe => (
            <div key={recipe.id} className="recipe-card">
              <div className="recipe-header">
                <h3>{recipe.name}</h3>
                <span className="category-tag">{recipe.category}</span>
              </div>
              <div className="recipe-info">
                <p>⏱️ {recipe.preparationTime}</p>
                <p>👥 {recipe.servings} servings</p>
                <p>👁️ {recipe.views} views</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecipesList;
