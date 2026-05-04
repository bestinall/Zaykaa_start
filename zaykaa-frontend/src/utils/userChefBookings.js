const STORAGE_KEY = 'zaykaa-user-chef-bookings';

const canUseStorage = () => typeof window !== 'undefined' && Boolean(window.localStorage);

const getBookingKey = (booking = {}) =>
  booking.bookingReference ||
  booking.reference ||
  booking.id ||
  [
    booking.chefId,
    booking.date,
    booking.timeSlot,
    booking.guestCount || booking.guests || booking.partySize,
  ]
    .filter(Boolean)
    .join('-');

const getBookingTimestamp = (booking = {}) =>
  Date.parse(booking.createdAt || booking.bookedAt || booking.updatedAt || booking.date || 0) || 0;

const dedupeChefBookings = (bookings = []) => {
  const bookingMap = new Map();

  bookings.forEach((booking) => {
    if (!booking) {
      return;
    }

    const bookingKey = getBookingKey(booking);
    if (!bookingKey) {
      return;
    }

    const existingBooking = bookingMap.get(bookingKey);

    if (!existingBooking || getBookingTimestamp(booking) >= getBookingTimestamp(existingBooking)) {
      bookingMap.set(bookingKey, { ...existingBooking, ...booking });
    }
  });

  return Array.from(bookingMap.values()).sort(
    (firstBooking, secondBooking) => getBookingTimestamp(secondBooking) - getBookingTimestamp(firstBooking)
  );
};

const readStorage = () => {
  if (!canUseStorage()) {
    return {};
  }

  try {
    const rawStorage = window.localStorage.getItem(STORAGE_KEY);
    const parsedStorage = rawStorage ? JSON.parse(rawStorage) : {};
    return parsedStorage && typeof parsedStorage === 'object' ? parsedStorage : {};
  } catch (error) {
    return {};
  }
};

export const getChefBookingStorageScope = (user) =>
  user?.id || user?._id || user?.email || user?.username || user?.name || 'guest';

export const getStoredChefBookings = (scope = 'guest') => {
  const storage = readStorage();
  const scopedBookings = storage[scope];
  return Array.isArray(scopedBookings) ? dedupeChefBookings(scopedBookings) : [];
};

export const saveStoredChefBooking = (scope = 'guest', booking) => {
  if (!canUseStorage() || !booking) {
    return;
  }

  try {
    const storage = readStorage();
    const currentBookings = Array.isArray(storage[scope]) ? storage[scope] : [];

    storage[scope] = dedupeChefBookings([
      {
        createdAt: booking.createdAt || booking.bookedAt || new Date().toISOString(),
        ...booking,
      },
      ...currentBookings,
    ]);

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  } catch (error) {
    // Ignore storage failures so booking flow keeps working.
  }
};

export const mergeChefBookings = (...bookingCollections) =>
  dedupeChefBookings(bookingCollections.flat().filter(Boolean));
