import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Header from '../components/Common/Header';
import PageTransition from '../components/ui/PageTransition';
import Card from '../components/ui/Card';
import { buttonStyles } from '../components/ui/Button';
import { SkeletonCard } from '../components/ui/Skeleton';
import SectionHeader from '../components/ui/SectionHeader';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { orderService } from '../services/order';
import { communityService } from '../services/community';
import { previewChefs, previewCommunityMembers, previewOrders, previewRecipes } from '../data/mockData';
import { formatCurrency, formatDate, formatDateTime, getInitials, humanize } from '../utils/display';

/* --------------------------------- Icons --------------------------------- */

const Icon = ({ path, className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {path}
  </svg>
);

const icons = {
  bowl: <><path d="M3 11h18" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 7V3" /><path d="M9 5l3-2 3 2" /></>,
  chef: <><circle cx="12" cy="7" r="4" /><path d="M5 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" /></>,
  sparkle: <><path d="M12 3l1.8 4.5L18 9l-4.2 1.5L12 15l-1.8-4.5L6 9l4.2-1.5L12 3z" /><path d="M19 15l.7 1.8L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15z" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  trend: <><path d="M3 17l6-6 4 4 7-8" /><path d="M14 7h6v6" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3 2.5-5 6-5s6 2 6 5" /><circle cx="17" cy="9" r="2" /><path d="M15 20c0-2 1-3.5 3-4" /></>,
  bag: <><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  arrowRight: <><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></>,
  dot: <circle cx="12" cy="12" r="4" />,
  pin: <><path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></>,
  star: <path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.8L6.6 19.7l1-6L3.2 9.4l6.1-.9L12 3z" />,
};

/* --------------------------- Shared tiny pieces -------------------------- */

const StatusDot = ({ tone = 'live' }) => {
  const map = {
    live: 'bg-emerald-500',
    preview: 'bg-amber-500',
    neutral: 'bg-slate-400',
  };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${map[tone] || map.neutral}`} />
    </span>
  );
};

const getRecipeOrigin = (recipe) =>
  [recipe.originRegion, recipe.originState].filter(Boolean).join(', ') || 'Profile-linked origin';

const memberRoleMap = {
  seller: {
    badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-200',
    label: 'Food Seller',
    avatarClass: 'bg-gradient-to-br from-orange-500 to-red-500',
  },
  agent: {
    badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200',
    label: 'Delivery Agent',
    avatarClass: 'bg-gradient-to-br from-sky-500 to-indigo-500',
  },
  vlogger: {
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200',
    label: 'Content Creator',
    avatarClass: 'bg-gradient-to-br from-emerald-500 to-teal-500',
  },
};

/* ----------------------------- Content cards ----------------------------- */

const NetworkRecipeCard = ({ recipe }) => (
  <Card hover={false} padded={false} className="flex flex-col overflow-hidden">
    <div className="relative h-28 bg-gradient-to-br from-orange-400 via-brand to-red-500">
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), transparent 40%), radial-gradient(circle at 80% 60%, rgba(255,255,255,0.2), transparent 45%)' }} />
      <div className="absolute left-5 top-5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-900 backdrop-blur">
          <Icon path={icons.sparkle} className="h-3 w-3" />
          {humanize(recipe.authorRole || 'chef')}
        </span>
      </div>
      <div className="absolute right-5 top-5">
        <span className="rounded-full bg-slate-950/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          {recipe.price !== null && recipe.price !== undefined ? formatCurrency(recipe.price) : `${recipe.views || 0} views`}
        </span>
      </div>
    </div>

    <div className="flex flex-1 flex-col p-5">
      <h3 className="font-display text-xl leading-snug text-slate-950 dark:text-white line-clamp-2">
        {recipe.title}
      </h3>
      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
        By {recipe.authorName} • {getRecipeOrigin(recipe)}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300 line-clamp-2">
        {recipe.description}
      </p>

      <div className="mt-auto flex items-center justify-between pt-4">
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Icon path={icons.clock} className="h-3.5 w-3.5" />
          {recipe.cookingTimeMinutes || 0}m • {recipe.servings || 0} servings
        </span>
        <Link
          to="/recipes"
          className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:gap-2 transition-all"
        >
          View
          <Icon path={icons.arrowRight} className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  </Card>
);

const NetworkChefCard = ({ chef }) => (
  <Card hover={false} className="flex h-full flex-col p-5">
    <div className="flex items-start gap-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand via-orange-500 to-red-500 text-lg font-bold text-white shadow-soft">
        {getInitials(chef.name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">New chef</p>
        <h3 className="mt-1 font-display text-xl leading-snug text-slate-950 dark:text-white line-clamp-1">
          {chef.name}
        </h3>
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
          <Icon path={icons.pin} className="h-3.5 w-3.5" />
          {chef.location || chef.city || chef.state || 'Location on profile'}
        </p>
      </div>
      {chef.rating && (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
          <Icon path={icons.star} className="h-3 w-3" />
          {chef.rating.toFixed(1)}
        </span>
      )}
    </div>

    <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300 line-clamp-3">
      {chef.bio || chef.headline || 'This chef profile is now live for food lovers to discover.'}
    </p>

    {(chef.specialties || []).length > 0 && (
      <div className="mt-4 flex flex-wrap gap-1.5">
        {(chef.specialties || []).slice(0, 3).map((specialty) => (
          <span
            key={`${chef.id}-${specialty}`}
            className="rounded-full bg-slate-900/5 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:bg-white/10 dark:text-slate-200"
          >
            {specialty}
          </span>
        ))}
      </div>
    )}

    <div className="mt-auto flex items-center justify-between pt-5">
      <div>
        <p className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">From</p>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          {formatCurrency(chef.hourlyRate || 0)}
          <span className="text-xs font-normal text-slate-500 dark:text-slate-400"> / session</span>
        </p>
      </div>
      <Link
        to="/book-chef"
        className="inline-flex items-center gap-1 rounded-full bg-slate-950 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-white/90"
      >
        View chef
        <Icon path={icons.arrowRight} className="h-3 w-3" />
      </Link>
    </div>
  </Card>
);

const NetworkMemberCard = ({ member }) => {
  const meta = memberRoleMap[member.role] || {
    badgeClass: 'bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-slate-200',
    label: humanize(member.role || 'member'),
    avatarClass: 'bg-gradient-to-br from-slate-700 to-slate-900',
  };

  return (
    <Card hover={false} className="flex h-full flex-col p-5">
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white shadow-soft ${meta.avatarClass}`}>
          {getInitials(member.name)}
        </div>
        <div className="min-w-0 flex-1">
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] ${meta.badgeClass}`}>
            {meta.label}
          </span>
          <h3 className="mt-1.5 font-display text-lg leading-snug text-slate-950 dark:text-white line-clamp-1">
            {member.name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{member.locationLabel}</p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300 line-clamp-3">
        {member.headline}
      </p>
      <p className="mt-auto pt-4 text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
        Joined {formatDate(member.joinedAt)}
      </p>
    </Card>
  );
};

/* ------------------------------ Main page ------------------------------- */

const Dashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [recentOrders, setRecentOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [networkFeed, setNetworkFeed] = useState({
    chefs: [],
    recipes: [],
    members: [],
  });
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedPreviewMode, setFeedPreviewMode] = useState(false);

  useEffect(() => {
    let active = true;

    const loadOrders = async () => {
      try {
        const response = await orderService.getRecentOrders();
        const orders = response.orders || [];

        if (!active) {
          return;
        }

        if (orders.length === 0) {
          setRecentOrders(previewOrders);
          setPreviewMode(true);
        } else {
          setRecentOrders(orders);
          setPreviewMode(false);
        }
      } catch (error) {
        if (!active) {
          return;
        }

        setRecentOrders(previewOrders);
        setPreviewMode(true);
        toast.info('Preview data enabled', 'Live recent orders are unavailable right now.');
      } finally {
        if (active) {
          setOrdersLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      active = false;
    };
  }, [toast]);

  useEffect(() => {
    let active = true;

    const loadNetworkFeed = async () => {
      setFeedLoading(true);
      try {
        const response = await communityService.getFoodNetworkFeed();
        if (!active) {
          return;
        }
        setNetworkFeed({
          chefs: response.chefs || [],
          recipes: response.recipes || [],
          members: response.members || [],
        });
        setFeedPreviewMode(false);
      } catch (error) {
        if (!active) {
          return;
        }
        setNetworkFeed({
          chefs: previewChefs.slice(0, 3),
          recipes: previewRecipes.slice(0, 3),
          members: previewCommunityMembers.slice(0, 4),
        });
        setFeedPreviewMode(true);
        toast.info('Food network preview enabled', 'Live community discovery is unavailable right now.');
      } finally {
        if (active) {
          setFeedLoading(false);
        }
      }
    };

    loadNetworkFeed();

    return () => {
      active = false;
    };
  }, [toast]);

  const thirdAction = user?.role === 'chef'
    ? {
        label: 'Chef Studio',
        title: 'Open your chef dashboard',
        description: 'Review bookings, menu management, analytics, and recipe performance.',
        to: '/chef-dashboard',
        icon: icons.trend,
      }
    : user?.role === 'seller'
      ? {
          label: 'Recipe Book',
          title: 'Publish and manage your recipes',
          description: 'Share cooking methods, update your published dishes, and build your recipe presence.',
          to: '/recipes',
          icon: icons.sparkle,
        }
      : {
          label: 'Recent Activity',
          title: 'Continue from your latest order',
          description: 'See recent order history and pick up from your last favorite kitchen.',
          to: '/order',
          icon: icons.clock,
        };

  const quickActions = [
    {
      label: 'Order Food',
      title: 'Restaurant discovery',
      description: 'Browse nearby kitchens, add menu items, and move into a sticky cart flow.',
      to: '/order',
      icon: icons.bag,
      accent: 'from-orange-500 to-red-500',
    },
    {
      label: 'Book Chef',
      title: 'Private chef experience',
      description: 'Explore premium chef profiles, filter by cuisine and pricing, and request a slot.',
      to: '/book-chef',
      icon: icons.chef,
      accent: 'from-amber-500 to-orange-500',
    },
    {
      ...thirdAction,
      accent: 'from-slate-700 to-slate-900 dark:from-slate-200 dark:to-slate-400',
    },
  ];

  const networkUpdateCount =
    networkFeed.recipes.length + networkFeed.chefs.length + networkFeed.members.length;

  const metrics = [
    { label: 'Role', value: humanize(user?.role || 'member'), icon: icons.users },
    { label: 'Recent orders', value: String(recentOrders.length).padStart(2, '0'), icon: icons.bag },
    { label: 'Network updates', value: String(networkUpdateCount).padStart(2, '0'), icon: icons.sparkle },
    {
      label: 'Status',
      value: previewMode || feedPreviewMode ? 'Preview' : 'Live sync',
      icon: icons.dot,
      tone: previewMode || feedPreviewMode ? 'preview' : 'live',
    },
  ];

  return (
    <PageTransition className="app-shell">
      <Header />
      <div className="content-shell space-y-10">

        {/* ---------------------- HERO ---------------------- */}
        <Card hover={false} padded={false} className="relative overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-[1.25fr_1fr]">
            <div className="bg-hero-wash p-7 dark:bg-hero-wash-dark sm:p-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand shadow-soft backdrop-blur dark:border-white/10 dark:bg-white/5">
                <span className="inline-block h-1.5 w-1.5 animate-pulseSoft rounded-full bg-brand" />
                Welcome back
              </div>
              <h1 className="mt-5 max-w-xl font-display text-3xl leading-tight text-slate-950 dark:text-white sm:text-4xl">
                Hi {user?.name?.split(' ')[0] || 'there'}, your curated food homebase is ready.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                Move seamlessly between ordering, chef discovery, and private dining planning — all from a single calmer surface.
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <Link to="/order" className={buttonStyles({ variant: 'primary', size: 'md' })}>
                  <Icon path={icons.bag} className="h-4 w-4" />
                  Order Food
                </Link>
                <Link to="/book-chef" className={buttonStyles({ variant: 'secondary', size: 'md' })}>
                  <Icon path={icons.chef} className="h-4 w-4" />
                  Book Chef
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-5 sm:p-6 lg:p-7 lg:content-center">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="group rounded-2xl border border-white/60 bg-white/75 p-4 shadow-soft transition hover:shadow-elevated dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 text-brand">
                      <Icon path={metric.icon} className="h-4 w-4" />
                    </span>
                    {metric.tone && <StatusDot tone={metric.tone} />}
                  </div>
                  <p className="mt-3 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {metric.label}
                  </p>
                  <p className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* ---------------------- QUICK ACTIONS ---------------------- */}
        <section>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand">Quick actions</p>
              <h2 className="mt-1.5 font-display text-2xl text-slate-950 dark:text-white">Pick where to continue</h2>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: index * 0.06 }}
              >
                <Link
                  to={action.to}
                  className="glass-panel group relative flex h-full flex-col overflow-hidden rounded-4xl border border-white/60 bg-white/75 p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-elevated dark:border-white/10 dark:bg-[#17171d]/75"
                >
                  <div
                    className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${action.accent} text-white shadow-soft`}
                  >
                    <Icon path={action.icon} className="h-5 w-5" />
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand">
                    {action.label}
                  </p>
                  <h3 className="mt-2 font-display text-xl leading-snug text-slate-950 dark:text-white">
                    {action.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {action.description}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-slate-900 transition-all group-hover:gap-2 dark:text-white">
                    Open experience
                    <Icon path={icons.arrowRight} className="h-4 w-4" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ---------------------- FOOD NETWORK (stats) ---------------------- */}
        <Card hover={false}>
          <SectionHeader
            eyebrow="Food network"
            title="One live surface across dishes, chefs, creators and sellers"
            description="When a seller publishes a new dish or a chef creates a profile, food lovers can discover those updates here without switching across separate portals."
          />

          {feedPreviewMode && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand-deep dark:text-amber-200">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
              Showing curated network previews while live discovery is unavailable
            </div>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Fresh dishes', value: networkFeed.recipes.length, icon: icons.bowl, tint: 'from-orange-500 to-red-500' },
              { label: 'Chef profiles', value: networkFeed.chefs.length, icon: icons.chef, tint: 'from-amber-500 to-orange-500' },
              { label: 'Other active roles', value: networkFeed.members.length, icon: icons.users, tint: 'from-sky-500 to-indigo-500' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-4 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-soft dark:border-white/10 dark:bg-white/5"
              >
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${stat.tint} text-white`}>
                  <Icon path={stat.icon} className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </p>
                  <p className="mt-0.5 text-2xl font-semibold text-slate-950 dark:text-white">
                    {String(stat.value).padStart(2, '0')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ---------------------- FRESH DISHES ---------------------- */}
        <Card hover={false}>
          <SectionHeader
            eyebrow="Fresh dishes"
            title="New dishes from chefs and sellers"
            description="Recent public dishes land here first, so food lovers can spot new seller listings and chef creations as soon as they go live."
            action={
              <Link to="/recipes" className={buttonStyles({ variant: 'secondary', size: 'sm' })}>
                Recipe Book
                <Icon path={icons.arrowRight} className="h-3.5 w-3.5" />
              </Link>
            }
          />

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {feedLoading ? (
              Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={`recipe-skeleton-${index}`} />)
            ) : networkFeed.recipes.length > 0 ? (
              networkFeed.recipes.map((recipe) => <NetworkRecipeCard key={recipe.id} recipe={recipe} />)
            ) : (
              <p className="col-span-full text-sm text-slate-500 dark:text-slate-400">
                No public dishes are available yet.
              </p>
            )}
          </div>
        </Card>

        {/* ---------------------- CHEF DISCOVERY ---------------------- */}
        <Card hover={false}>
          <SectionHeader
            eyebrow="Chef discovery"
            title="Recent chef profiles visible to food lovers"
            description="Chef profiles created in the chef workspace feed into this discovery surface so booking can start from visibility, not manual promotion."
            action={
              <Link to="/book-chef" className={buttonStyles({ variant: 'secondary', size: 'sm' })}>
                Browse chefs
                <Icon path={icons.arrowRight} className="h-3.5 w-3.5" />
              </Link>
            }
          />

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {feedLoading ? (
              Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={`chef-skeleton-${index}`} />)
            ) : networkFeed.chefs.length > 0 ? (
              networkFeed.chefs.map((chef) => <NetworkChefCard key={chef.id} chef={chef} />)
            ) : (
              <p className="col-span-full text-sm text-slate-500 dark:text-slate-400">
                No chef profiles are available yet.
              </p>
            )}
          </div>
        </Card>

        {/* ---------------------- PLATFORM ROLES ---------------------- */}
        <Card hover={false}>
          <SectionHeader
            eyebrow="Platform roles"
            title="Creators, sellers, and delivery agents in one view"
            description="This directory makes the rest of the food ecosystem visible too, so the platform feels connected instead of role silos living in separate screens."
          />

          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {feedLoading ? (
              Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={`member-skeleton-${index}`} />)
            ) : networkFeed.members.length > 0 ? (
              networkFeed.members.map((member) => (
                <NetworkMemberCard key={member.id} member={member} />
              ))
            ) : (
              <p className="col-span-full text-sm text-slate-500 dark:text-slate-400">
                No public community members are available yet.
              </p>
            )}
          </div>
        </Card>

        {/* ---------------------- RECENT ORDERS ---------------------- */}
        <Card hover={false}>
          <SectionHeader
            eyebrow="Recent orders"
            title="A quick snapshot of your latest meals"
            description="Card-based history keeps recent orders scannable without looking like a raw admin table."
            action={
              <Link to="/order" className={buttonStyles({ variant: 'secondary', size: 'sm' })}>
                Explore restaurants
                <Icon path={icons.arrowRight} className="h-3.5 w-3.5" />
              </Link>
            }
          />

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ordersLoading
              ? Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={index} />)
              : recentOrders.map((order) => (
                  <Card key={order.id} hover={false} className="flex h-full flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-700 dark:bg-white/10 dark:text-slate-200">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {humanize(order.status || 'pending')}
                        </span>
                        <h3 className="mt-2.5 font-display text-lg leading-snug text-slate-950 dark:text-white line-clamp-1">
                          {order.restaurantName || 'Curated meal order'}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {formatDateTime(order.createdAt)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Total</p>
                        <p className="mt-0.5 text-base font-semibold text-slate-950 dark:text-white">
                          {formatCurrency(order.totalAmount)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between border-t border-slate-900/5 pt-4 text-xs dark:border-white/10">
                      <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <Icon path={icons.bag} className="h-3.5 w-3.5" />
                        {order.items?.length || 0} items
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 font-semibold ${
                          previewMode ? 'text-amber-600 dark:text-amber-300' : 'text-emerald-600 dark:text-emerald-300'
                        }`}
                      >
                        <span className={`inline-block h-1.5 w-1.5 rounded-full ${previewMode ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        {previewMode ? 'Preview' : 'Live'}
                      </span>
                    </div>
                  </Card>
                ))}
          </div>

          {previewMode && !ordersLoading && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand-deep dark:text-amber-200">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
              Showing curated sample orders while live order history is unavailable
            </div>
          )}
        </Card>
      </div>
    </PageTransition>
  );
};

export default Dashboard;
