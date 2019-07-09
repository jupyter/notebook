# Event Schemas

## Generating .json files

Event Schemas are written in a human readable `.yaml` format.
This is primarily to get multi-line strings in our descriptions,
as documentation is very important.

Every time you modify a `.yaml` file, you should run the following
commands.

```bash
./generate-json.py
```

This needs the `ruamel.yaml` python package installed.

Hopefully, this is extremely temporary, and we can just use YAML
with jupyter_telemetry.