// src/pages/OrderPage.jsx
import React, { useState } from 'react';
import Header from '../components/Common/Header';
import RestaurantBrowse from '../components/Order/RestaurantBrowse';
import MenuDisplay from '../components/Order/MenuDisplay';
import Cart from '../components/Order/Cart';
import { useCart } from '../context/CartContext';

const OrderPage = () => {
  const [view, setView] = useState('browse'); // browse, menu, cart
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const { cart } = useCart();

  const handleSelectRestaurant = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setView('menu');
  };

  const handleBack = () => {
    if (view === 'menu') {
      setView('browse');
      setSelectedRestaurant(null);
    } else if (view === 'cart') {
      setView('menu');
    }
  };

  return (
    <>
      <Header />
      <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '40px' }}>
        {view === 'browse' && (
          <RestaurantBrowse onSelectRestaurant={handleSelectRestaurant} />
        )}

        {view === 'menu' && selectedRestaurant && (
          <>
            <MenuDisplay restaurant={selectedRestaurant} onBack={handleBack} />
            
            {cart.items.length > 0 && (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <button 
                  onClick={() => setView('cart')}
                  style={{
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    padding: '12px 30px',
                    borderRadius: '5px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  View Cart ({cart.items.length} items)
                </button>
              </div>
            )}
          </>
        )}

        {view === 'cart' && (
          <Cart onBack={handleBack} />
        )}
      </div>
    </>
  );
};

export default OrderPage;
