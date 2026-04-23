

import React, { useMemo, useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import FloatingInput from '../ui/FloatingInput';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { orderService } from '../../services/order';
import { previewCoupons } from '../../data/mockData';
import { formatCurrency } from '../../utils/display';
import AddressModal from "../AddressModal";

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, getTotalPrice } = useCart();
  const toast = useToast();

  const [showMap, setShowMap] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);

  const userEmail = localStorage.getItem("user_email") || "guest";
  const storageKey = `user_addresses_${userEmail}`;

  const [savedAddresses, setSavedAddresses] = useState(
    JSON.parse(localStorage.getItem(storageKey)) || []
  );

  const saveAddress = (loc) => {
    const existing = JSON.parse(localStorage.getItem(storageKey)) || [];
    const alreadyExists = existing.find((a) => a.address === loc.address);

    if (!alreadyExists) {
      const updated = [...existing, loc];
      localStorage.setItem(storageKey, JSON.stringify(updated));
    }
  };

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);

  const subtotal = getTotalPrice();
  const tax = subtotal * 0.05;
  const delivery = cart.items.length > 0 ? 45 : 0;

  const discount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'percent') {
      return subtotal * (Number(appliedCoupon.value || 0) / 100);
    }
    return Number(appliedCoupon.value || 0);
  }, [appliedCoupon, subtotal]);

  const total = Math.max(subtotal + tax + delivery - discount, 0);

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return toast.info('Enter a coupon');

    setCouponLoading(true);
    try {
      const response = await orderService.validateCoupon({
        code,
        subtotal,
        restaurantId: cart.restaurantId,
      });

      const coupon = response.coupon || previewCoupons[code];
      if (!coupon) return toast.error('Invalid coupon');

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

    if (!selectedAddress || !selectedAddress.address) {
      toast.info("Please select address");
      setShowMap(true);
      return;
    }

    setOrderLoading(true);

    try {
      await orderService.createOrder({
        restaurantId: cart.restaurantId,
        items: cart.items,
        totalAmount: total,
        couponCode: appliedCoupon?.code || '',
        deliveryAddress: selectedAddress.address,
      });

      toast.success("Order placed successfully");
    } catch {
      toast.success("Order placed (mock)");
    }

    setCouponCode('');
    setAppliedCoupon(null);
    clearCart();
    setSelectedAddress(null);
    setOrderLoading(false);
  };

  return (
   <Card className="flex flex-col max-h-[85vh] bg-white dark:bg-gray-900 text-black dark:text-white">

      {/* HEADER */}
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">Your Cart</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {cart.items.length} item(s)
        </p>
      </div>

      {/* SCROLL AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {cart.items.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-lg font-semibold">Your cart is empty 🛒</p>
          </div>
        ) : (
          <>
            {/* ITEMS */}
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border shadow-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(item.price)}
                    </p>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 text-sm"
                  >
                    Remove
                  </button>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>

                  <p className="font-semibold">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}

            {/* COUPON */}
            <FloatingInput
              label="Coupon"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />

            <Button
  onClick={applyCoupon}
  disabled={couponLoading || !couponCode.trim()}
  className={`w-full py-2 rounded-lg transition flex items-center justify-center gap-2
    ${
      couponLoading || !couponCode.trim()
        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
        : "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 shadow-sm"
    }
  `}
>
  {couponLoading ? (
    <>
      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
      Checking...
    </>
  ) : (
    "Apply Coupon"
  )}
</Button>

            {/* TOTAL */}
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl">
              <p>Subtotal: {formatCurrency(subtotal)}</p>
              <p>Tax: {formatCurrency(tax)}</p>
              <p>Delivery: {formatCurrency(delivery)}</p>
              <p>Discount: -{formatCurrency(discount)}</p>
              <h3 className="font-bold text-lg">
                Total: {formatCurrency(total)}
              </h3>
            </div>

            {/* ADDRESS */}
            <button
              onClick={() => setShowMap(true)}
              className="w-full py-2 border border-dashed rounded-lg text-sm text-gray-600"
            >
              {selectedAddress ? "Change Address" : "Add Address"}
            </button>

            {selectedAddress && (
              <div className="text-sm text-green-600">
                📍 {selectedAddress.address}
              </div>
            )}
          </>
        )}
      </div>

      {/* STICKY FOOTER */}
      {cart.items.length > 0 && (
        <div className="p-4 border-t bg-white">
          <Button
            onClick={handlePlaceOrder}
            className="w-full bg-black text-white dark:bg-white dark:text-black py-3 rounded-xl shadow-md"
          >
            {orderLoading ? "Placing..." : `Place Order • ${formatCurrency(total)}`}
          </Button>
        </div>
      )}

      {/* MAP */}
      <AddressModal
        isOpen={showMap}
        onClose={() => setShowMap(false)}
        onConfirm={(loc) => {
          setSelectedAddress(loc);
          saveAddress(loc);
          setSavedAddresses(
            JSON.parse(localStorage.getItem(storageKey))
          );
          setShowMap(false);
        }}
      />

    </Card>
  );
};

export default Cart;
// import React, { useMemo, useState } from 'react';
// import Card from '../ui/Card';
// import Button from '../ui/Button';
// import FloatingInput from '../ui/FloatingInput';
// import { useCart } from '../../context/CartContext';
// import { useToast } from '../../context/ToastContext';
// import { orderService } from '../../services/order';
// import { previewCoupons } from '../../data/mockData';
// import { formatCurrency } from '../../utils/display';

// const Icon = ({ path, className = 'h-5 w-5' }) => (
//   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
//     {path}
//   </svg>
// );

// const icons = {
//   bag: <><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
//   tag: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><path d="M7 7h.01" /></>,
//   trash: <><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></>,
// };

// const Cart = () => {
//   const { cart, removeFromCart, updateQuantity, clearCart, getTotalPrice } = useCart();
//   const toast = useToast();
//   const [couponCode, setCouponCode] = useState('');
//   const [appliedCoupon, setAppliedCoupon] = useState(null);
//   const [couponLoading, setCouponLoading] = useState(false);
//   const [orderLoading, setOrderLoading] = useState(false);

//   const subtotal = getTotalPrice();
//   const tax = subtotal * 0.05;
//   const delivery = cart.items.length > 0 ? 45 : 0;
//   const discount = useMemo(() => {
//     if (!appliedCoupon) {
//       return 0;
//     }
//     if (appliedCoupon.type === 'percent') {
//       return subtotal * (Number(appliedCoupon.value || 0) / 100);
//     }
//     return Number(appliedCoupon.value || 0);
//   }, [appliedCoupon, subtotal]);
//   const total = Math.max(subtotal + tax + delivery - discount, 0);

//   const applyCoupon = async () => {
//     const code = couponCode.trim().toUpperCase();
//     if (!code) {
//       toast.info('Enter a coupon', 'Add a valid coupon code to continue.');
//       return;
//     }

//     setCouponLoading(true);

//     try {
//       const response = await orderService.validateCoupon({
//         code,
//         subtotal,
//         restaurantId: cart.restaurantId,
//       });
//       const coupon = response.coupon || previewCoupons[code];

//       if (!coupon) {
//         toast.error('Coupon invalid', 'That code could not be applied.');
//         return;
//       }

//       setAppliedCoupon(coupon);
//       toast.success('Coupon applied', coupon.description || `${coupon.code} added to this order.`);
//     } catch (error) {
//       const fallbackCoupon = previewCoupons[code];

//       if (fallbackCoupon) {
//         setAppliedCoupon(fallbackCoupon);
//         toast.info('Preview coupon applied', fallbackCoupon.description);
//       } else {
//         toast.error('Coupon invalid', 'That code could not be applied.');
//       }
//     } finally {
//       setCouponLoading(false);
//     }
//   };

//   const handlePlaceOrder = async () => {
//     if (!cart.restaurantId || cart.items.length === 0) {
//       toast.info('Cart is empty', 'Add a few items before placing the order.');
//       return;
//     }

//     setOrderLoading(true);

//     try {
//       const response = await orderService.createOrder({
//         restaurantId: cart.restaurantId,
//         items: cart.items,
//         totalAmount: total,
//         couponCode: appliedCoupon?.code || '',
//         deliveryAddress: 'Sample Address',
//       });

//       toast.success(
//         'Order placed',
//         response.order?.orderReference
//           ? `Order reference ${response.order.orderReference} is confirmed.`
//           : 'Your order has been sent to the kitchen.'
//       );
//       setCouponCode('');
//       setAppliedCoupon(null);
//       clearCart();
//     } catch (error) {
//       toast.error(
//         'Order failed',
//         error.response?.data?.message || error.response?.data?.error?.message || 'Unable to place your order.'
//       );
//     } finally {
//       setOrderLoading(false);
//     }
//   };

//   return (
//     <Card hover={false} className="h-fit space-y-4 xl:sticky xl:top-28">
//       <div>
//         <div className="flex items-center gap-2">
//           <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand">
//             <Icon path={icons.bag} className="h-4 w-4" />
//           </span>
//           <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand">Your cart</p>
//         </div>
//         <h2 className="mt-2 font-display text-xl text-slate-950 dark:text-white">
//           {cart.restaurantName || 'Sticky checkout'}
//         </h2>
//         <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
//           Keep totals, coupon state, and item controls visible while you browse the menu.
//         </p>
//       </div>

//       {cart.items.length === 0 ? (
//         <div className="rounded-[1.4rem] border border-dashed border-white/60 bg-white/70 px-4 py-6 text-center dark:border-white/10 dark:bg-white/5">
//           <div className="flex justify-center">
//             <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
//               <Icon path={icons.bag} className="h-5 w-5" />
//             </span>
//           </div>
//           <p className="mt-3 font-display text-lg text-slate-950 dark:text-white">Cart is empty</p>
//           <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
//             Add menu items to see live totals, coupon validation, and checkout details.
//           </p>
//         </div>
//       ) : (
//         <>
//           <div className="space-y-2">
//             {cart.items.map((item) => (
//               <div
//                 key={item.id}
//                 className="rounded-[1.2rem] border border-white/60 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5"
//               >
//                 <div className="flex items-start justify-between gap-3">
//                   <div className="min-w-0 flex-1">
//                     <h3 className="font-semibold text-base text-slate-950 dark:text-white line-clamp-1">{item.name}</h3>
//                     <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
//                       {formatCurrency(item.price)} each
//                     </p>
//                   </div>
//                   <button
//                     type="button"
//                     onClick={() => removeFromCart(item.id)}
//                     className="text-xs font-medium text-rose-600 dark:text-rose-300"
//                   >
//                     <Icon path={icons.trash} className="h-4 w-4" />
//                   </button>
//                 </div>

//                 <div className="mt-3 flex items-center justify-between gap-3">
//                   <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-2 py-1 dark:border-white/10 dark:bg-white/5">
//                     <button
//                       type="button"
//                       onClick={() => updateQuantity(item.id, item.quantity - 1)}
//                       className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-white dark:bg-white dark:text-slate-950"
//                     >
//                       -
//                     </button>
//                     <span className="min-w-4 text-center text-xs font-semibold text-slate-900 dark:text-white">
//                       {item.quantity}
//                     </span>
//                     <button
//                       type="button"
//                       onClick={() => updateQuantity(item.id, item.quantity + 1)}
//                       className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-white dark:bg-white dark:text-slate-950"
//                     >
//                       +
//                     </button>
//                   </div>
//                   <p className="text-sm font-semibold text-slate-950 dark:text-white">
//                     {formatCurrency(item.price * item.quantity)}
//                   </p>
//                 </div>
//               </div>
//             ))}
//           </div>

//           <div className="grid gap-2 sm:grid-cols-[1fr_auto] xl:grid-cols-1">
//             <FloatingInput
//               label="Coupon code"
//               value={couponCode}
//               onChange={(event) => setCouponCode(event.target.value)}
//             />
//             <Button
//               type="button"
//               variant="secondary"
//               size="sm"
//               onClick={applyCoupon}
//               disabled={couponLoading}
//               className="sm:self-end xl:w-full"
//             >
//               {couponLoading ? 'Checking...' : 'Apply'}
//             </Button>
//           </div>

//           {appliedCoupon && (
//             <div className="rounded-[1.2rem] border border-brand/20 bg-brand/10 px-3 py-2 text-xs text-slate-700 dark:text-slate-200">
//               <span className="inline-flex items-center gap-1">
//                 <Icon path={icons.tag} className="h-3.5 w-3.5" />
//                 {appliedCoupon.code}: {appliedCoupon.description}
//               </span>
//             </div>
//           )}

//           <div className="space-y-2 rounded-[1.4rem] bg-slate-900/5 p-4 dark:bg-white/5">
//             <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
//               <span>Subtotal</span>
//               <span>{formatCurrency(subtotal)}</span>
//             </div>
//             <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
//               <span>Tax</span>
//               <span>{formatCurrency(tax)}</span>
//             </div>
//             <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
//               <span>Delivery</span>
//               <span>{formatCurrency(delivery)}</span>
//             </div>
//             {discount > 0 && (
//               <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-300">
//                 <span>Discount</span>
//                 <span>-{formatCurrency(discount)}</span>
//               </div>
//             )}
//             <div className="border-t border-black/5 pt-2 text-base font-semibold text-slate-950 dark:border-white/10 dark:text-white">
//               <div className="flex items-center justify-between">
//                 <span>Total</span>
//                 <span>{formatCurrency(total)}</span>
//               </div>
//             </div>
//           </div>

//           <Button type="button" block size="lg" onClick={handlePlaceOrder} disabled={orderLoading}>
//             {orderLoading ? 'Placing order...' : 'Place order'}
//           </Button>
//         </>
//       )}
//     </Card>
//   );
// };

// export default Cart;
