// src/context/CartContext.js
import React, { createContext, useEffect, useState, useContext } from 'react';

const CartContext = createContext();
const STORAGE_KEY = 'zaykaa-cart';

const emptyCart = {
  restaurantId: null,
  restaurantName: '',
  items: [],
};

const getInitialCart = () => {
  if (typeof window === 'undefined') {
    return emptyCart;
  }

  try {
    const storedCart = window.localStorage.getItem(STORAGE_KEY);
    if (!storedCart) {
      return emptyCart;
    }

    const parsedCart = JSON.parse(storedCart);
    return {
      ...emptyCart,
      ...parsedCart,
      items: Array.isArray(parsedCart.items) ? parsedCart.items : [],
    };
  } catch (error) {
    return emptyCart;
  }
};

export const useCart = () => {
  return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(getInitialCart);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToCart = (dish, restaurantId, restaurantName) => {
    setCart(prev => {
      const dishWithSource = {
        ...dish,
        restaurantId,
        restaurantName,
        orderSource: dish.orderSource || 'restaurant',
      };

      // If switching restaurants, clear cart
      if (prev.restaurantId && prev.restaurantId !== restaurantId) {
        return {
          restaurantId,
          restaurantName,
          items: [{ ...dishWithSource, quantity: 1 }],
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
        items: [...prev.items, { ...dishWithSource, quantity: 1 }],
      };
    });
  };

  const removeFromCart = (dishId) => {
    setCart((prev) => {
      const items = prev.items.filter((item) => item.id !== dishId);
      return items.length > 0 ? { ...prev, items } : { ...emptyCart };
    });
  };

  const updateQuantity = (dishId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(dishId);
      return;
    }

    setCart((prev) => {
      const items = prev.items.map((item) =>
        item.id === dishId ? { ...item, quantity } : item
      );

      return items.length > 0 ? { ...prev, items } : { ...emptyCart };
    });
  };

  const clearCart = () => {
    setCart(emptyCart);
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
