import React, { useMemo, useState } from 'react';
import { chefService } from '../../services/chef';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, humanize } from '../../utils/display';

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
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {['all', 'pending', 'confirmed', 'completed'].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${
              filter === status
                ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                : 'border border-white/60 bg-white/80 text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200'
            }`}
          >
            {status === 'all' ? `All (${bookings.length})` : humanize(status)}
          </button>
        ))}
      </div>

      {previewMode && (
        <div className="rounded-[1.5rem] border border-brand/20 bg-brand/10 px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
          Showing sample bookings while live chef bookings are unavailable.
        </div>
      )}

      <Card hover={false} className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-900/5 dark:bg-white/5">
              <tr className="text-sm text-slate-500 dark:text-slate-400">
                <th className="px-6 py-4 font-medium">Guest</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Session</th>
                <th className="px-6 py-4 font-medium">Guests</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
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
                    className="border-t border-black/5 text-sm text-slate-700 dark:border-white/10 dark:text-slate-200"
                  >
                    <td className="px-6 py-5">
                      <div>
                        <p className="font-semibold text-slate-950 dark:text-white">{name}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {booking.menuPreferences || 'Custom menu discussion'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-5">{formatDate(booking.date)}</td>
                    <td className="px-6 py-5">{timeSlot}</td>
                    <td className="px-6 py-5">{guests}</td>
                    <td className="px-6 py-5 font-semibold text-slate-950 dark:text-white">
                      {formatCurrency(amount)}
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusTone[booking.status] || 'bg-slate-500/10 text-slate-700 dark:text-slate-200'}`}
                      >
                        {humanize(booking.status || 'pending')}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end gap-2">
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
                              Decline
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
