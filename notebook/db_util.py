# Db util class which take care of executing queries.

import os
import requests
from requests.auth import HTTPBasicAuth
from urllib.parse import urljoin
from deming.edge.status import ACTIVE


# Constants for API calls to ContexAlyze
USERNAME = os.environ.get('USERNAME')
PASSWORD = os.environ.get('PASSWORD')
HOST = os.environ.get('SITE_URL')
QNNECT_API_URL = urljoin(HOST, 'qnnect/')
ML_NODE_API = urljoin(QNNECT_API_URL, 'ml_node/')
KERNEL_SESSION_API = urljoin(QNNECT_API_URL, 'kernel_session/')


class ExecuteQueries:
    """
    This class contains all the helper methods for executing queries using API calls to ContexAlyze.
    """

    def get_active_devices(self, edge_devices: list[dict]) -> list[dict]:
        """
        Get active devices
        :param edge_devices: List of dictionaries (the JSON response from API)
        :return: list of active edge devices.
        """

        return [edge_device for edge_device in edge_devices if edge_device['status'] == ACTIVE]

    def get_mlnodes(self):
        """
        Get all the mlnode instances that are present in the MLNode table.
        :return: List of Mlnode instances.
        """
        resp = requests.get(ML_NODE_API, auth=HTTPBasicAuth(USERNAME, PASSWORD))
        ml_nodes_json = resp.json()
        return self.get_active_devices(ml_nodes_json)

    def get_ml_node(self, column_name: str, column_value: str) -> dict:
        """
        Get the first instance of MLNode which matches the given column name and value.
        :param column_name: (str) Name of the column.
        :param column_value: (str) Value of column.
        :return: A single JSON serialized MLNode instance
        """
        ml_nodes = self.get_mlnodes()
        return list(filter(lambda ml_node: ml_node[column_name] == column_value, ml_nodes))[0]
    
    
    def delete_kernel_session(self, kernel_id: str) -> None:
        """
        Delete the entry in the Kernel Session table for the given `kernel_id`
        :param kernel_id: (str) UUID of the KernelSession which is to be deleted
        """
        requests.delete(urljoin(KERNEL_SESSION_API, kernel_id), auth=HTTPBasicAuth(USERNAME, PASSWORD))

    def get_kernel_session(self, kernel_id: str) -> dict:
        """
        Get the first instance of kernel session which matches the given column name and value.
        :param kernel_id: (str) UUID of the KernelSession which is to be deleted
        :return: A single JSON serialized KernelSession instance
        """
        resp = requests.get(urljoin(KERNEL_SESSION_API, kernel_id), auth=HTTPBasicAuth(USERNAME, PASSWORD))
        return resp.json()

    def create_kernel_session(self, _field_values: dict) -> dict:
        """
        Create kernel session instance with provided values.
        :param _field_values: (Dict) Dictionary of field values.
        :return: JSON serialized KernelSession instance.
        """
        _kernel_id = _field_values.get("kernel_id")
        _kernel_name = _field_values.get("kernel_name")
        mlnode_id = _field_values['mlnode_id']
        data={
            "kernel_id": _kernel_id,
            "kernel_name": _kernel_name,
            "ml_node": int(mlnode_id),
        }
        resp = requests.post(KERNEL_SESSION_API, data=data, auth=HTTPBasicAuth(USERNAME, PASSWORD))
        return resp.json()

    def check_kernel_sessions(self, kernel_id: str) -> bool:
        """
        Check if there is an entry wih the following field and value.
        :param kernel_id: UUID of the Kernel Session ( String )
        :return: Boolean Value.
        """
        kernel_session = self.get_kernel_session(kernel_id)
        return 'kernel_id' in kernel_session 

    def update_kernel_session(self, _field_values: dict) -> None:
        """
        Update the kernel session values.
        :param _field_values: (Dict) Dictionary of field values.
        """
        if 'user_name' in _field_values:
            resp = requests.patch(urljoin(KERNEL_SESSION_API, 'update_kernel/'), data={
                'kernel_id': _field_values['kernel_id'],
                'enterprise_user_name': _field_values['user_name']
            }, auth=HTTPBasicAuth(USERNAME, PASSWORD))
            if not resp.ok:
                raise Exception("Failed to update")


    def get_mlnode_address(self) -> list[str]:
        """
        Get address for all the mlnodes
        :return: List of address for Mlnodes instances.
        """
        mlnodes = self.get_mlnodes()
        return [f"https://{mlnode['ip_address']}" for mlnode in mlnodes]

    def get_mlnode_address_with_field(self, column_name: str, column_value: str) -> str:
        """
        Get ml node instances for the given column name and value. Provided a field value.
        :param column_name: Name of the Column. ( String )
        :param column_value: Value of the Column. ( String )
        :return: Address for Mlnode instances.
        """
        mlnode = self.get_ml_node(column_name, int(column_value))
        return f"https://{mlnode['ip_address']}"
