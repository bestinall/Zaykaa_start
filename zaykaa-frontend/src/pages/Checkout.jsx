import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Common/Header';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import FloatingInput from '../components/ui/FloatingInput';
import PageTransition from '../components/ui/PageTransition';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { orderService } from '../services/order';
import { formatCurrency } from '../utils/display';
import { clearPaymentDraft, getPaymentDraft, savePaymentDraft } from '../utils/paymentDraft';

const paymentMethods = [
  {
    id: 'upi',
    label: 'UPI',
    helper: 'Pay using a mock UPI ID or QR-style flow.',
  },
  {
    id: 'card',
    label: 'Credit / Debit Card',
    helper: 'Use a sandbox card form with no real charge.',
  },
  {
    id: 'netbanking',
    label: 'Net Banking',
    helper: 'Choose a bank and continue through a mock redirect.',
  },
  {
    id: 'wallet',
    label: 'Wallet',
    helper: 'Use a mock wallet balance or one-tap checkout.',
  },
  {
    id: 'cod',
    label: 'Cash on Delivery',
    helper: 'Place the order now and pay at delivery time.',
  },
];

const Icon = ({ path, className = 'h-5 w-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {path}
  </svg>
);

const icons = {
  lock: (
    <>
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <path d="M7 11V8a5 5 0 0 1 10 0v3" />
    </>
  ),
  card: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 10h19" />
    </>
  ),
};

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { clearCart } = useCart();

  const locationDraft = location.state?.paymentDraft || null;
  const [paymentDraft, setPaymentDraft] = useState(() => locationDraft || getPaymentDraft());
  const [selectedMethod, setSelectedMethod] = useState(
    () => locationDraft?.paymentMethod || getPaymentDraft()?.paymentMethod || 'upi'
  );
  const [upiId, setUpiId] = useState(() => getPaymentDraft()?.upiId || '');
  const [cardName, setCardName] = useState(() => getPaymentDraft()?.cardName || '');
  const [cardNumber, setCardNumber] = useState(() => getPaymentDraft()?.cardNumber || '');
  const [cardMeta, setCardMeta] = useState(() => getPaymentDraft()?.cardMeta || '');
  const [bankName, setBankName] = useState(() => getPaymentDraft()?.bankName || 'HDFC Bank');
  const [walletName, setWalletName] = useState(() => getPaymentDraft()?.walletName || 'Zaykaa Wallet');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!locationDraft) {
      return;
    }

    setPaymentDraft(locationDraft);
  }, [locationDraft]);

  useEffect(() => {
    if (!paymentDraft) {
      return;
    }

    savePaymentDraft({
      ...paymentDraft,
      paymentMethod: selectedMethod,
      upiId,
      cardName,
      cardNumber,
      cardMeta,
      bankName,
      walletName,
    });
  }, [paymentDraft, selectedMethod, upiId, cardName, cardNumber, cardMeta, bankName, walletName]);

  const selectedMethodDetails = useMemo(
    () => paymentMethods.find((method) => method.id === selectedMethod) || paymentMethods[0],
    [selectedMethod]
  );

  const validateMockPayment = () => {
    if (selectedMethod === 'upi' && !upiId.trim()) {
      toast.info('Enter a UPI ID');
      return false;
    }

    if (selectedMethod === 'card' && (!cardName.trim() || !cardNumber.trim() || !cardMeta.trim())) {
      toast.info('Fill the mock card details');
      return false;
    }

    return true;
  };

  const handleMockPayment = async () => {
    if (!paymentDraft) {
      toast.info('No pending order found');
      return;
    }

    if (!validateMockPayment()) {
      return;
    }

    setProcessing(true);

    const finalDraft = {
      ...paymentDraft,
      paymentMethod: selectedMethod,
      paymentLabel: selectedMethodDetails.label,
    };

    savePaymentDraft(finalDraft);

    try {
      await new Promise((resolve) => setTimeout(resolve, 900));

      await orderService.createOrder({
        restaurantId: finalDraft.restaurantId,
        items: finalDraft.items,
        totalAmount: finalDraft.totalAmount,
        couponCode: finalDraft.couponCode || '',
        deliveryAddress: finalDraft.deliveryAddress,
      });

      toast.success(
        selectedMethod === 'cod' ? 'Order confirmed' : 'Mock payment successful',
        `${finalDraft.restaurantName || 'Your order'} is confirmed.`
      );
    } catch {
      toast.success(
        selectedMethod === 'cod' ? 'Order confirmed' : 'Mock payment successful',
        'This sandbox flow does not charge real money.'
      );
    } finally {
      clearCart();
      clearPaymentDraft();
      setProcessing(false);
      navigate('/dashboard');
    }
  };

  if (!paymentDraft) {
    return (
      <PageTransition className="app-shell">
        <Header />
        <div className="content-shell">
          <Card hover={false} className="mx-auto max-w-xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand">
              Mock payment
            </p>
            <h1 className="mt-3 font-display text-3xl text-slate-950 dark:text-white">
              No pending payment found
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Start an order first, then continue here to test the mock payment gateway.
            </p>
            <div className="mt-6">
              <Button type="button" onClick={() => navigate('/order')}>
                Back to ordering
              </Button>
            </div>
          </Card>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="app-shell">
      <Header />
      <div className="content-shell grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card hover={false} className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand shadow-soft dark:border-white/10 dark:bg-white/5">
            <Icon path={icons.lock} className="h-4 w-4" />
            Mock payment gateway
          </div>

          <div>
            <h1 className="font-display text-3xl text-slate-950 dark:text-white">
              Complete your sandbox payment
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              This page only simulates payment. No actual gateway is called and no real amount is charged.
            </p>
          </div>

          <div className="grid gap-3">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setSelectedMethod(method.id)}
                className={`rounded-[1.5rem] border p-4 text-left transition ${
                  selectedMethod === method.id
                    ? 'border-brand/50 bg-brand/10 shadow-glow'
                    : 'border-white/60 bg-white/75 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950 dark:text-white">{method.label}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {method.helper}
                    </p>
                  </div>
                  <span
                    className={`mt-1 h-4 w-4 rounded-full border ${
                      selectedMethod === method.id
                        ? 'border-brand bg-brand shadow-[0_0_0_4px_rgba(199,93,42,0.16)]'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  />
                </div>
              </button>
            ))}
          </div>

          <Card hover={false} className="space-y-4 border border-dashed border-white/65 bg-white/65 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Icon path={icons.card} className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-950 dark:text-white">
                  {selectedMethodDetails.label}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Fill the mock details below to continue.
                </p>
              </div>
            </div>

            {selectedMethod === 'upi' && (
              <FloatingInput
                label="UPI ID"
                value={upiId}
                onChange={(event) => setUpiId(event.target.value)}
              />
            )}

            {selectedMethod === 'card' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <FloatingInput
                  label="Cardholder name"
                  value={cardName}
                  onChange={(event) => setCardName(event.target.value)}
                />
                <FloatingInput
                  label="Card number"
                  value={cardNumber}
                  onChange={(event) => setCardNumber(event.target.value)}
                />
                <FloatingInput
                  label="Expiry / CVV"
                  value={cardMeta}
                  onChange={(event) => setCardMeta(event.target.value)}
                />
              </div>
            )}

            {selectedMethod === 'netbanking' && (
              <select
                value={bankName}
                onChange={(event) => setBankName(event.target.value)}
                className="w-full rounded-[1.2rem] border border-white/60 bg-white/85 px-3 py-3 text-sm text-slate-900 outline-none transition dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank'].map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>
            )}

            {selectedMethod === 'wallet' && (
              <select
                value={walletName}
                onChange={(event) => setWalletName(event.target.value)}
                className="w-full rounded-[1.2rem] border border-white/60 bg-white/85 px-3 py-3 text-sm text-slate-900 outline-none transition dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                {['Zaykaa Wallet', 'PhonePe Wallet', 'Paytm Wallet', 'Amazon Pay'].map((wallet) => (
                  <option key={wallet} value={wallet}>
                    {wallet}
                  </option>
                ))}
              </select>
            )}

            {selectedMethod === 'cod' && (
              <div className="rounded-[1.2rem] bg-slate-900/5 px-4 py-3 text-sm leading-6 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                Cash on delivery is available for this mock flow. The order will be confirmed immediately
                without online payment.
              </div>
            )}
          </Card>
        </Card>

        <Card hover={false} className="space-y-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand">
              Order summary
            </p>
            <h2 className="mt-2 font-display text-2xl text-slate-950 dark:text-white">
              {paymentDraft.restaurantName || 'Curated order'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Delivering to {paymentDraft.deliveryAddress}
            </p>
          </div>

          <div className="space-y-3">
            {paymentDraft.items.map((item) => (
              <div
                key={item.id}
                className="rounded-[1.3rem] border border-white/60 bg-white/75 p-4 dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950 dark:text-white">{item.name}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Qty {item.quantity}
                      {item.orderSource === 'state' ? ` • ${item.originState} regional pick` : ''}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 rounded-[1.5rem] bg-slate-900/5 p-4 dark:bg-white/5">
            <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>Subtotal</span>
              <span>{formatCurrency(paymentDraft.subtotal || 0)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>Tax</span>
              <span>{formatCurrency(paymentDraft.tax || 0)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>Delivery</span>
              <span>{formatCurrency(paymentDraft.delivery || 0)}</span>
            </div>
            {(paymentDraft.discount || 0) > 0 && (
              <div className="flex items-center justify-between text-sm text-emerald-600 dark:text-emerald-300">
                <span>Discount</span>
                <span>-{formatCurrency(paymentDraft.discount || 0)}</span>
              </div>
            )}
            {paymentDraft.couponCode && (
              <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                <span>Coupon</span>
                <span>{paymentDraft.couponCode}</span>
              </div>
            )}
            <div className="border-t border-black/5 pt-3 dark:border-white/10">
              <div className="flex items-center justify-between text-lg font-semibold text-slate-950 dark:text-white">
                <span>Total</span>
                <span>{formatCurrency(paymentDraft.totalAmount || 0)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button type="button" size="lg" onClick={handleMockPayment} disabled={processing}>
              {processing
                ? 'Processing...'
                : selectedMethod === 'cod'
                  ? 'Confirm Order'
                  : `Pay ${formatCurrency(paymentDraft.totalAmount || 0)}`}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate('/order')}>
              Back to cart
            </Button>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
};

export default Checkout;
