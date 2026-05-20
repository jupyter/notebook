(running-over-ssh-tunnel)=

# Running Jupyter Notebook over an SSH tunnel

This guide shows how to run Jupyter Notebook on a remote machine (for example
a cloud VM, a workstation in your office, or an HPC login node) and access it
from your local browser by tunneling the connection through SSH.

Compared to exposing Jupyter on a public port behind HTTPS and a password,
an SSH tunnel is often the simplest way to get a private, encrypted connection
to a remote notebook without configuring TLS certificates, opening firewall
ports, or putting Jupyter on the public internet.

For a guide to running a *public* Jupyter server with HTTPS and reverse-proxy
setups, see the
[Running a Jupyter Server](https://jupyter-server.readthedocs.io/en/stable/operators/public-server.html)
page in the Jupyter Server documentation. This page focuses on the
SSH-tunnel-only case.

## When to use an SSH tunnel

Use an SSH tunnel when:

- You already have SSH access to the remote machine.
- Only you (or a small set of trusted users) need to reach the notebook.
- You do not want to expose Jupyter on a public network port.
- The remote machine is behind a firewall or NAT and is not directly reachable
  from your laptop.

If you instead need a multi-user web service, look at
[JupyterHub](https://jupyterhub.readthedocs.io/) rather than running individual
SSH-tunneled notebooks.

## How an SSH tunnel works (in one paragraph)

`ssh -L <local-port>:localhost:<remote-port> user@remote-host` opens an SSH
connection to `remote-host` and asks the SSH client to listen on
`<local-port>` on your laptop. Anything you send to `localhost:<local-port>`
on your laptop is forwarded, inside the encrypted SSH connection, to
`localhost:<remote-port>` *on the remote machine*. From Jupyter's point of
view, the request appears to come from `localhost` on the remote host, so
Jupyter only ever needs to listen on the loopback interface.

## Step 1 — Configure Jupyter on the remote machine

On the **remote machine**, configure Jupyter Notebook so that:

- it only listens on `localhost` (so it is *not* reachable from other
  machines, even on the same LAN),
- it does not try to open a browser (there is no display on the remote),
- it uses a fixed port that you will tunnel to from your laptop,
- it requires a password or token (Jupyter does this by default).

Generate a configuration file if you do not have one yet:

```bash
jupyter notebook --generate-config
```

Then edit `~/.jupyter/jupyter_notebook_config.py` and set:

```python
c.ServerApp.ip = "127.0.0.1"        # listen only on loopback
c.ServerApp.open_browser = False    # no browser on the remote
c.ServerApp.port = 8888             # fixed port; pick any free port
c.ServerApp.port_retries = 0        # fail fast if the port is taken
```

```{note}
Jupyter Notebook 7 is built on top of Jupyter Server, so server-level options
live under `c.ServerApp.*`. Older guides for Notebook 6 used `c.NotebookApp.*`
instead; those names still work in many places thanks to aliases, but new
configuration should use `ServerApp`.
```

If you want password authentication (recommended; see the
[Jupyter Server security docs](https://jupyter-server.readthedocs.io/en/stable/operators/security.html)),
generate a hashed password once on the remote machine:

```bash
jupyter server password
```

This writes the hashed password to
`~/.jupyter/jupyter_server_config.json`. Token-based authentication (the
default) also works fine through the tunnel — Jupyter will print a URL with
a one-time token in the terminal when you start it.

## Step 2 — Start Jupyter on the remote machine

On the remote machine:

```bash
jupyter notebook
```

Leave it running (for example inside `tmux`, `screen`, or as a `systemd`
service if you want it to survive logout). The first few lines of the output
will look like:

```text
[I 2026-05-20 10:00:00.123 ServerApp] Jupyter Server 2.x.y is running at:
[I 2026-05-20 10:00:00.123 ServerApp]     http://localhost:8888/?token=…
```

Copy the URL (or just the `?token=…` query string); you will need it on your
laptop.

## Step 3 — Open the SSH tunnel from your laptop

On your **local machine**, in a separate terminal, run:

```bash
ssh -N -L 8888:localhost:8888 user@remote-host
```

The flags mean:

- `-N` — do not run a remote command; we only want the tunnel.
- `-L 8888:localhost:8888` — forward local port `8888` to `localhost:8888`
  on the remote machine.
- `user@remote-host` — your usual SSH login.

If port `8888` is already in use on your laptop (for example because you
also run Jupyter locally), pick any free local port instead:

```bash
ssh -N -L 9999:localhost:8888 user@remote-host
```

and then open `http://localhost:9999/` in your browser.

If you use an SSH bastion / jump host, the standard `-J` flag still works:

```bash
ssh -N -J user@bastion -L 8888:localhost:8888 user@remote-host
```

## Step 4 — Open the notebook in your browser

In your local browser, navigate to:

```text
http://localhost:8888/
```

(or whatever local port you chose in Step 3). Paste the token from Step 2
when prompted, or enter your password if you configured one. You will then
see the familiar Jupyter Notebook 7 interface — even though the kernels,
files, and computation are all running on the remote machine.

## Tips and common pitfalls

- **Keep the tunnel alive.** If your SSH connection drops (Wi-Fi loss,
  laptop sleep, …) the tunnel dies and the browser tab will show a
  connection error. Re-run the `ssh -N -L …` command and reload the page.
  To survive long network blips, add `ServerAliveInterval 60` to
  `~/.ssh/config` for the remote host, or wrap the tunnel in a tool like
  [`autossh`](https://www.harding.motd.ca/autossh/).
- **Pick a unique port per project.** If you tunnel two remotes to the same
  local port at the same time, only one will work. Convention: use
  `8888`, `8889`, `8890`, … as you add machines.
- **Always bind Jupyter to `127.0.0.1`** (not `0.0.0.0` or an empty string)
  when you only access it via SSH. Binding to all interfaces would expose
  the notebook to anyone who can reach the remote machine over the network,
  even without the tunnel.
- **HTTPS is not required.** Because everything between your laptop and the
  remote machine travels inside the SSH connection, the unencrypted
  `http://localhost:8888/` URL is already encrypted on the wire by SSH.
- **JupyterLab works the same way.** If you prefer the JupyterLab interface,
  run `jupyter lab` instead of `jupyter notebook` on the remote machine; the
  tunnel command is identical.

## Troubleshooting

- *"channel 2: open failed: connect failed: Connection refused"* in the
  SSH terminal usually means Jupyter is not actually listening on the
  remote port you specified. Re-check `c.ServerApp.port` and that
  `jupyter notebook` printed a `http://localhost:<port>` URL on the remote.
- *Browser hangs on "connecting"* often means the remote port is bound but
  to a different interface. Make sure `c.ServerApp.ip = "127.0.0.1"`, not
  `"0.0.0.0"` or a public IP — `ssh -L … localhost:<remote-port>` only
  forwards to the loopback interface on the remote.
- *"address already in use"* when starting Jupyter on the remote means
  another process is using that port. Either kill it, or change
  `c.ServerApp.port` to something else and update the `ssh -L` command to
  match.

See [What to do when things go wrong](../troubleshooting.md) for general
Jupyter troubleshooting steps, and the
[Jupyter Discourse Forum](https://discourse.jupyter.org/) if you get stuck.
