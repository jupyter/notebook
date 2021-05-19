from .app import RetroApp


def load_jupyter_server_extension(serverapp):
    extension = RetroApp()
    extension.serverapp = serverapp
    extension.load_config_file()
    extension.update_config(serverapp.config)
    extension.parse_command_line(serverapp.extra_args)
    extension.initialize()
