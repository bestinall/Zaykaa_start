import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Header from '../components/Common/Header';
import BookingsList from '../components/ChefDashboard/BookingsList';
import RecipesList from '../components/ChefDashboard/RecipesList';
import ChefMenuManagement from '../components/ChefDashboard/ChefMenuManagement';
import Analytics from '../components/ChefDashboard/Analytics';
import ChefSidebar from '../components/ChefDashboard/ChefSidebar';
import PageTransition from '../components/ui/PageTransition';
import Card from '../components/ui/Card';
import { SkeletonCard } from '../components/ui/Skeleton';
import SectionHeader from '../components/ui/SectionHeader';
import { useAuth } from '../context/AuthContext';
import { chefService } from '../services/chef';
import { chefMenuService } from '../services/chefMenu';
import {
  previewAnalytics,
  previewChefBookings,
  previewMenuItems,
  previewRecipes,
} from '../data/mockData';
import { formatCurrency, formatDate, humanize } from '../utils/display';

const Icon = ({ path, className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {path}
  </svg>
);

const icons = {
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
  star: <path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.8L6.6 19.7l1-6L3.2 9.4l6.1-.9L12 3z" />,
  utensils: <><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
};

const tabs = [
  {
    key: 'overview',
    label: 'Overview',
    short: 'OV',
    description: 'Studio summary',
  },
  {
    key: 'bookings',
    label: 'Bookings',
    short: 'BK',
    description: 'Guest pipeline',
  },
  {
    key: 'recipes',
    label: 'Recipes',
    short: 'RC',
    description: 'Signature dishes',
  },
  {
    key: 'menu',
    label: 'Menu',
    short: 'MN',
    description: 'Live items',
  },
  {
    key: 'analytics',
    label: 'Analytics',
    short: 'AN',
    description: 'Performance',
  },
];

const extractFoods = (response) =>
  response?.foods || response?.data?.foods || response?.data?.data?.foods || [];

const ChefDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [bookings, setBookings] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [analytics, setAnalytics] = useState(previewAnalytics);
  const [menuItems, setMenuItems] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [previewFlags, setPreviewFlags] = useState({
    bookings: false,
    recipes: false,
    analytics: false,
    menu: false,
  });

  const loadBookings = async () => {
    try {
      const response = await chefService.getChefBookings();
      const items = response.bookings || [];

      if (items.length === 0) {
        setBookings(previewChefBookings);
        setPreviewFlags((current) => ({ ...current, bookings: true }));
      } else {
        setBookings(items);
        setPreviewFlags((current) => ({ ...current, bookings: response.source === 'preview' }));
      }
    } catch (error) {
      setBookings(previewChefBookings);
      setPreviewFlags((current) => ({ ...current, bookings: true }));
    }
  };

  const loadRecipes = async () => {
    try {
      const response = await chefService.getChefRecipes();
      const items = response.recipes || [];

      if (items.length === 0) {
        setRecipes(previewRecipes);
        setPreviewFlags((current) => ({ ...current, recipes: true }));
      } else {
        setRecipes(items);
        setPreviewFlags((current) => ({ ...current, recipes: response.source === 'preview' }));
      }
    } catch (error) {
      setRecipes(previewRecipes);
      setPreviewFlags((current) => ({ ...current, recipes: true }));
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await chefService.getAnalytics();
      setAnalytics({ ...previewAnalytics, ...response });
      setPreviewFlags((current) => ({ ...current, analytics: response.source === 'preview' }));
    } catch (error) {
      setAnalytics(previewAnalytics);
      setPreviewFlags((current) => ({ ...current, analytics: true }));
    }
  };

  const loadMenu = async () => {
    try {
      const response = await chefMenuService.getMyMenu();
      const items = extractFoods(response);

      if (items.length === 0) {
        setMenuItems(previewMenuItems);
        setPreviewFlags((current) => ({ ...current, menu: true }));
      } else {
        setMenuItems(items);
        setPreviewFlags((current) => ({ ...current, menu: response.source === 'preview' }));
      }
    } catch (error) {
      setMenuItems(previewMenuItems);
      setPreviewFlags((current) => ({ ...current, menu: true }));
    }
  };

  useEffect(() => {
    const loadStudio = async () => {
      setInitialLoading(true);
      await Promise.all([loadBookings(), loadRecipes(), loadAnalytics(), loadMenu()]);
      setInitialLoading(false);
    };

    loadStudio();
  }, []);

  const summaryCards = [
    { label: 'Bookings', value: String(bookings.length), icon: icons.calendar },
    { label: 'Revenue', value: formatCurrency(analytics.totalEarnings), icon: icons.star, highlight: true },
    { label: 'Rating', value: `${analytics.averageRating}`, icon: icons.star },
    { label: 'Menu items', value: String(menuItems.length), icon: icons.utensils },
  ];

  const renderOverview = () => (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card hover={false} className="space-y-4">
          <SectionHeader
            eyebrow="Upcoming"
            title="Next bookings"
            description="Your upcoming guest sessions"
          />
          <div className="space-y-3">
            {bookings.slice(0, 3).map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/60 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-950 dark:text-white truncate">
                    {booking.userName || booking.customerName || booking.user?.name || 'Guest'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(booking.date)} • {humanize(booking.timeSlot || 'dinner')}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="rounded-full bg-slate-900/5 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-white/5 dark:text-slate-200">
                    {humanize(booking.status || 'pending')}
                  </span>
                  <span className="text-xs font-semibold text-slate-950 dark:text-white">
                    {booking.guestCount || booking.guests || 0} guests
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card hover={false} className="space-y-4">
          <SectionHeader
            eyebrow="Menu"
            title="Featured dishes"
            description="Your current menu highlights"
          />
          <div className="space-y-3">
            {menuItems.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/60 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-950 dark:text-white truncate">{item.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">{formatCurrency(item.price)}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {item.views || 0} views
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Analytics data={analytics} previewMode={previewFlags.analytics} />
    </div>
  );

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'bookings':
        return <BookingsList bookings={bookings} onRefresh={loadBookings} previewMode={previewFlags.bookings} />;
      case 'recipes':
        return <RecipesList recipes={recipes} onRefresh={loadRecipes} previewMode={previewFlags.recipes} />;
      case 'menu':
        return <ChefMenuManagement foods={menuItems} onRefresh={loadMenu} previewMode={previewFlags.menu} />;
      case 'analytics':
        return <Analytics data={analytics} previewMode={previewFlags.analytics} />;
      default:
        return renderOverview();
    }
  };

  return (
    <PageTransition className="app-shell">
      <Header />
      <div className="content-shell grid gap-4 xl:grid-cols-[240px_1fr]">
        <ChefSidebar
          items={tabs}
          activeItem={activeTab}
          onChange={setActiveTab}
          chefName={user?.name || 'Chef Studio'}
        />

        <div className="space-y-4">
          <Card hover={false} className="overflow-hidden p-0">
            <div className="grid gap-4 bg-hero-wash p-5 dark:bg-hero-wash-dark sm:grid-cols-[1fr_0.5fr] sm:p-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand shadow-soft backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <span className="inline-block h-1.5 w-1.5 animate-pulseSoft rounded-full bg-brand" />
                  Chef studio
                </div>
                <h1 className="mt-3 font-display text-xl leading-tight text-slate-950 dark:text-white sm:text-2xl">
                  Manage bookings, recipes, and menus
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300 line-clamp-2">
                  Your premium workspace for managing bookings, menus, recipes, and performance analytics.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:content-center">
                {summaryCards.map((card) => (
                  <div
                    key={card.label}
                    className={`rounded-xl border p-3 ${card.highlight ? 'border-brand/30 bg-brand/10' : 'border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/5'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${card.highlight ? 'bg-brand text-white' : 'bg-slate-900/5 text-slate-500 dark:bg-white/10'}`}>
                        <Icon path={card.icon} className="h-3 w-3" />
                      </span>
                    </div>
                    <p className="mt-2 text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {card.label}
                    </p>
                    <p className={`text-base font-semibold ${card.highlight ? 'text-brand' : 'text-slate-950 dark:text-white'}`}>{card.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {initialLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {renderActiveContent()}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default ChefDashboard;
