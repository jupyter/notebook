# Db util class which take care of executing queries.

import os
from concurrent.futures import ThreadPoolExecutor

import django
from django.conf import settings
from django.db import connection
from django.db.models import QuerySet
from functools import wraps
from typing import List

# PG values.
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
    LANGUAGE_CODE='en-us',
    TIME_ZONE='UTC',
    USE_I18N=True,
    USE_L10N=True,
    USE_TZ=True,
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

from deming.models import EnterpriseUser, KernelSession, EdgeDevice
from deming.edge import device_types
from deming.edge.status import ACTIVE


class DjangoConnectionThreadPoolExecutor(ThreadPoolExecutor):
    """
    https://stackoverflow.com/questions/57211476/django-orm-leaks-connections-when-using-threadpoolexecutor
    
    As we are running database queries inside a thread, some of the connections do not close.
    Use this instead of ThreadPoolExecutor to properly close the connections.
    """
    def close_django_db_connection(self):
        connection.close()

    def generate_thread_closing_wrapper(self, fn):
        @wraps(fn)
        def new_func(*args, **kwargs):
            try:
                return fn(*args, **kwargs)
            finally:
                self.close_django_db_connection()
        return new_func

    def submit(*args, **kwargs):
        if len(args) >= 2:
            self, fn, *args = args
            fn = self.generate_thread_closing_wrapper(fn=fn)
        elif not args:
            raise TypeError("descriptor 'submit' of 'ThreadPoolExecutor' object needs an argument")
        elif 'fn' in kwargs:
            fn = self.generate_thread_closing_wrapper(fn=kwargs.pop('fn'))
            self, *args = args
    
        return super(self.__class__, self).submit(fn, *args, **kwargs)

def run_inside_thread(query_func):
    """
    Decorator to use with methods which access the Django ORM.
    We are in an asynchronous context and cannot call Django ORM which is synchronous.
    So, run it in a separate thread.
    """
    def wrapped_function(self, *args, **kwargs):
        with DjangoConnectionThreadPoolExecutor(max_workers=1) as pool:
            submission = pool.submit(query_func, self, *args, **kwargs)
            return submission.result()
    return wrapped_function


class ExecuteQueries:
    """
    This class contains all the helper methods for executing queries using django orms.
    The logic of  django orm is kept here so that we don't repeat the imports and setup django in different files.
    """

    @run_inside_thread
    def get_active_devices(self, edge_devices: QuerySet) -> List[EdgeDevice]:
        """
        Get active devices
        :param edge_devices: edge device query set.
        :return: list of active edge devices.
        """

        return [edge_device for edge_device in edge_devices if edge_device.status == ACTIVE]

    @run_inside_thread
    def get_mlnodes(self) -> QuerySet:
        """
        Get all the mlnode instances that are present in the MLNode table.
        :return: List of Mlnode instances.
        """

        return self.get_active_devices(EdgeDevice.objects.filter(device_type__in=device_types.valid_ml_node_types,
                                                                 system_status__is_connected=True))

    @run_inside_thread
    def get_ml_node(self, column_name: str, column_value: str) -> List[EdgeDevice]:
        """
        Get ml node instances for the given column name and value.
        :param column_name: (str) Name of the column.
        :param column_value: (str) Value of column.
        :return: List of Mlnode instances.
        """
        kwargs = {column_name: column_value}
        return self.get_active_devices(EdgeDevice.objects.filter(device_type__in=device_types.valid_ml_node_types,
                                                                 system_status__is_connected=True).filter(**kwargs))
    
    @run_inside_thread
    def delete_kernel_session(self, column_name: str, column_value: str) -> tuple:
        """
        Delete the entry in the Kernel Session table for the given column name and Value.
        :param column_name: (str) Name of the column
        :param column_value: (str) Value of column
        :return: Tuple with information about number of deleted sessions.
        """
        kwargs = {column_name: column_value}
        return KernelSession.objects.filter(**kwargs).delete()

    @run_inside_thread
    def get_kernel_session(self, column_name: str, column_value: str) -> QuerySet:
        """
        Get kernel session instances for the given column name and value.
        :param column_name: (str) Name of the column
        :param column_value: (str) Value of column
        :return: QuerySet of KernelSession instances.
        """
        kwargs = {column_name: column_value}
        return KernelSession.objects.filter(**kwargs)

    @run_inside_thread
    def create_kernel_session(self, _field_values: dict) -> KernelSession:
        """
        Create kernel session instance with provided values.
        :param _field_values: (Dict) Dictionary of field values.
        :return: KernelSession instance.
        """

        _kernel_id = _field_values.get("kernel_id")
        _kernel_name = _field_values.get("kernel_name")
        mlnode_id = _field_values['mlnode_id']
        result, _ = KernelSession.objects.update_or_create(kernel_id=_kernel_id,
                                                           kernel_name=_kernel_name,
                                                           ml_node=EdgeDevice.objects.get(id=mlnode_id))
        return result

    @run_inside_thread
    def check_kernel_sessions(self, column_name: str, column_value: str) -> bool:
        """
        Check if there is an entry wih the following field and value.
        :param column_name: Name of the Column. ( String )
        :param column_value: Value of the Column. ( String )
        :return: Boolean Value.
        """

        kwargs = {column_name: column_value}
        return KernelSession.objects.filter(**kwargs).exists()

    @run_inside_thread
    def update_kernel_session(self, _field_values: dict) -> None:
        """
        Update the kernel session values.
        :param _field_values: (Dict) Dictionary of field values.
        """
        try:
            kernel_session = KernelSession.objects.get(
                kernel_id=_field_values['kernel_id'])

            if 'user_name' in _field_values:
                user = EnterpriseUser.objects.get(
                    username=_field_values['user_name'])
                kernel_session.enterprise_user = user

            kernel_session.save()

        except Exception as e:
            print(f'Error occurred in updating kernel session ={e}')

    @run_inside_thread
    def get_mlnode_address(self) -> List[str]:
        """
        Get address for all the mlnodes
        :return: List of address for Mlnodes instances.
        """
        mlnodes = self.get_active_devices(EdgeDevice.objects.filter(device_type__in=device_types.valid_ml_node_types,
                                                                    system_status__is_connected=True))
        return [f'https://{str(mlnode.ip_address)}' for mlnode in mlnodes]

    @run_inside_thread
    def get_mlnode_address_with_field(self, column_name: str, column_value: str) -> str:
        """
        Get ml node instances for the given column name and value. Provided a field value.
        :param column_name: Name of the Column. ( String )
        :param column_value: Value of the Column. ( String )
        :return: Address for Mlnode instances.
        """
        kwargs = {column_name: column_value}
        mlnode = EdgeDevice.objects.get(**kwargs)
        return f'https://{str(mlnode.ip_address)}'
