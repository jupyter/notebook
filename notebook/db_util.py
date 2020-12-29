import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from psycopg2 import ProgrammingError
import psycopg2.extras
from psycopg2.extras import NamedTupleCursor

class PostgresUtils:
    """
    Collection of all Postgres utility functions
    """

    def __init__(self, db_name=None, db_config=None):
        """
        Args:
            db_name: Name of database (Str) (overwrites value in db_config if present)
            db_config: Dict containing postgres server configuration
                        {'NAME': <db_name>,
                         'HOST': <host_name>,
                         'USER': <user>,
                         'PASSWORD': <pass>,
                         'PORT': <port>
                        }
        """
        #TODO: Remove the hardcoded value from here. Use env vars.
        self.db_config = {
            'NAME': 'contexalyze',
            'USER': 'postgres',
            'PASSWORD': 'password',
            'HOST': 'postgres',
            'PORT': '5432'
        }
        self.conn = self.__create_new_conn__()

    def __create_new_conn__(self):
        """
        Method to connect with Postgres server
        :return: psycopg connection object with the database.
        """
        try:
            conn = psycopg2.connect(dbname=self.db_config['NAME'],
                                    user=self.db_config['USER'],
                                    host=self.db_config['HOST'],
                                    port=self.db_config['PORT'],
                                    password=self.db_config['PASSWORD'])

            conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            return conn
        except psycopg2.ProgrammingError as e:
            raise RuntimeError(
                    f'Error creating connection to PostgreSQL, {e})')

    def __get_connection__(self):
        "Return connection if active else create new"
        return self.__create_new_conn__() if self.conn.closed else self.conn

    def __execute_query__(self, conn, query, fetch_after=True):
        """
        Execute given query & return result
        Args:
            conn: Postgres connection client
            query: Query to execute
            fetch_after: Execute fetchall after executing query
        Return:
            Result array
        """
        try:
            cur = conn.cursor(cursor_factory=NamedTupleCursor)
            cur.execute(query)
            result = None
            if fetch_after:
                result = cur.fetchall() if cur.rowcount > 0 else []
            cur.close()
            return result
        except ProgrammingError as e:
            raise RuntimeError('Error excuting query "%s"\n %s' % (query, e))

    def get_users(self):
        """
        #TODO: Remove the method if not required, this is dummy method to test the and list the connections.
        """

        self.conn = self.__get_connection__()
        result = self.__execute_query__(self.conn, 'select * from deming_core_enterpriseuser;')
        self.conn.close()

        return result

