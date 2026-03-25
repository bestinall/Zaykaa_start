INSERT INTO bookings (
    booking_reference,
    user_id,
    user_name,
    user_email,
    user_phone,
    chef_id,
    chef_user_id,
    chef_name,
    booking_date,
    time_slot,
    slot_start_time,
    slot_end_time,
    guest_count,
    session_hours,
    menu_preferences,
    dietary_restrictions,
    special_requests,
    amount,
    currency,
    status
) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);

SELECT
    id,
    booking_reference,
    user_id,
    user_name,
    user_email,
    user_phone,
    chef_id,
    chef_user_id,
    chef_name,
    booking_date,
    time_slot,
    slot_start_time,
    slot_end_time,
    guest_count,
    session_hours,
    menu_preferences,
    dietary_restrictions,
    special_requests,
    amount,
    currency,
    status,
    cancellation_reason,
    cancelled_by_user_id,
    cancelled_by_role,
    created_at,
    updated_at
FROM bookings
WHERE id = %s
LIMIT 1;

SELECT
    id,
    booking_reference,
    user_id,
    user_name,
    chef_id,
    chef_name,
    booking_date,
    time_slot,
    guest_count,
    amount,
    status
FROM bookings
WHERE user_id = %s
ORDER BY booking_date DESC, created_at DESC;

SELECT
    id,
    booking_reference,
    user_name,
    chef_id,
    chef_name,
    booking_date,
    time_slot,
    guest_count,
    amount,
    status
FROM bookings
WHERE chef_id = %s
ORDER BY booking_date DESC, created_at DESC;

UPDATE bookings
SET
    status = %s,
    cancellation_reason = %s,
    cancelled_by_user_id = %s,
    cancelled_by_role = %s,
    updated_at = CURRENT_TIMESTAMP
WHERE id = %s;

INSERT INTO booking_status_history (
    booking_id,
    old_status,
    new_status,
    actor_user_id,
    actor_role,
    notes
) VALUES (%s, %s, %s, %s, %s, %s);

SELECT
    COUNT(*) AS total_active_bookings
FROM bookings
WHERE chef_id = %s
  AND booking_date = %s
  AND time_slot = %s
  AND status IN ('pending', 'confirmed');

SELECT
    booking_date,
    time_slot,
    COUNT(*) AS total_active_bookings
FROM bookings
WHERE chef_id = %s
  AND booking_date BETWEEN %s AND %s
  AND status IN ('pending', 'confirmed')
GROUP BY booking_date, time_slot;
