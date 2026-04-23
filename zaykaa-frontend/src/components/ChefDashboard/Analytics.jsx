import React from 'react';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import BarChart from '../charts/BarChart';
import LineChart from '../charts/LineChart';
import { previewAnalytics } from '../../data/mockData';
import { formatCurrency } from '../../utils/display';

const Icon = ({ path, className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {path}
  </svg>
);

const icons = {
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  star: <path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.8L6.6 19.7l1-6L3.2 9.4l6.1-.9L12 3z" />,
  rupee: <><path d="M6 3v18" /><path d="M18 13h-5" /><path d="M18 17h-5" /><circle cx="12" cy="12" r="10" /></>,
};

const Analytics = ({ data, previewMode }) => {
  const analytics = {
    ...previewAnalytics,
    ...data,
    monthlyRevenue: data?.monthlyRevenue?.length ? data.monthlyRevenue : previewAnalytics.monthlyRevenue,
    bookingTrend: data?.bookingTrend?.length ? data.bookingTrend : previewAnalytics.bookingTrend,
    cuisineMix: data?.cuisineMix?.length ? data.cuisineMix : previewAnalytics.cuisineMix,
  };

  const averageBookingValue = analytics.totalBookings
    ? Math.round(analytics.totalEarnings / analytics.totalBookings)
    : 0;
  const successRate = analytics.totalBookings
    ? Math.round((analytics.completedBookings / analytics.totalBookings) * 100)
    : 0;

  const statCards = [
    { label: 'Total bookings', value: String(analytics.totalBookings), icon: icons.calendar },
    { label: 'Completed', value: String(analytics.completedBookings), icon: icons.check },
    { label: 'Upcoming', value: String(analytics.upcomingBookings), icon: icons.clock },
    { label: 'Rating', value: analytics.averageRating, icon: icons.star },
    { label: 'Revenue', value: formatCurrency(analytics.totalEarnings), icon: icons.rupee, highlight: true },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader
        eyebrow="Analytics"
        title="Performance metrics"
        description="Track your bookings, revenue, and ratings"
      />

      {previewMode && (
        <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand">
          <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current">
            <path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.8L6.6 19.7l1-6L3.2 9.4l6.1-.9L12 3z" />
          </svg>
          Sample analytics
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`flex items-center gap-2 rounded-xl border p-3 ${card.highlight ? 'border-brand/30 bg-brand/10' : 'border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/5'}`}
          >
            <span className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 ${card.highlight ? 'bg-brand text-white' : 'bg-slate-900/5 text-slate-500 dark:bg-white/10'}`}>
              <Icon path={card.icon} className="h-3 w-3" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                {card.label}
              </p>
              <p className={`text-sm font-semibold truncate ${card.highlight ? 'text-brand' : 'text-slate-950 dark:text-white'}`}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card hover={false} className="space-y-3">
          <SectionHeader
            eyebrow="Revenue"
            title="Monthly trend"
            description={`Avg: ${formatCurrency(averageBookingValue)} • ${successRate}% completion`}
          />
          <LineChart data={analytics.monthlyRevenue} />
        </Card>

        <Card hover={false} className="space-y-3">
          <SectionHeader
            eyebrow="Demand"
            title="Weekly bookings"
            description="Your booking flow trend"
          />
          <BarChart data={analytics.bookingTrend} />
        </Card>
      </div>

      <Card hover={false} className="space-y-3">
        <SectionHeader
          eyebrow="Cuisines"
          title="Popular categories"
          description="What guests book most often"
        />
        <BarChart data={analytics.cuisineMix} valueFormatter={(value) => `${value}%`} />
      </Card>
    </div>
  );
};

export default Analytics;
