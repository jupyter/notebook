import threading

from flask import Flask, jsonify, request
from werkzeug.serving import make_server

app = Flask(__name__)


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    print(f"NOTEBOOK AGENT SERVER SIDECAR SUCCESSFULLY RECEIVED CHAT PAYLOAD: {data}")  # noqa: T201
    return jsonify(data)


class AgentServer:
    def __init__(self):
        self._server = make_server("0.0.0.0", 4242, app, threaded=True)
        self._thread = threading.Thread(target=self._server.serve_forever)

    def start(self):
        print("Starting agent server...")  # noqa: T201
        self._thread.start()

    def stop(self):
        print("Stopping agent server...")  # noqa: T201
        self._server.shutdown()
        self._thread.join()


_server_instance = None


def run_agent_server():
    global _server_instance
    if _server_instance is None:
        _server_instance = AgentServer()
        _server_instance.start()


def stop_agent_server():
    global _server_instance
    if _server_instance:
        _server_instance.stop()
