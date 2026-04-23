import React, { useMemo, useState } from 'react';
import { chefService } from '../../services/chef';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, humanize } from '../../utils/display';

const Icon = ({ path, className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {path}
  </svg>
);

const icons = {
  filter: <><polygon points="22 3 2 3 7 10 10 12 46 22 3" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  x: <path d="M18 6 6 18" />,
};

const timeSlotLabel = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

const statusTone = {
  pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-200',
  confirmed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-200',
  completed: 'bg-sky-500/10 text-sky-700 dark:text-sky-200',
  cancelled: 'bg-rose-500/10 text-rose-700 dark:text-rose-200',
};

const getBookingValue = (booking, key, fallback = '') =>
  booking[key] ??
  booking[`${key}Label`] ??
  booking[`${key}_label`] ??
  booking[`${key}Name`] ??
  fallback;

const BookingsList = ({ bookings, onRefresh, previewMode }) => {
  const toast = useToast();
  const [filter, setFilter] = useState('all');
  const [loadingId, setLoadingId] = useState(null);

  const filteredBookings = useMemo(
    () => (filter === 'all' ? bookings : bookings.filter((booking) => booking.status === filter)),
    [bookings, filter]
  );

  const handleStatusUpdate = async (bookingId, newStatus) => {
    setLoadingId(bookingId);

    try {
      await chefService.updateBookingStatus(bookingId, newStatus);
      toast.success('Booking updated', `Booking marked as ${humanize(newStatus)}.`);
      onRefresh();
    } catch (error) {
      toast.error('Update failed', 'Unable to update booking status.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'confirmed', 'completed'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                filter === status
                  ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                  : 'border border-white/60 bg-white/80 text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200'
              }`}
            >
              {status === 'all' ? `All (${bookings.length})` : humanize(status)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Icon path={icons.filter} className="h-3.5 w-3.5" />
          {filteredBookings.length} bookings
        </div>
      </div>

      {previewMode && (
        <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand">
          Sample bookings
        </div>
      )}

      <Card hover={false} className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-900/5 dark:bg-white/5">
              <tr className="text-[10px] text-slate-500 dark:text-slate-400">
                <th className="px-3 py-2 font-medium">Guest</th>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Time</th>
                <th className="px-3 py-2 font-medium">Guests</th>
                <th className="px-3 py-2 font-medium">Amount</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => {
                const bookingId = booking.id || booking.bookingId;
                const name =
                  booking.userName || booking.customerName || booking.user?.name || 'Guest';
                const amount =
                  booking.amount || booking.totalAmount || booking.price || booking.earnings || 0;
                const guests = booking.guestCount || booking.guests || booking.partySize || 0;
                const timeSlot = timeSlotLabel[booking.timeSlot] || humanize(getBookingValue(booking, 'timeSlot', 'Dinner'));

                return (
                  <tr
                    key={bookingId}
                    className="border-t border-black/5 text-xs text-slate-700 dark:border-white/10 dark:text-slate-200"
                  >
                    <td className="px-3 py-3">
                      <p className="font-medium text-slate-950 dark:text-white truncate max-w-[120px]">{name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {booking.menuPreferences || 'Custom menu'}
                      </p>
                    </td>
                    <td className="px-3 py-3">{formatDate(booking.date)}</td>
                    <td className="px-3 py-3">{timeSlot}</td>
                    <td className="px-3 py-3">{guests}</td>
                    <td className="px-3 py-3 font-medium text-slate-950 dark:text-white">
                      {formatCurrency(amount)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusTone[booking.status] || 'bg-slate-500/10 text-slate-700 dark:text-slate-200'}`}
                      >
                        {humanize(booking.status || 'pending')}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1">
                        {booking.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(bookingId, 'confirmed')}
                              disabled={loadingId === bookingId}
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleStatusUpdate(bookingId, 'cancelled')}
                              disabled={loadingId === bookingId}
                            >
                              <Icon path={icons.x} className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(bookingId, 'completed')}
                            disabled={loadingId === bookingId}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default BookingsList;
