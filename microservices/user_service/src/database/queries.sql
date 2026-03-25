INSERT INTO users (
    full_name,
    email,
    password_hash,
    phone,
    role,
    date_of_birth,
    gender,
    height_cm,
    weight_kg,
    activity_level
) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);

SELECT
    id,
    full_name,
    email,
    password_hash,
    phone,
    role,
    date_of_birth,
    gender,
    height_cm,
    weight_kg,
    activity_level,
    created_at,
    updated_at,
    last_login_at
FROM users
WHERE email = %s
LIMIT 1;

SELECT
    id,
    full_name,
    email,
    phone,
    role,
    date_of_birth,
    gender,
    height_cm,
    weight_kg,
    activity_level,
    created_at,
    updated_at,
    last_login_at
FROM users
WHERE id = %s
LIMIT 1;

UPDATE users
SET last_login_at = CURRENT_TIMESTAMP
WHERE id = %s;

INSERT INTO user_preferences (
    user_id,
    calorie_target,
    protein_target_g,
    carbs_target_g,
    fats_target_g,
    spice_level,
    budget_preference,
    meal_complexity
) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
ON DUPLICATE KEY UPDATE
    calorie_target = VALUES(calorie_target),
    protein_target_g = VALUES(protein_target_g),
    carbs_target_g = VALUES(carbs_target_g),
    fats_target_g = VALUES(fats_target_g),
    spice_level = VALUES(spice_level),
    budget_preference = VALUES(budget_preference),
    meal_complexity = VALUES(meal_complexity),
    updated_at = CURRENT_TIMESTAMP;

SELECT
    user_id,
    calorie_target,
    protein_target_g,
    carbs_target_g,
    fats_target_g,
    spice_level,
    budget_preference,
    meal_complexity,
    created_at,
    updated_at
FROM user_preferences
WHERE user_id = %s;

DELETE FROM user_preference_tags
WHERE user_id = %s;

INSERT INTO user_preference_tags (user_id, tag_type, tag_value)
VALUES (%s, %s, %s);

SELECT
    tag_type,
    tag_value
FROM user_preference_tags
WHERE user_id = %s
ORDER BY tag_type, tag_value;

INSERT INTO meal_plans (
    user_id,
    title,
    goal,
    start_date,
    end_date,
    status,
    notes
) VALUES (%s, %s, %s, %s, %s, %s, %s);

INSERT INTO meal_plan_items (
    meal_plan_id,
    meal_date,
    meal_type,
    item_name,
    description,
    calories,
    protein_g,
    carbs_g,
    fats_g,
    scheduled_time,
    sort_order
) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);

SELECT
    id,
    user_id,
    title,
    goal,
    start_date,
    end_date,
    status,
    notes,
    created_at,
    updated_at
FROM meal_plans
WHERE user_id = %s
ORDER BY start_date DESC, id DESC;

SELECT
    id,
    user_id,
    title,
    goal,
    start_date,
    end_date,
    status,
    notes,
    created_at,
    updated_at
FROM meal_plans
WHERE id = %s AND user_id = %s
LIMIT 1;

SELECT
    id,
    meal_plan_id,
    meal_date,
    meal_type,
    item_name,
    description,
    calories,
    protein_g,
    carbs_g,
    fats_g,
    scheduled_time,
    sort_order
FROM meal_plan_items
WHERE meal_plan_id = %s
ORDER BY meal_date ASC, meal_type ASC, sort_order ASC;

UPDATE meal_plans
SET
    title = %s,
    goal = %s,
    start_date = %s,
    end_date = %s,
    status = %s,
    notes = %s,
    updated_at = CURRENT_TIMESTAMP
WHERE id = %s AND user_id = %s;

DELETE FROM meal_plan_items
WHERE meal_plan_id = %s;

DELETE FROM meal_plans
WHERE id = %s AND user_id = %s;

INSERT INTO nutrition_logs (
    user_id,
    logged_on,
    meal_type,
    food_name,
    serving_size,
    calories,
    protein_g,
    carbs_g,
    fats_g,
    fiber_g,
    water_ml,
    notes
) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);

SELECT
    id,
    user_id,
    logged_on,
    meal_type,
    food_name,
    serving_size,
    calories,
    protein_g,
    carbs_g,
    fats_g,
    fiber_g,
    water_ml,
    notes,
    created_at,
    updated_at
FROM nutrition_logs
WHERE user_id = %s
  AND logged_on BETWEEN %s AND %s
ORDER BY logged_on DESC, created_at DESC;

SELECT
    id,
    user_id,
    logged_on,
    meal_type,
    food_name,
    serving_size,
    calories,
    protein_g,
    carbs_g,
    fats_g,
    fiber_g,
    water_ml,
    notes,
    created_at,
    updated_at
FROM nutrition_logs
WHERE id = %s AND user_id = %s
LIMIT 1;

UPDATE nutrition_logs
SET
    logged_on = %s,
    meal_type = %s,
    food_name = %s,
    serving_size = %s,
    calories = %s,
    protein_g = %s,
    carbs_g = %s,
    fats_g = %s,
    fiber_g = %s,
    water_ml = %s,
    notes = %s,
    updated_at = CURRENT_TIMESTAMP
WHERE id = %s AND user_id = %s;

DELETE FROM nutrition_logs
WHERE id = %s AND user_id = %s;

SELECT
    COALESCE(SUM(calories), 0) AS total_calories,
    COALESCE(SUM(protein_g), 0) AS total_protein_g,
    COALESCE(SUM(carbs_g), 0) AS total_carbs_g,
    COALESCE(SUM(fats_g), 0) AS total_fats_g,
    COALESCE(SUM(fiber_g), 0) AS total_fiber_g,
    COALESCE(SUM(water_ml), 0) AS total_water_ml,
    COUNT(*) AS total_entries
FROM nutrition_logs
WHERE user_id = %s
  AND logged_on BETWEEN %s AND %s;

SELECT
    logged_on,
    COALESCE(SUM(calories), 0) AS total_calories,
    COALESCE(SUM(protein_g), 0) AS total_protein_g,
    COALESCE(SUM(carbs_g), 0) AS total_carbs_g,
    COALESCE(SUM(fats_g), 0) AS total_fats_g,
    COALESCE(SUM(fiber_g), 0) AS total_fiber_g,
    COALESCE(SUM(water_ml), 0) AS total_water_ml
FROM nutrition_logs
WHERE user_id = %s
  AND logged_on BETWEEN %s AND %s
GROUP BY logged_on
ORDER BY logged_on ASC;
