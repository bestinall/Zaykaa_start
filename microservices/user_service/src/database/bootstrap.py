from pathlib import Path

import mysql.connector

from src.utils.logger import get_logger


logger = get_logger("user_service.bootstrap")


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


def _run_post_schema_migrations(cursor):
    cursor.execute(
        """
        ALTER TABLE users
        MODIFY COLUMN role ENUM('user', 'chef', 'seller', 'agent', 'vlogger', 'admin')
        NOT NULL DEFAULT 'user'
        """
    )


def _run_profile_migrations(cursor, schema_name):
    if not _column_exists(cursor, schema_name, "users", "native_state"):
        cursor.execute("ALTER TABLE users ADD COLUMN native_state VARCHAR(80) NULL AFTER role")
    if not _column_exists(cursor, schema_name, "users", "native_region"):
        cursor.execute("ALTER TABLE users ADD COLUMN native_region VARCHAR(120) NULL AFTER native_state")


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
        _run_post_schema_migrations(cursor)
        _run_profile_migrations(cursor, config.db_name)
        connection.commit()
        logger.info("database_bootstrap_completed db=%s", config.db_name)
    finally:
        connection.close()
