INSERT INTO chef_profiles (
    user_id,
    display_name,
    headline,
    bio,
    hourly_rate,
    experience_years,
    service_city,
    service_state,
    service_country,
    location_label,
    available_days_label,
    profile_image_url,
    cover_image_url,
    is_active,
    verification_status
) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);

SELECT
    cp.id,
    cp.user_id,
    cp.display_name,
    cp.headline,
    cp.bio,
    cp.hourly_rate,
    cp.experience_years,
    cp.service_city,
    cp.service_state,
    cp.service_country,
    cp.location_label,
    cp.available_days_label,
    cp.profile_image_url,
    cp.cover_image_url,
    cp.is_active,
    cp.verification_status,
    cp.created_at,
    cp.updated_at,
    COALESCE(crs.average_rating, 0) AS average_rating,
    COALESCE(crs.total_reviews, 0) AS total_reviews
FROM chef_profiles cp
LEFT JOIN chef_rating_summary crs ON crs.chef_id = cp.id
WHERE cp.user_id = %s
LIMIT 1;

UPDATE chef_profiles
SET
    display_name = %s,
    headline = %s,
    bio = %s,
    hourly_rate = %s,
    experience_years = %s,
    service_city = %s,
    service_state = %s,
    service_country = %s,
    location_label = %s,
    available_days_label = %s,
    profile_image_url = %s,
    cover_image_url = %s,
    is_active = %s,
    verification_status = %s,
    updated_at = CURRENT_TIMESTAMP
WHERE id = %s;

DELETE FROM chef_specialties
WHERE chef_id = %s;

INSERT INTO chef_specialties (chef_id, specialty_name, sort_order)
VALUES (%s, %s, %s);

SELECT
    chef_id,
    specialty_name,
    sort_order
FROM chef_specialties
WHERE chef_id IN (%s)
ORDER BY chef_id ASC, sort_order ASC;

DELETE FROM chef_availability_slots
WHERE chef_id = %s
  AND available_date IN (%s);

INSERT INTO chef_availability_slots (
    chef_id,
    available_date,
    slot_name,
    start_time,
    end_time,
    capacity,
    reserved_count,
    status,
    notes
) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);

SELECT
    id,
    chef_id,
    available_date,
    slot_name,
    start_time,
    end_time,
    capacity,
    reserved_count,
    status,
    notes,
    created_at,
    updated_at
FROM chef_availability_slots
WHERE chef_id = %s
  AND available_date BETWEEN %s AND %s
ORDER BY available_date ASC, start_time ASC, id ASC;

INSERT INTO chef_rating_events (
    chef_id,
    reviewer_user_id,
    rating_value,
    comment,
    source
) VALUES (%s, %s, %s, %s, %s);

SELECT
    COALESCE(ROUND(AVG(rating_value), 2), 0) AS average_rating,
    COUNT(*) AS total_reviews,
    SUM(CASE WHEN rating_value = 5 THEN 1 ELSE 0 END) AS five_star_count,
    SUM(CASE WHEN rating_value = 4 THEN 1 ELSE 0 END) AS four_star_count,
    SUM(CASE WHEN rating_value = 3 THEN 1 ELSE 0 END) AS three_star_count,
    SUM(CASE WHEN rating_value = 2 THEN 1 ELSE 0 END) AS two_star_count,
    SUM(CASE WHEN rating_value = 1 THEN 1 ELSE 0 END) AS one_star_count
FROM chef_rating_events
WHERE chef_id = %s;

INSERT INTO chef_rating_summary (
    chef_id,
    average_rating,
    total_reviews,
    five_star_count,
    four_star_count,
    three_star_count,
    two_star_count,
    one_star_count
) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
ON DUPLICATE KEY UPDATE
    average_rating = VALUES(average_rating),
    total_reviews = VALUES(total_reviews),
    five_star_count = VALUES(five_star_count),
    four_star_count = VALUES(four_star_count),
    three_star_count = VALUES(three_star_count),
    two_star_count = VALUES(two_star_count),
    one_star_count = VALUES(one_star_count),
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO recipes (
    chef_id,
    name,
    slug,
    category,
    description,
    cuisine,
    difficulty_level,
    preparation_time_minutes,
    preparation_time_label,
    cook_time_minutes,
    servings,
    calories,
    image_url,
    is_public
) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);

SELECT
    r.id,
    r.chef_id,
    r.name,
    r.slug,
    r.category,
    r.description,
    r.cuisine,
    r.difficulty_level,
    r.preparation_time_minutes,
    r.preparation_time_label,
    r.cook_time_minutes,
    r.servings,
    r.calories,
    r.image_url,
    r.is_public,
    r.views_count,
    r.created_at,
    r.updated_at
FROM recipes r
WHERE r.chef_id = %s
ORDER BY r.created_at DESC, r.id DESC;

UPDATE recipes
SET
    name = %s,
    slug = %s,
    category = %s,
    description = %s,
    cuisine = %s,
    difficulty_level = %s,
    preparation_time_minutes = %s,
    preparation_time_label = %s,
    cook_time_minutes = %s,
    servings = %s,
    calories = %s,
    image_url = %s,
    is_public = %s,
    updated_at = CURRENT_TIMESTAMP
WHERE id = %s
  AND chef_id = %s;

DELETE FROM recipes
WHERE id = %s
  AND chef_id = %s;

DELETE FROM recipe_ingredients
WHERE recipe_id = %s;

INSERT INTO recipe_ingredients (
    recipe_id,
    ingredient_name,
    quantity,
    unit,
    sort_order
) VALUES (%s, %s, %s, %s, %s);

DELETE FROM recipe_steps
WHERE recipe_id = %s;

INSERT INTO recipe_steps (
    recipe_id,
    step_number,
    instruction
) VALUES (%s, %s, %s);

SELECT
    recipe_id,
    ingredient_name,
    quantity,
    unit,
    sort_order
FROM recipe_ingredients
WHERE recipe_id IN (%s)
ORDER BY recipe_id ASC, sort_order ASC;

SELECT
    recipe_id,
    step_number,
    instruction
FROM recipe_steps
WHERE recipe_id IN (%s)
ORDER BY recipe_id ASC, step_number ASC;
