import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import ThemeToggle from '../ui/ThemeToggle';
import { buttonStyles } from '../ui/Button';
import { humanize } from '../../utils/display';
import { cn } from '../../utils/cn';
import { getHomeRouteForRole, isFoodLoverRole } from '../../utils/roleRoutes';

const Header = () => {
  const { user, logout } = useAuth();
  const { getTotalItems } = useCart();
  const navigate = useNavigate();
  const cartItemCount = getTotalItems();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isFoodLover = isFoodLoverRole(user?.role);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems =
    user?.role === 'chef'
      ? [
          { to: '/chef-dashboard', label: 'Chef Studio' },
          { to: '/recipes', label: 'Recipe Book' },
        ]
      : [
          { to: getHomeRouteForRole(user?.role), label: 'Dashboard' },
          { to: '/recipes', label: 'Recipe Book' },
          ...(isFoodLover
            ? [
                { to: '/book-chef', label: 'Book Chef' },
                {
                  to: '/order',
                  label: 'Order Food',
                  badge: cartItemCount > 0 ? cartItemCount : null,
                },
              ]
            : []),
        ];

  const navLinkClass = ({ isActive }) =>
    cn(
      'inline-flex min-w-[7.75rem] items-center justify-center gap-2 rounded-full px-4 py-2 text-center text-sm font-medium transition',
      isActive
        ? 'bg-slate-950 text-white shadow-soft dark:bg-white dark:text-slate-950'
        : 'text-slate-600 hover:bg-slate-900/5 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
    );

  return (
    <motion.header
      className="sticky top-0 z-40 px-4 pt-4 sm:px-6"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="glass-panel rounded-[2rem] border border-white/60 bg-white/80 px-4 py-3 shadow-soft backdrop-blur-2xl dark:border-white/10 dark:bg-[#111115]/80 sm:px-5">
          <div className="flex items-center justify-between gap-4">
            <Link to={getHomeRouteForRole(user?.role)} className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand via-orange-500 to-red-500 text-lg font-bold text-white shadow-glow">
                Z
              </div>
              <div className="min-w-0">
                <p className="font-display text-2xl leading-none text-slate-950 dark:text-white">
                  Zaykaa
                </p>
                <p className="mt-1 hidden text-xs tracking-[0.18em] text-slate-500 sm:block dark:text-slate-400">
                  Curated meals, chef bookings, premium food journeys
                </p>
              </div>
            </Link>

            <nav className="hidden items-center gap-2 lg:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={navLinkClass}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="hidden items-center gap-4 md:flex">
              <ThemeToggle />
              <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1.5 shadow-soft dark:border-white/10 dark:bg-white/5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 text-brand text-xs font-semibold">
                  {user?.name?.charAt(0).toUpperCase() || 'G'}
                </span>
                <div className="flex flex-col items-start">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                    {user?.name || 'Guest'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    {humanize(user?.role || 'member')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className={buttonStyles({ variant: 'secondary', size: 'sm' })}
              >
                Log out
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/60 bg-white/80 text-slate-700 shadow-soft dark:border-white/10 dark:bg-white/10 dark:text-slate-200 md:hidden"
              aria-label="Toggle navigation"
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5 fill-current">
                {mobileMenuOpen ? (
                  <path d="M5.22 5.22a.75.75 0 0 1 1.06 0L10 8.94l3.72-3.72a.75.75 0 1 1 1.06 1.06L11.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06L10 11.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06L8.94 10 5.22 6.28a.75.75 0 0 1 0-1.06Z" />
                ) : (
                  <path d="M3.5 5.75A.75.75 0 0 1 4.25 5h11.5a.75.75 0 0 1 0 1.5H4.25a.75.75 0 0 1-.75-.75Zm0 4.25a.75.75 0 0 1 .75-.75h11.5a.75.75 0 0 1 0 1.5H4.25a.75.75 0 0 1-.75-.75Zm0 4.25a.75.75 0 0 1 .75-.75h11.5a.75.75 0 0 1 0 1.5H4.25a.75.75 0 0 1-.75-.75Z" />
                )}
              </svg>
            </button>
          </div>

          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden md:hidden"
              >
                <div className="mt-4 space-y-3 border-t border-black/5 pt-4 dark:border-white/10">
                  <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 text-brand text-xs font-semibold">
                      {user?.name?.charAt(0).toUpperCase() || 'G'}
                    </span>
                    <div className="flex flex-col items-start">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                        {user?.name || 'Guest'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                        {humanize(user?.role || 'member')}
                      </p>
                    </div>
                    <ThemeToggle className="ml-auto" />
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className={buttonStyles({ variant: 'secondary', size: 'sm', block: true })}
                  >
                    Log out
                  </button>
                  <div className="grid gap-2">
                    {navItems.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={navLinkClass}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
