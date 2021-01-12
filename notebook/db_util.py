# import psycopg2
# from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
# from psycopg2 import ProgrammingError
# import psycopg2.extras
# from psycopg2.extras import NamedTupleCursor

import os

import django
from django.conf import settings
PG_DB_USER = os.environ.get('PG_DB_USER', '')
PG_DB_NAME = os.environ.get('PG_DB_NAME', '')
PG_DB_PASS = os.environ.get('PG_DB_PASS', '')
PG_DB_HOST = os.environ.get('PG_DB_HOST', '')
PG_DB_PORT = os.environ.get('PG_DB_PORT', '')

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': PG_DB_NAME,
        'USER': PG_DB_USER,
        'PASSWORD': PG_DB_PASS,
        'HOST': PG_DB_HOST,
        'PORT': PG_DB_PORT,
    }
}

settings.configure(
        DATABASES=DATABASES,
        SECRET_KEY='1234578',
        INSTALLED_APPS=[
            'deming_core',
            'django.contrib.auth',
            'django.contrib.admin',
            'django.contrib.contenttypes',
            'django.contrib.sessions',
            'django.contrib.messages',
            'django.contrib.staticfiles',
        ])

django.setup()


from deming.models import MLNode, KernelSession



class ExecuteQueries:
    """
    Class to write the logic of raw queries
    """

    # def get_users(self):
    #     """
    #     #TODO: Remove the method if not required, this is dummy method to test the and list the connections.
    #     """
    #
    #     result = self.db.__run_query__('select * from deming_core_enterpriseuser;')
    #
    #     return result

    
    def get_mlnodes(self):
        """
        Get all the mlnodes that are in the MLNode table.
        """
        # self.conn = self.db.__get_connection__()
        # result = self.db.__execute_query__(self.conn, 'select * from deming_core_mlnode')
        #
        # self.conn.close()

        return MLNode.objects.all()

    
    def get_ml_node(self, column_name, column_value):
        """
        Get ml node info for the given column name and value.
        :param column_name: (str) Name of the column
        :param column_value: Value of column
        :return: List of Mlnode instances.
        """
        kwargs = {column_name: column_value}
        return MLNode.objects.filter(**kwargs)

    def delete_kernel_session(self, column_name, column_value):
        """
        Delete the entry in the Kernel Session table for the given column name and Value.
        :param column_name: (str) Name of the column
        :param column_value: Value of column
        """
        kwargs = {column_name: column_value}
        return KernelSession.objects.filter(**kwargs).delete()


    def get_kernel_session(self, column_name, column_value):
        """
        Get ml node info for the given column name and value.
        :param column_name: (str) Name of the column
        :param column_value: Value of column
        :return: List of KernelSession instances.
        """
        kwargs = {column_name: column_value}
        return KernelSession.objects.filter(**kwargs)

    def create_kernel_session(self, _field_values):
        """
        Create kernel session with provided field values.
        :param _field_values: (Dict) Dictionary of field values.
        :return: result of the query.
        """
        _kernel_id = _field_values.get("kernel_id", None)
        _kernel_name   = _field_values.get("kernel_name", None)
        mlnode_name = _field_values['mlnode_name']
        result = KernelSession(kernel_id=_kernel_id,
                               kernel_name=_kernel_name,
                               ml_node=MLNode.objects.filter(name=mlnode_name)[0])
        result.save()
        return result

    def check_kernel_sessions(self, column_name, column_value):
        """
        Check if there is an entry wih the following field and value.
        :param column_name: Name of the Column. ( String )
        :param column_value: Value of the Column. ( String )
        :return: Boolean Value.
        """

        kwargs = {column_name: column_value}
        return KernelSession.objects.filter(**kwargs).exists()
