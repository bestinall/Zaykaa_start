from pathlib import Path

import mysql.connector

from src.utils.logger import get_logger


logger = get_logger("chef_service.bootstrap")


def _load_sql_statements(sql_path: Path):
    raw_sql = sql_path.read_text(encoding="utf-8")
    filtered_lines = []
    for line in raw_sql.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("--") or stripped.startswith("#"):
            continue
        filtered_lines.append(line)
    return [statement.strip() for statement in "\n".join(filtered_lines).split(";") if statement.strip()]


def _column_exists(cursor, schema_name, table_name, column_name):
    cursor.execute(
        """
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = %s
          AND table_name = %s
          AND column_name = %s
        LIMIT 1
        """,
        (schema_name, table_name, column_name),
    )
    return cursor.fetchone() is not None


def _index_exists(cursor, schema_name, table_name, index_name):
    cursor.execute(
        """
        SELECT 1
        FROM information_schema.statistics
        WHERE table_schema = %s
          AND table_name = %s
          AND index_name = %s
        LIMIT 1
        """,
        (schema_name, table_name, index_name),
    )
    return cursor.fetchone() is not None


def _run_recipe_migrations(cursor, schema_name):
    if not _column_exists(cursor, schema_name, "chef_profiles", "native_state"):
        cursor.execute(
            "ALTER TABLE chef_profiles ADD COLUMN native_state VARCHAR(80) NULL AFTER experience_years"
        )
    if not _column_exists(cursor, schema_name, "chef_profiles", "native_region"):
        cursor.execute(
            "ALTER TABLE chef_profiles ADD COLUMN native_region VARCHAR(120) NULL AFTER native_state"
        )

    cursor.execute("ALTER TABLE recipes MODIFY COLUMN chef_id BIGINT UNSIGNED NULL")

    if not _column_exists(cursor, schema_name, "recipes", "contributor_user_id"):
        cursor.execute("ALTER TABLE recipes ADD COLUMN contributor_user_id BIGINT NULL AFTER chef_id")
    if not _column_exists(cursor, schema_name, "recipes", "contributor_role"):
        cursor.execute("ALTER TABLE recipes ADD COLUMN contributor_role VARCHAR(30) NULL AFTER contributor_user_id")
    if not _column_exists(cursor, schema_name, "recipes", "contributor_name"):
        cursor.execute("ALTER TABLE recipes ADD COLUMN contributor_name VARCHAR(120) NULL AFTER contributor_role")
    if not _column_exists(cursor, schema_name, "recipes", "contributor_image_url"):
        cursor.execute("ALTER TABLE recipes ADD COLUMN contributor_image_url VARCHAR(500) NULL AFTER contributor_name")
    if not _column_exists(cursor, schema_name, "recipes", "price"):
        cursor.execute("ALTER TABLE recipes ADD COLUMN price DECIMAL(10, 2) NULL AFTER calories")
    if not _column_exists(cursor, schema_name, "recipes", "origin_state"):
        cursor.execute("ALTER TABLE recipes ADD COLUMN origin_state VARCHAR(80) NULL AFTER price")
    if not _column_exists(cursor, schema_name, "recipes", "origin_region"):
        cursor.execute("ALTER TABLE recipes ADD COLUMN origin_region VARCHAR(120) NULL AFTER origin_state")
    if not _column_exists(cursor, schema_name, "recipes", "is_authentic_regional"):
        cursor.execute(
            "ALTER TABLE recipes ADD COLUMN is_authentic_regional TINYINT(1) NOT NULL DEFAULT 1 AFTER origin_region"
        )

    cursor.execute(
        """
        UPDATE recipes r
        LEFT JOIN chef_profiles cp ON cp.id = r.chef_id
        SET
            r.contributor_user_id = COALESCE(r.contributor_user_id, cp.user_id),
            r.contributor_role = COALESCE(NULLIF(r.contributor_role, ''), 'chef'),
            r.contributor_name = COALESCE(NULLIF(r.contributor_name, ''), cp.display_name),
            r.contributor_image_url = COALESCE(r.contributor_image_url, cp.profile_image_url),
            r.origin_state = COALESCE(r.origin_state, cp.native_state),
            r.origin_region = COALESCE(r.origin_region, cp.native_region),
            r.is_authentic_regional = COALESCE(r.is_authentic_regional, 1)
        WHERE r.contributor_user_id IS NULL
           OR r.contributor_role IS NULL
           OR r.contributor_role = ''
           OR r.contributor_name IS NULL
           OR r.contributor_name = ''
           OR r.origin_state IS NULL
        """
    )
    cursor.execute(
        """
        UPDATE recipes
        SET contributor_name = CONCAT('Recipe Author ', id)
        WHERE contributor_name IS NULL OR contributor_name = ''
        """
    )

    if not _index_exists(cursor, schema_name, "recipes", "uq_recipe_slug_contributor"):
        cursor.execute(
            """
            ALTER TABLE recipes
            ADD UNIQUE KEY uq_recipe_slug_contributor (contributor_user_id, slug)
            """
        )
    if not _index_exists(cursor, schema_name, "recipes", "idx_recipes_contributor_created"):
        cursor.execute(
            """
            ALTER TABLE recipes
            ADD KEY idx_recipes_contributor_created (contributor_user_id, created_at)
            """
        )


def bootstrap_database(config):
    connection = mysql.connector.connect(
        host=config.db_host,
        port=config.db_port,
        user=config.db_user,
        password=config.db_password,
    )
    try:
        cursor = connection.cursor()
        schema_path = Path(__file__).with_name("schema.sql")
        for statement in _load_sql_statements(schema_path):
            cursor.execute(statement)
        _run_recipe_migrations(cursor, config.db_name)
        connection.commit()
        logger.info("database_bootstrap_completed db=%s", config.db_name)
    finally:
        connection.close()
