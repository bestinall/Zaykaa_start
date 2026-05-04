import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card';
import Button from '../ui/Button';
import FloatingInput from '../ui/FloatingInput';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { orderService } from '../../services/order';
import { previewCoupons } from '../../data/mockData';
import { formatCurrency } from '../../utils/display';
import AddressModal from '../AddressModal';
import { clearPaymentDraft, getPaymentDraft, savePaymentDraft } from '../../utils/paymentDraft';

const Cart = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, getTotalPrice } = useCart();
  const toast = useToast();

  const [showMap, setShowMap] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(() => getPaymentDraft()?.selectedAddress || null);
  const [couponCode, setCouponCode] = useState(() => getPaymentDraft()?.couponCode || '');
  const [appliedCoupon, setAppliedCoupon] = useState(() => getPaymentDraft()?.appliedCoupon || null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);

  const userEmail = localStorage.getItem('user_email') || 'guest';
  const storageKey = `user_addresses_${userEmail}`;

  const saveAddress = (location) => {
    const existing = JSON.parse(localStorage.getItem(storageKey)) || [];
    const alreadyExists = existing.find((item) => item.address === location.address);

    if (!alreadyExists) {
      localStorage.setItem(storageKey, JSON.stringify([...existing, location]));
    }
  };

  const subtotal = getTotalPrice();
  const tax = subtotal * 0.05;
  const delivery = cart.items.length > 0 ? 45 : 0;

  const discount = useMemo(() => {
    if (!appliedCoupon) {
      return 0;
    }

    if (appliedCoupon.type === 'percent') {
      return subtotal * (Number(appliedCoupon.value || 0) / 100);
    }

    return Number(appliedCoupon.value || 0);
  }, [appliedCoupon, subtotal]);

  const total = Math.max(subtotal + tax + delivery - discount, 0);

  useEffect(() => {
    if (cart.items.length === 0) {
      clearPaymentDraft();
    }
  }, [cart.items.length]);

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();

    if (!code) {
      toast.info('Enter a coupon');
      return;
    }

    setCouponLoading(true);

    try {
      const response = await orderService.validateCoupon({
        code,
        subtotal,
        restaurantId: cart.restaurantId,
      });
      const coupon = response.coupon || previewCoupons[code];

      if (!coupon) {
        toast.error('Invalid coupon');
        return;
      }

      setAppliedCoupon(coupon);
      toast.success('Coupon applied');
    } catch {
      const fallbackCoupon = previewCoupons[code];

      if (fallbackCoupon) {
        setAppliedCoupon(fallbackCoupon);
        toast.info('Preview coupon applied');
      } else {
        toast.error('Invalid coupon');
      }
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!cart.restaurantId || cart.items.length === 0) {
      toast.info('Cart is empty');
      return;
    }

    if (!selectedAddress?.address) {
      toast.info('Please select address');
      setShowMap(true);
      return;
    }

    setOrderLoading(true);

    const paymentDraft = {
      restaurantId: cart.restaurantId,
      restaurantName: cart.restaurantName,
      items: cart.items,
      subtotal,
      tax,
      delivery,
      discount,
      totalAmount: total,
      couponCode: appliedCoupon?.code || '',
      appliedCoupon,
      selectedAddress,
      deliveryAddress: selectedAddress.address,
      createdAt: new Date().toISOString(),
    };

    savePaymentDraft(paymentDraft);
    navigate('/payment', { state: { paymentDraft } });
    setOrderLoading(false);
  };

  return (
    <Card className="flex flex-col bg-white text-black dark:bg-gray-900 dark:text-white">
      <div className="border-b p-4">
        <h2 className="text-xl font-bold">Your Cart</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {cart.restaurantName
            ? `Ordering from ${cart.restaurantName}`
            : `${cart.items.length} item(s)`}
        </p>
      </div>

      <div className="space-y-4 p-4">
        {cart.items.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-lg font-semibold">Your cart is empty</p>
          </div>
        ) : (
          <>
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-gray-500">{formatCurrency(item.price)}</p>
                    {item.restaurantName && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.orderSource === 'state'
                          ? `State-wise pick from ${item.restaurantName}`
                          : `From ${item.restaurantName}`}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="text-sm text-red-500"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 dark:bg-gray-700">
                    <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                      +
                    </button>
                  </div>

                  <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              </div>
            ))}

            <FloatingInput
              label="Coupon"
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value)}
            />

            <Button
              onClick={applyCoupon}
              disabled={couponLoading || !couponCode.trim()}
              className={`w-full py-2 ${
                couponLoading || !couponCode.trim()
                  ? 'bg-gray-300 text-gray-600'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
              }`}
            >
              {couponLoading ? 'Checking...' : 'Apply Coupon'}
            </Button>

            <div className="rounded-xl bg-gray-100 p-4 dark:bg-gray-800">
              <p>Subtotal: {formatCurrency(subtotal)}</p>
              <p>Tax: {formatCurrency(tax)}</p>
              <p>Delivery: {formatCurrency(delivery)}</p>
              <p>Discount: -{formatCurrency(discount)}</p>
              <h3 className="text-lg font-bold">Total: {formatCurrency(total)}</h3>
            </div>

            <button
              type="button"
              onClick={() => setShowMap(true)}
              className="w-full rounded-lg border border-dashed py-2 text-sm text-gray-600 dark:text-gray-300"
            >
              {selectedAddress ? 'Change Address' : 'Add Address'}
            </button>

            {selectedAddress && (
              <div className="text-sm text-green-600">
                Delivery address: {selectedAddress.address}
              </div>
            )}
          </>
        )}
      </div>

      {cart.items.length > 0 && (
        <div className="border-t bg-white p-4 dark:bg-gray-900">
          <Button
            onClick={handlePlaceOrder}
            className="w-full rounded-xl bg-black py-3 text-white shadow-md dark:bg-white dark:text-black"
          >
            {orderLoading ? 'Proceeding...' : `Proceed to Payment - ${formatCurrency(total)}`}
          </Button>
        </div>
      )}

      <AddressModal
        isOpen={showMap}
        onClose={() => setShowMap(false)}
        onConfirm={(location) => {
          setSelectedAddress(location);
          saveAddress(location);
          setShowMap(false);
        }}
      />
    </Card>
  );
};

export default Cart;
