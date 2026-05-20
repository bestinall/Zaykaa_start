import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    shortHint: 'Order meals & book chefs',
    description: 'Order chef-crafted meals, book private dining, and track recent orders.',
  },
  {
    value: 'chef',
    title: 'Chef',
    shortHint: 'Run your menu & bookings',
    description: 'Run your menu, bookings, recipe library, and analytics from one studio.',
  },
  {
    value: 'seller',
    title: 'Food Seller',
    shortHint: 'Share recipes & ideas',
    description: 'Share recipes, publish food ideas, and manage your contribution space in one place.',
  },
  {
    value: 'agent',
    title: 'Delivery Agent',
    shortHint: 'Support delivery ops',
    description: 'Support operations with delivery-focused access and assigned handoffs.',
  },
  {
    value: 'vlogger',
    title: 'Vlogger',
    shortHint: 'Create culinary stories',
    description: 'Explore creator-led culinary stories, collaborations, and food features.',
  },
];

const RoleDropdown = ({ value, onChange, roles }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedRole = roles.find((r) => r.value === value);

  return (
    <div className="relative" ref={dropdownRef} data-testid="role-dropdown">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full rounded-[1.2rem] border px-4 py-3 text-left transition',
          isOpen
            ? 'border-brand/60 bg-brand/10 shadow-glow dark:bg-brand/10'
            : 'border-slate-200 bg-white hover:border-brand/40 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'
        )}
        data-testid="role-dropdown-trigger"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedRole?.title || 'Choose a role'}</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{selectedRole?.shortHint || 'Select your primary role'}</p>
          </div>
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-slate-400 dark:text-slate-500"
          >
            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute z-30 mt-2 w-full rounded-[1.2rem] border border-slate-200 bg-white shadow-lg dark:border-white/10 dark:bg-slate-900"
            role="listbox"
            data-testid="role-dropdown-listbox"
          >
            {roles.map((role) => (
              <button
                key={role.value}
                type="button"
                role="option"
                aria-selected={value === role.value}
                onClick={() => {
                  onChange(role.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full px-4 py-3 text-left transition first:rounded-t-[1.2rem] last:rounded-b-[1.2rem]',
                  value === role.value
                    ? 'bg-brand/10 text-brand'
                    : 'hover:bg-slate-50 dark:hover:bg-white/5'
                )}
                data-testid={`role-option-${role.value}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{role.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{role.shortHint}</p>
                  </div>
                  {value === role.value && (
                    <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand">
                      Selected
                    </span>
                  )}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

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
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);

  const { isAuthenticated, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveFeatureIndex((currentIndex) => (currentIndex + 1) % roles.length);
    }, 3800);

    return () => window.clearInterval(intervalId);
  }, []);

  if (isAuthenticated) {
    return <Navigate to={user?.role === 'chef' ? '/chef-dashboard' : '/dashboard'} replace />;
  }

  const activeFeature = roles[activeFeatureIndex];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleRoleSelect = (roleValue) => {
    const matchingIndex = roles.findIndex((role) => role.value === roleValue);

    setFormData((currentData) => ({
      ...currentData,
      role: roleValue,
    }));

    if (matchingIndex >= 0) {
      setActiveFeatureIndex(matchingIndex);
    }
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
      <div
        className="relative z-10 mx-auto flex h-screen w-full max-w-7xl items-center px-4 py-4 sm:px-6"
        data-testid="register-shell"
      >
        <div className="absolute right-4 top-4 z-20 sm:right-6">
          <ThemeToggle />
        </div>

        <div className="grid w-full gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          {/* LEFT PANEL — visible only on large screens, shows role info */}
          <Card
            hover={false}
            className="relative hidden h-[calc(100vh-2rem)] max-h-[780px] overflow-hidden bg-slate-950 text-white dark:bg-[#0f1118] lg:block"
            data-testid="register-info-panel"
          >
            <div className="absolute inset-0 grid grid-cols-2 gap-2 p-2">
              <SmartImage src="/images/food2.jpg" alt="Curated dish" className="rounded-[1.75rem]" />
              <div className="grid gap-2">
                <SmartImage src="/images/food4.jpg" alt="Private dining spread" className="rounded-[1.75rem]" />
                <SmartImage src="/images/food5.jpg" alt="Chef plated menu" className="rounded-[1.75rem]" />
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-950/50 to-brand/25" />
            <div className="relative z-10 flex h-full flex-col justify-between p-4 sm:p-5 xl:p-6">
              <div>
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.28em] text-white/80 backdrop-blur-xl">
                  Premium onboarding
                </div>
                <h1 className="mt-3 max-w-xl font-display text-lg leading-tight sm:text-xl xl:text-[2rem]">
                  Choose the role that matches how you want to experience food.
                </h1>
                <p className="mt-4 max-w-lg text-xs leading-5 text-white/80">
                  Whether you are ordering, hosting a chef-led dinner, or operating the kitchen
                  side of the platform, the product now opens with clearer intent.
                </p>
              </div>

              <div className="max-w-xl">
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-white/75 backdrop-blur-xl">
                  Feature spotlight
                </div>

                <div className="mt-5 h-[250px] rounded-[2rem] border border-white/12 bg-white/10 p-6 shadow-[0_28px_64px_rgba(15,23,42,0.22)] backdrop-blur-xl">
                  <div className="flex h-full flex-col">
                    <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55">
                      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-brand shadow-[0_0_18px_rgba(255,107,53,0.75)]" />
                      Role highlight
                    </div>

                    <div className="relative mt-5 h-[150px]">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeFeature.value}
                          initial={{ opacity: 0, y: 18 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -18 }}
                          transition={{ duration: 0.28, ease: 'easeOut' }}
                          className="absolute inset-0"
                        >
                          <h2 className="font-display text-3xl leading-tight text-white xl:text-[2.8rem]">
                            {activeFeature.title}
                          </h2>
                          <p className="mt-4 max-w-md text-sm leading-7 text-white/78 xl:text-base">
                            {activeFeature.description}
                          </p>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* RIGHT PANEL — form */}
          <Card
            hover={false}
            className="max-h-[calc(100vh-2rem)] overflow-y-auto p-6 sm:p-8"
            data-testid="register-form-card"
          >
            <div className="mx-auto w-full max-w-lg">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand" data-testid="register-subtitle">
                Join Zaykaa
              </p>
              <h2 className="mt-3 font-display text-3xl text-slate-950 dark:text-white sm:text-[2rem]" data-testid="register-title">
                Create a premium access pass
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300" data-testid="register-description">
                Set up your profile, choose your role, and start with a more app-like, elegant
                experience from the first screen.
              </p>

              {error && (
                <div
                  className="mt-4 rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-900 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100"
                  data-testid="register-error-banner"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-3" data-testid="register-form">
                <FloatingInput
                  label="Full name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                  data-testid="register-name-input"
                />
                <FloatingInput
                  label="Email address"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                  data-testid="register-email-input"
                />

                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200" data-testid="role-label">
                    Choose role
                  </p>
                  <RoleDropdown
                    value={formData.role}
                    onChange={handleRoleSelect}
                    roles={roles}
                  />
                </div>

                {/* Native state/region fields — animated */}
                <AnimatePresence mode="wait">
                  {['chef', 'seller'].includes(formData.role) && (
                    <motion.div
                      key="native-fields"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                      data-testid="native-fields-container"
                    >
                      <div className="rounded-[1.4rem] border border-brand/20 bg-brand/10 p-4">
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">
                          Regional authenticity
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                          Chefs and sellers publish food with profile-linked regional origins, so your
                          native state helps Zaykaa preserve authentic cuisine stories.
                        </p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <FloatingInput
                            label="Native state"
                            type="text"
                            name="nativeState"
                            value={formData.nativeState}
                            onChange={handleChange}
                            required
                            data-testid="register-nativestate-input"
                          />
                          <FloatingInput
                            label="Native region (optional)"
                            type="text"
                            name="nativeRegion"
                            value={formData.nativeRegion}
                            onChange={handleChange}
                            data-testid="register-nativeregion-input"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid gap-3 sm:grid-cols-2">
                  <FloatingInput
                    label="Password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                    data-testid="register-password-input"
                  />
                  <FloatingInput
                    label="Confirm password"
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                    data-testid="register-confirmpassword-input"
                  />
                </div>

                <Button type="submit" size="lg" block disabled={loading} className="mt-2" data-testid="register-submit-button">
                  {loading ? 'Creating your account...' : 'Register'}
                </Button>
              </form>

              <div className="mt-6 flex items-center justify-between gap-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Already have an account?{' '}
                  <Link to="/login" className="font-semibold text-brand transition hover:text-brand-deep" data-testid="register-to-login-link">
                    Sign in
                  </Link>
                </p>
                <Link to="/login" className={buttonStyles({ variant: 'ghost', size: 'sm' })} data-testid="register-to-login-button">
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
