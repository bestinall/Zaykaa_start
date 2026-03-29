import mysql.connector.pooling


class DatabasePoolManager:
    _pool = None

    @classmethod
    def initialize(cls, config):
        if cls._pool is None:
            cls._pool = mysql.connector.pooling.MySQLConnectionPool(
                pool_name=config.mysql_pool_name,
                pool_size=config.mysql_pool_size,
                host=config.db_host,
                port=config.db_port,
                user=config.db_user,
                password=config.db_password,
                database=config.db_name,
                charset="utf8mb4",
                use_unicode=True,
            )

    @classmethod
    def get_connection(cls):
        if cls._pool is None:
            raise RuntimeError("Database connection pool has not been initialized")
        connection = cls._pool.get_connection()
        connection.autocommit = False
        return connection
