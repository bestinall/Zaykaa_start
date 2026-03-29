import React, { useMemo, useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import FloatingInput from '../ui/FloatingInput';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { orderService } from '../../services/order';
import { previewCoupons } from '../../data/mockData';
import { formatCurrency } from '../../utils/display';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, getTotalPrice } = useCart();
  const toast = useToast();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);

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

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      toast.info('Enter a coupon', 'Add a valid coupon code to continue.');
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
        toast.error('Coupon invalid', 'That code could not be applied.');
        return;
      }

      setAppliedCoupon(coupon);
      toast.success('Coupon applied', coupon.description || `${coupon.code} added to this order.`);
    } catch (error) {
      const fallbackCoupon = previewCoupons[code];

      if (fallbackCoupon) {
        setAppliedCoupon(fallbackCoupon);
        toast.info('Preview coupon applied', fallbackCoupon.description);
      } else {
        toast.error('Coupon invalid', 'That code could not be applied.');
      }
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!cart.restaurantId || cart.items.length === 0) {
      toast.info('Cart is empty', 'Add a few items before placing the order.');
      return;
    }

    setOrderLoading(true);

    try {
      const response = await orderService.createOrder({
        restaurantId: cart.restaurantId,
        items: cart.items,
        totalAmount: total,
        couponCode: appliedCoupon?.code || '',
        deliveryAddress: 'Sample Address',
      });

      toast.success(
        'Order placed',
        response.order?.orderReference
          ? `Order reference ${response.order.orderReference} is confirmed.`
          : 'Your order has been sent to the kitchen.'
      );
      setCouponCode('');
      setAppliedCoupon(null);
      clearCart();
    } catch (error) {
      toast.error(
        'Order failed',
        error.response?.data?.message || error.response?.data?.error?.message || 'Unable to place your order.'
      );
    } finally {
      setOrderLoading(false);
    }
  };

  return (
    <Card hover={false} className="h-fit space-y-5 xl:sticky xl:top-28">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Your cart</p>
        <h2 className="mt-3 font-display text-3xl text-slate-950 dark:text-white">
          {cart.restaurantName || 'Sticky checkout'}
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
          Keep totals, coupon state, and item controls visible while you browse the menu.
        </p>
      </div>

      {cart.items.length === 0 ? (
        <div className="rounded-[1.6rem] border border-dashed border-white/60 bg-white/70 px-5 py-8 text-center dark:border-white/10 dark:bg-white/5">
          <p className="font-display text-2xl text-slate-950 dark:text-white">Cart is empty</p>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Add menu items to see live totals, coupon validation, and checkout details here.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="rounded-[1.5rem] border border-white/60 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-950 dark:text-white">{item.name}</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {formatCurrency(item.price)} each
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="text-sm font-medium text-rose-600 dark:text-rose-300"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between gap-4">
                  <div className="inline-flex items-center gap-3 rounded-full border border-white/60 bg-white/80 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                    >
                      -
                    </button>
                    <span className="min-w-5 text-center text-sm font-semibold text-slate-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                    >
                      +
                    </button>
                  </div>
                  <p className="font-semibold text-slate-950 dark:text-white">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto] xl:grid-cols-1">
            <FloatingInput
              label="Coupon code"
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={applyCoupon}
              disabled={couponLoading}
              className="sm:self-end xl:w-full"
            >
              {couponLoading ? 'Checking...' : 'Apply coupon'}
            </Button>
          </div>

          {appliedCoupon && (
            <div className="rounded-[1.5rem] border border-brand/20 bg-brand/10 px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
              {appliedCoupon.code}: {appliedCoupon.description}
            </div>
          )}

          <div className="space-y-3 rounded-[1.75rem] bg-slate-900/5 p-5 dark:bg-white/5">
            <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>Tax</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>Delivery</span>
              <span>{formatCurrency(delivery)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-emerald-600 dark:text-emerald-300">
              <span>Discount</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
            <div className="border-t border-black/5 pt-4 text-lg font-semibold text-slate-950 dark:border-white/10 dark:text-white">
              <div className="flex items-center justify-between">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <Button type="button" block size="lg" onClick={handlePlaceOrder} disabled={orderLoading}>
            {orderLoading ? 'Placing order...' : 'Place order'}
          </Button>
        </>
      )}
    </Card>
  );
};

export default Cart;
