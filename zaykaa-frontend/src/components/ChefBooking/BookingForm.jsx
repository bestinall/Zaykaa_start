import React, { useEffect, useState } from 'react';
import { bookingService } from '../../services/booking';
import Card from '../ui/Card';
import Button from '../ui/Button';
import FloatingInput from '../ui/FloatingInput';
import SmartImage from '../ui/SmartImage';
import Skeleton from '../ui/Skeleton';
import { formatCurrency } from '../../utils/display';

const Icon = ({ path, className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {path}
  </svg>
);

const icons = {
  star: <path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.8L6.6 19.7l1-6L3.2 9.4l6.1-.9L12 3z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  utensils: <><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" /></>,
};

const timeSlots = [
  { value: 'breakfast', label: 'Breakfast', meta: '7-10 AM' },
  { value: 'lunch', label: 'Lunch', meta: '12-2 PM' },
  { value: 'dinner', label: 'Dinner', meta: '6-9 PM' },
];

const BookingForm = ({ chef, onBookingSuccess, onCancel }) => {
  const [bookingData, setBookingData] = useState({
    date: '',
    timeSlot: 'dinner',
    guestCount: 4,
    menuPreferences: '',
    dietaryRestrictions: '',
    specialRequests: '',
  });
  const [availability, setAvailability] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const fetchAvailability = async () => {
      setAvailabilityLoading(true);

      try {
        const response = await bookingService.getChefAvailability(chef.id);
        if (active) {
          setAvailability(response.availability || []);
        }
      } catch (err) {
        if (active) {
          setAvailability([]);
        }
      } finally {
        if (active) {
          setAvailabilityLoading(false);
        }
      }
    };

    fetchAvailability();

    return () => {
      active = false;
    };
  }, [chef.id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setBookingData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await bookingService.createBooking({
        chefId: chef.id,
        ...bookingData,
        guestCount: Number(bookingData.guestCount),
      });
      onBookingSuccess(response.booking);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  const baseRate = Number(chef.hourlyRate || 0);
  const estimatedHours = 3;
  const estimatedTotal = baseRate * estimatedHours;

  return (
    <div className="space-y-4">
      <Card hover={false} className="overflow-hidden p-0">
        <div className="grid gap-0 sm:grid-cols-[180px_1fr]">
          <div className="h-full min-h-[140px]">
            <SmartImage src={chef.image} alt={chef.name} fallbackText={chef.name} className="h-full w-full" />
          </div>
          <div className="bg-hero-wash p-4 dark:bg-hero-wash-dark sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand">Selected chef</p>
            <h3 className="mt-2 font-display text-lg text-slate-950 dark:text-white line-clamp-1">{chef.name}</h3>
            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300 line-clamp-2">
              {chef.bio || 'Premium private dining specialist'}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[chef.cuisine, ...(chef.specialties || [])].filter(Boolean).slice(0, 3).map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/60 bg-white/80 px-2 py-0.5 text-[10px] text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg bg-slate-900/5 px-2 py-1.5 dark:bg-white/5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  From
                </p>
                <p className="mt-0.5 text-sm font-semibold text-slate-950 dark:text-white">
                  {formatCurrency(chef.hourlyRate)}/hr
                </p>
              </div>
              <div className="rounded-lg bg-slate-900/5 px-2 py-1.5 dark:bg-white/5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Rating
                </p>
                <p className="mt-0.5 text-sm font-semibold text-slate-950 dark:text-white">
                  {Number(chef.rating || 0).toFixed(1)}
                </p>
              </div>
              <div className="rounded-lg bg-slate-900/5 px-2 py-1.5 dark:bg-white/5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Available
                </p>
                <p className="mt-0.5 text-[10px] font-semibold text-slate-950 dark:text-white line-clamp-1">
                  {chef.availabilityText || 'On request'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-[1fr_240px]">
        <Card hover={false} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="date"
              name="date"
              value={bookingData.date}
              min={new Date().toISOString().split('T')[0]}
              onChange={handleChange}
              required
              className="rounded-[1.2rem] border border-white/60 bg-white/80 px-3 py-2.5 text-sm text-slate-900 shadow-soft outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
            <input
              type="number"
              name="guestCount"
              value={bookingData.guestCount}
              min="1"
              max="24"
              onChange={handleChange}
              required
              className="rounded-[1.2rem] border border-white/60 bg-white/80 px-3 py-2.5 text-sm text-slate-900 shadow-soft outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {timeSlots.map((slot) => (
              <button
                key={slot.value}
                type="button"
                onClick={() =>
                  setBookingData((currentData) => ({
                    ...currentData,
                    timeSlot: slot.value,
                  }))
                }
                className={`rounded-xl border p-3 text-left transition ${
                  bookingData.timeSlot === slot.value
                    ? 'border-brand/60 bg-brand/10 dark:bg-brand/10'
                    : 'border-white/60 bg-white/70 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'
                }`}
              >
                <p className="text-xs font-semibold text-slate-900 dark:text-white">{slot.label}</p>
                <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{slot.meta}</p>
              </button>
            ))}
          </div>

          <FloatingInput
            label="Menu preferences"
            name="menuPreferences"
            value={bookingData.menuPreferences}
            onChange={handleChange}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <FloatingInput
              label="Dietary restrictions"
              name="dietaryRestrictions"
              as="textarea"
              value={bookingData.dietaryRestrictions}
              onChange={handleChange}
            />
            <FloatingInput
              label="Special requests"
              name="specialRequests"
              as="textarea"
              value={bookingData.specialRequests}
              onChange={handleChange}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100">
              {error}
            </div>
          )}
        </Card>

        <Card hover={false} className="h-fit space-y-4 sm:sticky sm:top-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand">Summary</p>
            <h4 className="mt-2 font-display text-base text-slate-950 dark:text-white">Booking estimate</h4>
          </div>

          <div className="rounded-xl bg-slate-900/5 p-4 dark:bg-white/5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Base rate</span>
              <span>{formatCurrency(baseRate)}/hr</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Session (~{estimatedHours}hrs)</span>
              <span>{formatCurrency(baseRate * estimatedHours)}</span>
            </div>
            <div className="mt-3 border-t border-black/5 pt-3 text-sm font-semibold text-slate-950 dark:border-white/10 dark:text-white">
              Total: {formatCurrency(estimatedTotal)}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-200">Availability</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {availabilityLoading ? (
                <>
                  <Skeleton className="h-7 w-16 rounded-full" />
                  <Skeleton className="h-7 w-20 rounded-full" />
                  <Skeleton className="h-7 w-14 rounded-full" />
                </>
              ) : availability.length > 0 ? (
                availability.slice(0, 5).map((slot, index) => (
                  <span
                    key={`${slot.date || slot.day || 'slot'}-${index}`}
                    className="rounded-full border border-white/60 bg-white/80 px-2 py-1 text-[10px] text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                  >
                    {slot.date || slot.day || slot.label || `Slot ${index + 1}`}
                  </span>
                ))
              ) : (
                <span className="rounded-full border border-white/60 bg-white/80 px-2 py-1 text-[10px] text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                  Confirm on request
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button type="submit" block size="lg" disabled={loading}>
              {loading ? 'Booking...' : 'Confirm booking'}
            </Button>
            <Button type="button" variant="secondary" block onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default BookingForm;
