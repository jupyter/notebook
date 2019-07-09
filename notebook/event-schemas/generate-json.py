#!/usr/bin/env python3
import argparse
import json
import os
import jsonschema
from ruamel.yaml import YAML

from jupyter_telemetry.eventlog import EventLog

yaml = YAML(typ='safe')

def main():
    argparser = argparse.ArgumentParser()
    argparser.add_argument(
        'directory',
        help='Directory with Schema .yaml files'
    )

    args = argparser.parse_args()

    el = EventLog()
    for dirname, _, files in os.walk(args.directory):
        for file in files:
            if not file.endswith('.yaml'):
                continue
            yaml_path = os.path.join(dirname, file)
            print('Processing', yaml_path)
            with open(yaml_path) as f:
                schema = yaml.load(f)

            # validate schema
            el.register_schema(schema)

            json_path = os.path.join(dirname, os.path.splitext(file)[0] + '.json')
            with open(json_path, 'w') as f:
                json.dump(schema, f, indent=4)

if __name__ == '__main__':
    main()