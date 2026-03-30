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

const memberRoleMap = {
  seller: {
    badgeClass:
      'bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-200',
    label: 'Food Seller',
  },
  agent: {
    badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200',
    label: 'Delivery Agent',
  },
  vlogger: {
    badgeClass:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200',
    label: 'Content Creator',
  },
};

const getRecipeOrigin = (recipe) =>
  [recipe.originRegion, recipe.originState].filter(Boolean).join(', ') || 'Profile-linked origin';

const NetworkRecipeCard = ({ recipe }) => (
  <Card hover={false} className="p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white dark:bg-white dark:text-slate-950">
          {humanize(recipe.authorRole || 'chef')}
        </span>
        <h3 className="mt-4 text-2xl text-slate-950 dark:text-white">{recipe.title}</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {recipe.authorName} / {getRecipeOrigin(recipe)}
        </p>
      </div>
      <div className="rounded-full border border-white/60 bg-white/80 px-3 py-1 text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-white/10 dark:text-white">
        {recipe.price !== null ? formatCurrency(recipe.price) : `${recipe.views || 0} views`}
      </div>
    </div>
    <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
      {recipe.description}
    </p>
    <div className="mt-6 flex items-center justify-between rounded-[1.5rem] bg-slate-900/5 px-4 py-3 text-sm dark:bg-white/5">
      <span className="text-slate-500 dark:text-slate-400">
        {recipe.cookingTimeMinutes || 0} mins / {recipe.servings} servings
      </span>
      <Link to="/recipes" className="font-semibold text-brand">
        View dish
      </Link>
    </div>
  </Card>
);

const NetworkChefCard = ({ chef }) => (
  <Card hover={false} className="p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">New chef profile</p>
        <h3 className="mt-3 text-2xl text-slate-950 dark:text-white">{chef.name}</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {chef.location || chef.city || chef.state || 'Location shared on profile'}
        </p>
      </div>
      <div className="rounded-full border border-white/60 bg-white/80 px-3 py-1 text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-white/10 dark:text-white">
        {chef.rating ? `${chef.rating.toFixed(1)} rating` : 'New'}
      </div>
    </div>
    <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
      {chef.bio || chef.headline || 'This chef profile is now live for food lovers to discover.'}
    </p>
    <div className="mt-5 flex flex-wrap gap-2">
      {(chef.specialties || []).slice(0, 3).map((specialty) => (
        <span
          key={`${chef.id}-${specialty}`}
          className="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-white/5 dark:text-slate-200"
        >
          {specialty}
        </span>
      ))}
    </div>
    <div className="mt-6 flex items-center justify-between rounded-[1.5rem] bg-slate-900/5 px-4 py-3 text-sm dark:bg-white/5">
      <span className="text-slate-500 dark:text-slate-400">
        {formatCurrency(chef.hourlyRate || 0)} / session
      </span>
      <Link to="/book-chef" className="font-semibold text-brand">
        View chef
      </Link>
    </div>
  </Card>
);

const NetworkMemberCard = ({ member }) => {
  const meta = memberRoleMap[member.role] || {
    badgeClass: 'bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-slate-200',
    label: humanize(member.role || 'member'),
  };

  return (
    <Card hover={false} className="p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
          {getInitials(member.name)}
        </div>
        <div className="min-w-0 flex-1">
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${meta.badgeClass}`}>
            {meta.label}
          </span>
          <h3 className="mt-3 text-2xl text-slate-950 dark:text-white">{member.name}</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{member.locationLabel}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{member.headline}</p>
      <div className="mt-6 rounded-[1.5rem] bg-slate-900/5 px-4 py-3 text-sm dark:bg-white/5">
        <span className="text-slate-500 dark:text-slate-400">Joined {formatDate(member.joinedAt)}</span>
      </div>
    </Card>
  );
};

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

  const quickActions = [
    {
      label: 'Order Food',
      title: 'Jump back into restaurant discovery',
      description: 'Browse nearby kitchens, add menu items, and move into a sticky cart flow.',
      to: '/order',
      accent: 'from-orange-500 to-red-500',
    },
    {
      label: 'Book Chef',
      title: 'Curate a private chef experience',
      description: 'Explore premium chef profiles, filter by cuisine and pricing, and request a slot.',
      to: '/book-chef',
      accent: 'from-amber-400 to-orange-500',
    },
    {
      label:
        user?.role === 'chef'
          ? 'Chef Studio'
          : user?.role === 'seller'
            ? 'Recipe Book'
            : 'Recent Activity',
      title:
        user?.role === 'chef'
          ? 'Open your chef dashboard'
          : user?.role === 'seller'
            ? 'Publish and manage your recipes'
            : 'Continue from your latest order',
      description:
        user?.role === 'chef'
          ? 'Review bookings, menu management, analytics, and recipe performance.'
          : user?.role === 'seller'
            ? 'Share cooking methods, update your published dishes, and build your recipe presence.'
            : 'See recent order history and pick up from your last favorite kitchen.',
      to: user?.role === 'chef' ? '/chef-dashboard' : user?.role === 'seller' ? '/recipes' : '/order',
      accent: 'from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300',
      inverse: true,
    },
  ];

  const networkUpdateCount =
    networkFeed.recipes.length + networkFeed.chefs.length + networkFeed.members.length;

  const metrics = [
    { label: 'Role', value: humanize(user?.role || 'member') },
    { label: 'Recent orders', value: String(recentOrders.length).padStart(2, '0') },
    { label: 'Network updates', value: String(networkUpdateCount).padStart(2, '0') },
    {
      label: 'Experience status',
      value: previewMode || feedPreviewMode ? 'Preview mode' : 'Live sync',
    },
  ];

  return (
    <PageTransition className="app-shell">
      <Header />
      <div className="content-shell space-y-8">
        <Card hover={false} className="relative overflow-hidden p-0">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="bg-hero-wash p-8 dark:bg-hero-wash-dark sm:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">
                Welcome back
              </p>
              <h1 className="mt-5 max-w-xl font-display text-5xl leading-tight text-slate-950 dark:text-white">
                Premium food moments start with a calmer dashboard.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 dark:text-slate-300">
                {user?.name || 'Food lover'}, your new Zaykaa homebase makes it easier to move
                between ordering, chef discovery, and private dining planning.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/order" className={buttonStyles({ variant: 'primary', size: 'lg' })}>
                  Order Food
                </Link>
                <Link to="/book-chef" className={buttonStyles({ variant: 'secondary', size: 'lg' })}>
                  Book Chef
                </Link>
              </div>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-3 lg:grid-cols-1 lg:p-8">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-[1.75rem] border border-white/60 bg-white/70 p-5 shadow-soft dark:border-white/10 dark:bg-white/5"
                >
                  <p className="text-sm text-slate-500 dark:text-slate-400">{metric.label}</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <section className="grid gap-5 lg:grid-cols-3">
          {quickActions.map((action, index) => (
            <motion.article
              key={action.title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.08 }}
              className="overflow-hidden rounded-[2rem] shadow-soft"
            >
              <div
                className={`h-full rounded-[2rem] bg-gradient-to-br ${action.accent} p-[1px]`}
              >
                <div
                  className={`h-full rounded-[calc(2rem-1px)] p-6 ${
                    action.inverse
                      ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                      : 'bg-white/80 text-slate-900 dark:bg-[#15151c]/90 dark:text-white'
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">
                    {action.label}
                  </p>
                  <h2 className="mt-4 font-display text-3xl">{action.title}</h2>
                  <p
                    className={`mt-4 text-sm leading-7 ${
                      action.inverse ? 'text-white/75 dark:text-slate-700' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {action.description}
                  </p>
                  <Link
                    to={action.to}
                    className={`mt-6 inline-flex items-center text-sm font-semibold ${
                      action.inverse ? 'text-white dark:text-slate-950' : 'text-brand'
                    }`}
                  >
                    Open experience
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </section>

        <Card hover={false}>
          <SectionHeader
            eyebrow="Food network"
            title="One live surface for dishes, chefs, creators, sellers, and operations"
            description="When a seller publishes a new dish or a chef creates a profile, food lovers can discover those updates here without switching across separate portals."
          />

          {feedPreviewMode && (
            <div className="mt-6 rounded-[1.5rem] border border-brand/20 bg-brand/10 px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
              Showing curated network previews while live cross-role discovery is unavailable.
            </div>
          )}

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.75rem] border border-white/60 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5">
              <p className="text-sm text-slate-500 dark:text-slate-400">Fresh dishes</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">
                {networkFeed.recipes.length}
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-white/60 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5">
              <p className="text-sm text-slate-500 dark:text-slate-400">Chef profiles</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">
                {networkFeed.chefs.length}
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-white/60 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5">
              <p className="text-sm text-slate-500 dark:text-slate-400">Other active roles</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">
                {networkFeed.members.length}
              </p>
            </div>
          </div>
        </Card>

        <Card hover={false}>
          <SectionHeader
            eyebrow="Fresh dishes"
            title="New dishes from chefs and sellers"
            description="Recent public dishes land here first, so food lovers can spot new seller listings and chef creations as soon as they go live."
            action={
              <Link to="/recipes" className={buttonStyles({ variant: 'secondary', size: 'sm' })}>
                Open Recipe Book
              </Link>
            }
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {feedLoading ? (
              Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={`recipe-skeleton-${index}`} />)
            ) : networkFeed.recipes.length > 0 ? (
              networkFeed.recipes.map((recipe) => <NetworkRecipeCard key={recipe.id} recipe={recipe} />)
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No public dishes are available yet.
              </p>
            )}
          </div>
        </Card>

        <Card hover={false}>
          <SectionHeader
            eyebrow="Chef discovery"
            title="Recent chef profiles visible to food lovers"
            description="Chef profiles created in the chef workspace feed into this discovery surface so booking can start from visibility, not manual promotion."
            action={
              <Link to="/book-chef" className={buttonStyles({ variant: 'secondary', size: 'sm' })}>
                Browse chefs
              </Link>
            }
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {feedLoading ? (
              Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={`chef-skeleton-${index}`} />)
            ) : networkFeed.chefs.length > 0 ? (
              networkFeed.chefs.map((chef) => <NetworkChefCard key={chef.id} chef={chef} />)
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No chef profiles are available yet.
              </p>
            )}
          </div>
        </Card>

        <Card hover={false}>
          <SectionHeader
            eyebrow="Platform roles"
            title="Creators, sellers, and delivery agents in one view"
            description="This directory makes the rest of the food ecosystem visible too, so the platform feels connected instead of role silos living in separate screens."
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            {feedLoading ? (
              Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={`member-skeleton-${index}`} />)
            ) : networkFeed.members.length > 0 ? (
              networkFeed.members.map((member) => (
                <NetworkMemberCard key={member.id} member={member} />
              ))
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No public community members are available yet.
              </p>
            )}
          </div>
        </Card>

        <Card hover={false}>
          <SectionHeader
            eyebrow="Recent orders"
            title="A quick snapshot of your latest meals"
            description="Card-based history keeps recent orders scannable without looking like a raw admin table."
            action={
              <Link to="/order" className={buttonStyles({ variant: 'secondary', size: 'sm' })}>
                Explore restaurants
              </Link>
            }
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ordersLoading
              ? Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={index} />)
              : recentOrders.map((order) => (
                  <Card key={order.id} className="p-5" hover={false}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">
                          {humanize(order.status || 'pending')}
                        </p>
                        <h3 className="mt-3 text-2xl text-slate-950 dark:text-white">
                          {order.restaurantName || 'Curated meal order'}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                          {formatDateTime(order.createdAt)}
                        </p>
                      </div>
                      <div className="rounded-full border border-white/60 bg-white/80 px-3 py-1 text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-white/10 dark:text-white">
                        {formatCurrency(order.totalAmount)}
                      </div>
                    </div>
                    <div className="mt-6 flex items-center justify-between rounded-[1.5rem] bg-slate-900/5 px-4 py-3 text-sm dark:bg-white/5">
                      <span className="text-slate-500 dark:text-slate-400">
                        {order.items?.length || 0} line items
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {previewMode ? 'Preview' : 'Live'}
                      </span>
                    </div>
                  </Card>
                ))}
          </div>

          {previewMode && !ordersLoading && (
            <div className="mt-6 rounded-[1.5rem] border border-brand/20 bg-brand/10 px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
              Showing curated sample orders for preview while live order history is unavailable.
            </div>
          )}
        </Card>
      </div>
    </PageTransition>
  );
};

export default Dashboard;
