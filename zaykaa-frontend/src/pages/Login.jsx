import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/auth';
import FloatingInput from '../components/ui/FloatingInput';
import ThemeToggle from '../components/ui/ThemeToggle';
import PageTransition from '../components/ui/PageTransition';
import Card from '../components/ui/Card';
import Button, { buttonStyles } from '../components/ui/Button';
import SmartImage from '../components/ui/SmartImage';

const loginShowcase = [
  {
    id: 'chef-discovery',
    mode: 'Private chef access',
    kicker: 'Chef discovery',
    title: 'Find standout culinary specialists without the back-and-forth.',
    description:
      'Compare cuisines, ratings, and availability in one flow, then move from inspiration to a confirmed chef session with less friction.',
    tags: ['Availability-first', 'Curated chefs', 'Premium hosting'],
  },
  {
    id: 'order-flow',
    mode: 'Ordering rhythm',
    kicker: 'Order flow',
    title: 'A calmer storefront for repeat orders and smarter checkout.',
    description:
      'Keep restaurant browsing, cart decisions, coupon checks, and recent order visibility inside one polished path instead of juggling scattered screens.',
    tags: ['Single cart flow', 'Coupon feedback', 'Recent orders'],
  },
  {
    id: 'chef-studio',
    mode: 'Studio control',
    kicker: 'Chef workspace',
    title: 'Menus, bookings, recipes, and analytics live in one studio.',
    description:
      'Chefs return to a workspace built for action, with bookings, food publishing, and performance signals gathered into one operational view.',
    tags: ['Menu updates', 'Recipe library', 'Performance view'],
  },
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeShowcaseIndex, setActiveShowcaseIndex] = useState(0);

  const { login, isAuthenticated, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = new URLSearchParams(location.search).get('message');

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveShowcaseIndex((currentIndex) => (currentIndex + 1) % loginShowcase.length);
    }, 3600);

    return () => window.clearInterval(intervalId);
  }, []);

  if (isAuthenticated) {
    return <Navigate to={user?.role === 'chef' ? '/chef-dashboard' : '/dashboard'} replace />;
  }

  const activeShowcase = loginShowcase[activeShowcaseIndex];

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(email, password);
      login(response.token, response.user);
      toast.success('Signed in', 'Your workspace is ready.');
      navigate(response.user.role === 'chef' ? '/chef-dashboard' : '/dashboard');
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      toast.error('Unable to sign in', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition className="app-shell">
      <div
        className="relative z-10 mx-auto flex h-screen w-full max-w-7xl items-center px-4 py-4 sm:px-6"
        data-testid="login-shell"
      >
        <div className="absolute right-4 top-4 z-20 sm:right-6">
          <ThemeToggle />
        </div>

        <div className="grid w-full gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          {/* LEFT PANEL — visible only on large screens so login still fits viewport on laptops */}
          <Card
            hover={false}
            className="relative hidden h-[calc(100vh-2rem)] max-h-[680px] overflow-hidden bg-slate-950 text-white dark:bg-[#0f1118] lg:block"
            data-testid="login-info-panel"
          >
            <div className="absolute inset-0">
              <SmartImage src="/images/food1.jpg" alt="Signature plated food" className="h-full w-full" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-slate-950/30 to-brand/30" />
            <div className="relative flex h-full flex-col justify-between gap-6 p-7 xl:p-9">
              <div>
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.28em] text-white/80 backdrop-blur-xl">
                  Private dining • Chef booking • Fast ordering
                </div>
                <h1 className="mt-6 max-w-xl font-display text-2xl leading-tight xl:text-[2.5rem]">
                  A smoother way to bring exceptional food experiences home.
                </h1>
                <p className="mt-4 max-w-lg text-sm leading-6 text-white/80 xl:text-base xl:leading-7">
                  Zaykaa combines restaurant ordering, boutique chef discovery, and premium hosting
                  tools inside one polished product experience.
                </p>
              </div>

                <div className="rounded-[2rem] border border-white/12 bg-white/10 p-5 shadow-[0_28px_64px_rgba(15,23,42,0.22)] backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-4">
                    <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55">
                      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-brand shadow-[0_0_18px_rgba(255,107,53,0.75)]" />
                      Live spotlight
                    </div>
                  <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/82">
                    {activeShowcase.mode}
                  </div>
                </div>

                <div className="relative mt-5 h-[175px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeShowcase.id}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -18 }}
                      transition={{ duration: 0.28, ease: 'easeOut' }}
                      className="absolute inset-0"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white/48">
                        {activeShowcase.kicker}
                      </p>
                      <h2 className="mt-3 max-w-lg font-display text-[1.7rem] leading-tight text-white xl:text-[2rem]">
                        {activeShowcase.title}
                      </h2>
                      <p className="mt-4 max-w-xl text-sm leading-7 text-white/78">
                        {activeShowcase.description}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="mt-3 flex items-center justify-between gap-4">
                  <div className="flex gap-2">
                    {loginShowcase.map((item, index) => (
                      <span
                        key={item.id}
                        className={`h-2 rounded-full transition-all ${
                          index === activeShowcaseIndex ? 'w-8 bg-brand' : 'w-2 bg-white/30'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex flex-wrap justify-end gap-2">
                    {activeShowcase.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/72"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* RIGHT PANEL — form */}
          <Card
            hover={false}
            className="flex max-h-[calc(100vh-2rem)] flex-col justify-center p-6 sm:p-8"
            data-testid="login-form-card"
          >
            <div className="mx-auto w-full max-w-md">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand" data-testid="login-subtitle">
                Welcome back
              </p>
              <h2 className="mt-3 font-display text-3xl text-slate-950 dark:text-white sm:text-[2rem]" data-testid="login-title">
                Sign in to continue your Zaykaa journey
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300" data-testid="login-description">
                Manage food orders, book a private chef, or open your chef studio without leaving
                the same premium workflow.
              </p>

              {successMessage && (
                <div
                  className="mt-4 rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100"
                  data-testid="login-success-banner"
                >
                  {successMessage}
                </div>
              )}
              {error && (
                <div
                  className="mt-3 rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-900 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100"
                  data-testid="login-error-banner"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-3" data-testid="login-form">
                <FloatingInput
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  data-testid="login-email-input"
                />
                <FloatingInput
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  data-testid="login-password-input"
                />

                <Button type="submit" size="lg" block disabled={loading} className="mt-2" data-testid="login-submit-button">
                  {loading ? 'Signing you in...' : 'Login'}
                </Button>
              </form>

              <div className="mt-6 flex items-center justify-between gap-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  New here?{' '}
                  <Link to="/register" className="font-semibold text-brand transition hover:text-brand-deep" data-testid="login-to-register-link">
                    Create an account
                  </Link>
                </p>
                <Link to="/register" className={buttonStyles({ variant: 'ghost', size: 'sm' })} data-testid="login-to-register-button">
                  Register
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
};

export default Login;
