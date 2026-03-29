import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import FloatingInput from '../components/ui/FloatingInput';
import ThemeToggle from '../components/ui/ThemeToggle';
import PageTransition from '../components/ui/PageTransition';
import Card from '../components/ui/Card';
import Button, { buttonStyles } from '../components/ui/Button';
import SmartImage from '../components/ui/SmartImage';
import { cn } from '../utils/cn';

const roles = [
  {
    value: 'user',
    title: 'Food Lover',
    description: 'Order chef-crafted meals, book private dining, and track recent orders.',
  },
  {
    value: 'chef',
    title: 'Chef',
    description: 'Run your menu, bookings, recipe library, and analytics from one studio.',
  },
  {
    value: 'seller',
    title: 'Food Seller',
    description: 'Share recipes, publish food ideas, and manage your contribution space in one place.',
  },
  {
    value: 'agent',
    title: 'Delivery Agent',
    description: 'Support operations with delivery-focused access and assigned handoffs.',
  },
  {
    value: 'vlogger',
    title: 'Vlogger',
    description: 'Explore creator-led culinary stories, collaborations, and food features.',
  },
];

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    nativeState: '',
    nativeRegion: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { isAuthenticated, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to={user?.role === 'chef' ? '/chef-dashboard' : '/dashboard'} replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password) {
      return 'All fields are required.';
    }
    if (['chef', 'seller'].includes(formData.role) && !formData.nativeState.trim()) {
      return 'Native state is required for chefs and sellers.';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match.';
    }
    if (formData.password.length < 8) {
      return 'Password must be at least 8 characters.';
    }
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationMessage = validateForm();

    if (validationMessage) {
      setError(validationMessage);
      toast.error('Registration blocked', validationMessage);
      return;
    }

    setError('');
    setLoading(true);

    try {
      await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        nativeState: formData.nativeState,
        nativeRegion: formData.nativeRegion,
      });
      toast.success('Account created', 'You can now sign in to Zaykaa.');
      navigate('/login?message=Registration successful. Please login.');
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      toast.error('Unable to register', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition className="app-shell">
      <div className="content-shell flex min-h-screen items-center py-8">
        <div className="absolute right-4 top-4 z-20 sm:right-6">
          <ThemeToggle />
        </div>

        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card
            hover={false}
            className="relative min-h-[760px] overflow-hidden bg-slate-950 text-white dark:bg-[#0f1118]"
          >
            <div className="absolute inset-0 grid grid-cols-2 gap-2 p-2">
              <SmartImage src="/images/food2.jpg" alt="Curated dish" className="rounded-[1.75rem]" />
              <div className="grid gap-2">
                <SmartImage src="/images/food4.jpg" alt="Private dining spread" className="rounded-[1.75rem]" />
                <SmartImage src="/images/food5.jpg" alt="Chef plated menu" className="rounded-[1.75rem]" />
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-950/50 to-brand/25" />
            <div className="relative z-10 flex h-full flex-col justify-between p-8 sm:p-10">
              <div>
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-white/80 backdrop-blur-xl">
                  Premium onboarding
                </div>
                <h1 className="mt-8 max-w-xl font-display text-5xl leading-tight sm:text-6xl">
                  Choose the role that matches how you want to experience food.
                </h1>
                <p className="mt-6 max-w-lg text-base leading-7 text-white/80">
                  Whether you are ordering, hosting a chef-led dinner, or operating the kitchen
                  side of the platform, the product now opens with clearer intent.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {roles.map((role) => (
                  <div
                    key={role.value}
                    className="rounded-[1.6rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl"
                  >
                    <p className="text-lg font-semibold">{role.title}</p>
                    <p className="mt-2 text-sm leading-6 text-white/70">{role.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card hover={false} className="min-h-[760px] p-8 sm:p-10">
            <div className="mx-auto w-full max-w-lg">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Join Zaykaa</p>
              <h2 className="mt-4 font-display text-4xl text-slate-950 dark:text-white">
                Create a premium access pass
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                Set up your profile, choose your role, and start with a more app-like, elegant
                experience from the first screen.
              </p>

              {error && (
                <div className="mt-6 rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <FloatingInput
                  label="Full name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
                <FloatingInput
                  label="Email address"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />

                <div>
                  <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                    Choose role
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {roles.map((role) => (
                      <motion.button
                        key={role.value}
                        type="button"
                        whileTap={{ scale: 0.99 }}
                        onClick={() =>
                          setFormData((currentData) => ({
                            ...currentData,
                            role: role.value,
                          }))
                        }
                        className={cn(
                          'rounded-[1.5rem] border p-4 text-left transition',
                          formData.role === role.value
                            ? 'border-brand/60 bg-brand/10 shadow-glow dark:bg-brand/10'
                            : 'border-white/60 bg-white/70 hover:border-brand/40 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'
                        )}
                      >
                        <p className="font-semibold text-slate-900 dark:text-white">{role.title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {role.description}
                        </p>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {['chef', 'seller'].includes(formData.role) && (
                  <div className="rounded-[1.6rem] border border-brand/20 bg-brand/10 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">
                      Regional authenticity
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-200">
                      Chefs and sellers publish food with profile-linked regional origins, so your
                      native state helps Zaykaa preserve authentic cuisine stories.
                    </p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <FloatingInput
                        label="Native state"
                        type="text"
                        name="nativeState"
                        value={formData.nativeState}
                        onChange={handleChange}
                        required
                      />
                      <FloatingInput
                        label="Native region (optional)"
                        type="text"
                        name="nativeRegion"
                        value={formData.nativeRegion}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <FloatingInput
                    label="Password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                  />
                  <FloatingInput
                    label="Confirm password"
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                  />
                </div>

                <Button type="submit" size="lg" block disabled={loading}>
                  {loading ? 'Creating your account...' : 'Register'}
                </Button>
              </form>

              <div className="mt-8 flex items-center justify-between gap-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Already have an account?{' '}
                  <Link to="/login" className="font-semibold text-brand transition hover:text-brand-deep">
                    Sign in
                  </Link>
                </p>
                <Link to="/login" className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
                  Login
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
};

export default Register;
