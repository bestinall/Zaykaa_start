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
        connection.commit()
        logger.info("database_bootstrap_completed db=%s", config.db_name)
    finally:
        connection.close()
