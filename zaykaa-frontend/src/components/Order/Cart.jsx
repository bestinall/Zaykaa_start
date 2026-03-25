// src/components/Order/Cart.jsx
import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { orderService } from '../../services/order';
import '../../styles/Cart.css';

const Cart = ({ onBack }) => {
  const { cart, removeFromCart, updateQuantity, clearCart, getTotalPrice } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (cart.items.length === 0) {
    return (
      <div className="empty-cart">
        <h2>Your cart is empty</h2>
        <p>Add some delicious dishes to get started!</p>
        <button onClick={onBack}>Continue Shopping</button>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError('');

    try {
      const orderData = {
        restaurantId: cart.restaurantId,
        items: cart.items,
        totalAmount: getTotalPrice(),
        deliveryAddress: 'Sample Address', // In real app, get from user
      };

      const response = await orderService.createOrder(orderData);
      
      setSuccess(response.order?.orderReference ? `Order placed successfully (${response.order.orderReference})!` : 'Order placed successfully!');
      clearCart();
      
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = getTotalPrice();
  const tax = subtotal * 0.05; // 5% tax
  const delivery = 40;
  const total = subtotal + tax + delivery;

  return (
    <div className="cart-container">
      <button className="back-btn" onClick={onBack}>← Back</button>

      <h2>Your Order from {cart.restaurantName}</h2>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="cart-items">
        <h3>Items</h3>
        {cart.items.map(item => (
          <div key={item.id} className="cart-item">
            <div className="item-details">
              <h4>{item.name}</h4>
              <p>₹{item.price} each</p>
            </div>

            <div className="quantity-control">
              <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
              <span>{item.quantity}</span>
              <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
            </div>

            <div className="item-price">
              ₹{item.price * item.quantity}
            </div>

            <button 
              className="remove-btn"
              onClick={() => removeFromCart(item.id)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="bill-summary">
        <h3>Bill Summary</h3>
        <div className="summary-row">
          <span>Subtotal:</span>
          <span>₹{subtotal}</span>
        </div>
        <div className="summary-row">
          <span>Tax (5%):</span>
          <span>₹{tax.toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>Delivery:</span>
          <span>₹{delivery}</span>
        </div>
        <div className="summary-row total">
          <span>Total:</span>
          <span>₹{total.toFixed(2)}</span>
        </div>
      </div>

      <button 
        className="place-order-btn"
        onClick={handlePlaceOrder}
        disabled={loading}
      >
        {loading ? 'Placing Order...' : 'Place Order'}
      </button>
    </div>
  );
};

export default Cart;
