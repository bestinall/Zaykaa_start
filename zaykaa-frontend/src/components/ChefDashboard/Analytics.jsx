import React from 'react';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import BarChart from '../charts/BarChart';
import LineChart from '../charts/LineChart';
import { previewAnalytics } from '../../data/mockData';
import { formatCurrency } from '../../utils/display';

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
    { label: 'Total bookings', value: analytics.totalBookings },
    { label: 'Completed', value: analytics.completedBookings },
    { label: 'Upcoming', value: analytics.upcomingBookings },
    { label: 'Average rating', value: `${analytics.averageRating} / 5` },
    { label: 'Revenue', value: formatCurrency(analytics.totalEarnings), highlight: true },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Analytics"
        title="Performance is now visual, not buried in plain text"
        description="Track bookings, revenue, ratings, and momentum in a dashboard that feels closer to a premium operating console."
      />

      {previewMode && (
        <div className="rounded-[1.5rem] border border-brand/20 bg-brand/10 px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
          Showing sample analytics while the live chef analytics feed is unavailable.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {statCards.map((card) => (
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

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card hover={false} className="space-y-5">
          <SectionHeader
            eyebrow="Revenue trend"
            title="Monthly performance"
            description={`Average booking value is ${formatCurrency(averageBookingValue)} with a ${successRate}% completion rate.`}
          />
          <LineChart data={analytics.monthlyRevenue} />
        </Card>

        <Card hover={false} className="space-y-5">
          <SectionHeader
            eyebrow="Booking pulse"
            title="Weekly demand"
            description="A quick read on how your booking flow is trending over recent weeks."
          />
          <BarChart data={analytics.bookingTrend} />
        </Card>
      </div>

      <Card hover={false} className="space-y-5">
        <SectionHeader
          eyebrow="Cuisine mix"
          title="What guests are booking most often"
          description="Understand which culinary directions are driving requests and repeat bookings."
        />
        <BarChart data={analytics.cuisineMix} valueFormatter={(value) => `${value}%`} />
      </Card>
    </div>
  );
};

export default Analytics;
