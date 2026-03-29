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
import Skeleton, { SkeletonCard } from '../components/ui/Skeleton';
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

const tabs = [
  {
    key: 'overview',
    label: 'Overview',
    short: 'OV',
    description: 'Studio summary and quick readouts',
  },
  {
    key: 'bookings',
    label: 'Bookings',
    short: 'BK',
    description: 'Status updates and guest pipeline',
  },
  {
    key: 'recipes',
    label: 'Recipes',
    short: 'RC',
    description: 'Signature dishes and idea library',
  },
  {
    key: 'menu',
    label: 'Menu',
    short: 'MN',
    description: 'Live items and food card management',
  },
  {
    key: 'analytics',
    label: 'Analytics',
    short: 'AN',
    description: 'Charts, performance, and revenue',
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
        setPreviewFlags((current) => ({ ...current, bookings: false }));
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
        setPreviewFlags((current) => ({ ...current, recipes: false }));
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
      setPreviewFlags((current) => ({ ...current, analytics: false }));
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
        setPreviewFlags((current) => ({ ...current, menu: false }));
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
    { label: 'Bookings', value: bookings.length },
    { label: 'Revenue', value: formatCurrency(analytics.totalEarnings), highlight: true },
    { label: 'Rating', value: `${analytics.averageRating} / 5` },
    { label: 'Menu items', value: menuItems.length },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card hover={false} className="space-y-5">
          <SectionHeader
            eyebrow="Upcoming bookings"
            title="What is next on your calendar"
            description="A high-signal snapshot of the next guest sessions without digging through tables."
          />
          <div className="space-y-4">
            {bookings.slice(0, 3).map((booking) => (
              <div
                key={booking.id}
                className="rounded-[1.5rem] border border-white/60 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-950 dark:text-white">
                      {booking.userName || booking.customerName || booking.user?.name || 'Guest'}
                    </p>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(booking.date)} • {humanize(booking.timeSlot || 'dinner')}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-white/5 dark:text-slate-200">
                    {humanize(booking.status || 'pending')}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">
                    {booking.guestCount || booking.guests || 0} guests
                  </span>
                  <span className="font-semibold text-slate-950 dark:text-white">
                    {formatCurrency(booking.amount || booking.totalAmount || 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card hover={false} className="space-y-5">
          <SectionHeader
            eyebrow="Menu highlights"
            title="Your current featured dishes"
            description="Showcase what guests are most likely to see and book right now."
          />
          <div className="space-y-4">
            {menuItems.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-white/60 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5"
              >
                <div>
                  <p className="font-semibold text-slate-950 dark:text-white">{item.name}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-950 dark:text-white">{formatCurrency(item.price)}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
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
      <div className="content-shell grid gap-6 xl:grid-cols-[300px_1fr]">
        <ChefSidebar
          items={tabs}
          activeItem={activeTab}
          onChange={setActiveTab}
          chefName={user?.name || 'Chef Studio'}
        />

        <div className="space-y-6">
          <Card hover={false} className="overflow-hidden p-0">
            <div className="grid gap-6 bg-hero-wash p-8 dark:bg-hero-wash-dark lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">
                  Chef dashboard
                </p>
                <h1 className="mt-4 font-display text-5xl leading-tight text-slate-950 dark:text-white">
                  Run bookings, recipes, menus, and analytics from one premium control room.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">
                  The new chef experience is built like a polished workspace, with sidebar
                  navigation, richer surfaces, stronger hierarchy, and clearer operating signals.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
                {summaryCards.map((card) => (
                  <Card
                    key={card.label}
                    hover={false}
                    className={`p-5 ${card.highlight ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : ''}`}
                  >
                    <p
                      className={`text-sm ${card.highlight ? 'text-white/70 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                      {card.label}
                    </p>
                    <p className="mt-3 text-2xl font-semibold">{card.value}</p>
                  </Card>
                ))}
              </div>
            </div>
          </Card>

          {initialLoading ? (
            <div className="grid gap-5 lg:grid-cols-2">
              <SkeletonCard />
              <SkeletonCard />
              <Card hover={false} className="lg:col-span-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-4 h-10 w-3/5" />
                <Skeleton className="mt-6 h-72 w-full rounded-[1.75rem]" />
              </Card>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.24 }}
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
