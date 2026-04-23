import React, { useState } from 'react';
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

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = new URLSearchParams(location.search).get('message');

  if (isAuthenticated) {
    return <Navigate to={user?.role === 'chef' ? '/chef-dashboard' : '/dashboard'} replace />;
  }

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

              <div className="grid gap-3 md:grid-cols-3">
                {[
                  ['01', 'Chef discovery', 'Find highly rated culinary specialists in minutes.'],
                  ['02', 'Order flow', 'Browse, add, and checkout with a calmer storefront.'],
                  ['03', 'Chef analytics', 'Track revenue, booking health, and menu performance.'],
                ].map(([index, title, description]) => (
                  <div
                    key={index}
                    className="rounded-[1.4rem] border border-white/10 bg-white/10 p-3 backdrop-blur-xl"
                  >
                    <p className="text-[10px] font-semibold tracking-[0.24em] text-white/50">{index}</p>
                    <h2 className="mt-2 text-base font-semibold xl:text-lg">{title}</h2>
                    <p className="mt-1.5 text-xs leading-5 text-white/70 xl:text-sm xl:leading-6">{description}</p>
                  </div>
                ))}
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
