import os
import re
import jsonschema
from ruamel.yaml import YAML
from notebook.notebookapp import NotebookApp
from notebook.utils import eventlogging_schema_fqn
from unittest import TestCase

yaml = YAML(typ='safe')

class RegisteredSchemasTestCase(TestCase):
    def schema_files(self):
        event_schemas_dir = os.path.realpath(
            os.path.join(os.path.dirname(__file__), '..', 'event-schemas')
        )
        schemas = []
        for dirname, _, files in os.walk(event_schemas_dir):
            for file in files:
                if file.endswith('.yaml'):
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
                jsonschema.Draft7Validator.check_schema(yaml.load(f))

    def test_schema_conventions(self):
        """
        Test schema naming convention for this repo.

        1. All schemas should be under event-schamas/{name}/v{version}.yaml
        2. Schema id should be eventlogging.jupyter.org/notebook/{name}
        3. Schema version should match version in file
        """
        for schema_file in self.schema_files():
            filename = os.path.basename(schema_file)
            match = re.match('v(\d+)\.yaml', filename)
            # All schema locations must match the following pattern
            # schema-name/v(version).yaml
            self.assertIsNotNone(match)

            with open(schema_file) as f:
                schema = yaml.load(f)

            self.assertEqual(schema['$id'], eventlogging_schema_fqn(
                os.path.basename(os.path.dirname(schema_file))
            ))
            self.assertEqual(schema['version'], int(match.groups()[0]))
                