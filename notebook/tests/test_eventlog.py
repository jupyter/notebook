import os
import re
import json
import jsonschema
from notebook.notebookapp import NotebookApp
from notebook.utils import eventlogging_schema_fqn
from unittest import TestCase

class RegisteredSchemasTestCase(TestCase):
    def schema_files(self):
        event_schemas_dir = os.path.realpath(
            os.path.join(os.path.dirname(__file__), '..', 'event-schemas')
        )
        schemas = []
        for dirname, _, files in os.walk(event_schemas_dir):
            for file in files:
                if file.endswith('.json'):
                    yield os.path.join(dirname, file)

    def test_eventlogging_schema_fqn(self):
        self.assertEqual(
            eventlogging_schema_fqn('test'),
            'eventlogging.jupyter.org/notebook/test'
        )
    def test_valid_schemas(self):
        """
        All schemas must be valid json schemas
        """
        for schema_file in self.schema_files():
            with open(schema_file) as f:
                jsonschema.Draft7Validator.check_schema(json.load(f))

    def test_schema_conventions(self):
        """
        Test schema naming convention for this repo.

        1. All schemas should be under event-schamas/{name}/v{version}.json
        2. Schema id should be eventlogging.jupyter.org/notebook/{name}
        3. Schema version should match version in file
        """
        for schema_file in self.schema_files():
            filename = os.path.basename(schema_file)
            match = re.match('v(\d+)\.json', filename)
            # All schema locations must match the following pattern
            # schema-name/v(version).json
            self.assertIsNotNone(match)

            with open(schema_file) as f:
                schema = json.load(f)

            self.assertEqual(schema['$id'], eventlogging_schema_fqn(
                os.path.basename(os.path.dirname(schema_file))
            ))
            self.assertEqual(schema['version'], int(match.groups()[0]))
                