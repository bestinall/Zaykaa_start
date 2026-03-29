import React, { useEffect, useState } from 'react';
import { bookingService } from '../../services/booking';
import Card from '../ui/Card';
import Button from '../ui/Button';
import FloatingInput from '../ui/FloatingInput';
import SmartImage from '../ui/SmartImage';
import Skeleton from '../ui/Skeleton';
import { formatCurrency } from '../../utils/display';

const timeSlots = [
  { value: 'breakfast', label: 'Breakfast', meta: '7 AM - 10 AM' },
  { value: 'lunch', label: 'Lunch', meta: '12 PM - 2 PM' },
  { value: 'dinner', label: 'Dinner', meta: '6 PM - 9 PM' },
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

  return (
    <div className="space-y-6">
      <Card hover={false} className="overflow-hidden p-0">
        <div className="grid gap-0 md:grid-cols-[260px_1fr]">
          <div className="h-full min-h-[260px]">
            <SmartImage src={chef.image} alt={chef.name} fallbackText={chef.name} className="h-full w-full" />
          </div>
          <div className="bg-hero-wash p-6 dark:bg-hero-wash-dark sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Selected chef</p>
            <h3 className="mt-4 font-display text-4xl text-slate-950 dark:text-white">{chef.name}</h3>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {chef.bio || 'Premium private dining specialist'}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {[chef.cuisine, ...(chef.specialties || [])].filter(Boolean).slice(0, 4).map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/60 bg-white/80 px-3 py-1.5 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.4rem] border border-white/60 bg-white/75 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Starting at
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                  {formatCurrency(chef.hourlyRate)}/hr
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-white/60 bg-white/75 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Rating
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                  {Number(chef.rating || 0).toFixed(1)}
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-white/60 bg-white/75 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Availability
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">
                  {chef.availabilityText || 'Available on request'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <Card hover={false} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="date"
              name="date"
              value={bookingData.date}
              min={new Date().toISOString().split('T')[0]}
              onChange={handleChange}
              required
              className="rounded-[1.5rem] border border-white/60 bg-white/80 px-4 py-4 text-sm text-slate-900 shadow-soft outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
            <input
              type="number"
              name="guestCount"
              value={bookingData.guestCount}
              min="1"
              max="24"
              onChange={handleChange}
              required
              className="rounded-[1.5rem] border border-white/60 bg-white/80 px-4 py-4 text-sm text-slate-900 shadow-soft outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
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
                className={`rounded-[1.5rem] border p-4 text-left transition ${
                  bookingData.timeSlot === slot.value
                    ? 'border-brand/60 bg-brand/10 shadow-glow dark:bg-brand/10'
                    : 'border-white/60 bg-white/70 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'
                }`}
              >
                <p className="font-semibold text-slate-900 dark:text-white">{slot.label}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{slot.meta}</p>
              </button>
            ))}
          </div>

          <FloatingInput
            label="Menu preferences"
            name="menuPreferences"
            value={bookingData.menuPreferences}
            onChange={handleChange}
          />
          <div className="grid gap-4 sm:grid-cols-2">
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
            <div className="rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100">
              {error}
            </div>
          )}
        </Card>

        <Card hover={false} className="h-fit space-y-5 xl:sticky xl:top-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Session summary</p>
            <h4 className="mt-3 font-display text-3xl text-slate-950 dark:text-white">Booking estimate</h4>
          </div>

          <div className="rounded-[1.6rem] bg-slate-900/5 p-5 dark:bg-white/5">
            <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>Chef base</span>
              <span>{formatCurrency(chef.hourlyRate)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>Estimated 3-hour session</span>
              <span>{formatCurrency(Number(chef.hourlyRate || 0) * 3)}</span>
            </div>
            <div className="mt-4 border-t border-black/5 pt-4 text-lg font-semibold text-slate-950 dark:border-white/10 dark:text-white">
              Approximate total: {formatCurrency(Number(chef.hourlyRate || 0) * 3)}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Availability</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {availabilityLoading ? (
                <>
                  <Skeleton className="h-9 w-20 rounded-full" />
                  <Skeleton className="h-9 w-24 rounded-full" />
                  <Skeleton className="h-9 w-16 rounded-full" />
                </>
              ) : availability.length > 0 ? (
                availability.slice(0, 5).map((slot, index) => (
                  <span
                    key={`${slot.date || slot.day || 'slot'}-${index}`}
                    className="rounded-full border border-white/60 bg-white/80 px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                  >
                    {slot.date || slot.day || slot.label || `Slot ${index + 1}`}
                  </span>
                ))
              ) : (
                <span className="rounded-full border border-white/60 bg-white/80 px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                  Live confirmation on request
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button type="submit" block size="lg" disabled={loading}>
              {loading ? 'Securing booking...' : 'Confirm booking'}
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
