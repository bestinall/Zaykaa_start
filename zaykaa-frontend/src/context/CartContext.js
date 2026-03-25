// src/context/CartContext.js
import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export const useCart = () => {
  return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({
    restaurantId: null,
    restaurantName: '',
    items: [],
  });

  const addToCart = (dish, restaurantId, restaurantName) => {
    setCart(prev => {
      // If switching restaurants, clear cart
      if (prev.restaurantId && prev.restaurantId !== restaurantId) {
        return {
          restaurantId,
          restaurantName,
          items: [{ ...dish, quantity: 1 }],
        };
      }

      // Check if item already exists
      const existingItem = prev.items.find(item => item.id === dish.id);

      if (existingItem) {
        // Increase quantity
        return {
          ...prev,
          items: prev.items.map(item =>
            item.id === dish.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }

      // Add new item
      return {
        ...prev,
        restaurantId,
        restaurantName,
        items: [...prev.items, { ...dish, quantity: 1 }],
      };
    });
  };

  const removeFromCart = (dishId) => {
    setCart(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== dishId),
    }));
  };

  const updateQuantity = (dishId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(dishId);
      return;
    }

    setCart(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === dishId
          ? { ...item, quantity }
          : item
      ),
    }));
  };

  const clearCart = () => {
    setCart({
      restaurantId: null,
      restaurantName: '',
      items: [],
    });
  };

  const getTotalPrice = () => {
    return cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
