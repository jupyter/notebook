# Simultaneous usage of different versions of Notebook 7 and the Classic Notebook UI

With the release of Notebook 7, the classic Notebook UI is now
available as a Jupyter Server extension, NbClassic. This means that
NbClassic can be installed independently of Notebook 7, and can be also
installed alongside Notebook 7.

Below are different scenarios that you might consider when updating to Notebook 7.

## Try it on Binder

You can try JupyterLab, Notebook 7 and NBClassic installed together using [this gist][lab-nb-nbclassic] on Binder:

[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gist/jtpio/35a72862c8be13dee31b61ebac2d9786/master?urlpath=/tree)

[lab-nb-nbclassic]: https://gist.github.com/jtpio/35a72862c8be13dee31b61ebac2d9786

## Using the `Interface` dropdown

Notebook 7 provides a dropdown menu to switch between the different user interfaces available on the same server.

It is available in the Notebook toolbar:

![image](https://user-images.githubusercontent.com/591645/229729077-a91bc9dd-9bb9-4510-a266-599bf2f97745.png)

```{note}
This dropdown is only available when using Notebook 7 or JupyterLab.
It is not displayed when using NbClassic.
```

## NbClassic and Notebook 7

You can install NbClassic, Notebook 7 and JupyterLab, all three of
which will provide different user interfaces
on the same server. When Notebook 7 is available, the NbClassic UI, will
be served at the `/nbclassic/tree` base path rather than the
base path `/tree` used otherwise. If you are using Notebook 7 along
with NbClassic, you will also have JupyterLab installed as it is a
dependency of Notebook 7, and these front ends will be available
through the following base paths: JupyterLab at `/lab`, Notebook 7 at
`/tree`, and NbClassic at `/nbclassic/tree`.

## NbClassic and Notebook 6.5.x

As NbClassic provides the static assets for Notebook 6.5.x, while
having both installed should cause no issues, the user interface provided
by these two packages will be the same. These UIs will be served by
different back end servers. An NbClassic instance will be at a server with the
`/tree` path and opening a Notebook 6.5.x instance will open on a
different server with the `/tree` path as well, presenting the same
static assets. When starting an instance of JupyterLab you will be able
to access the classic view of Notebook with NbClassic served on the same
server at `/tree`.

## NbClassic and Notebook \<= 6.4.x

When using NbClassic and Notebook \<= 6.4.x you can expect that these UIs
will not be only presented at different servers, meaning they will both
be available at their respective server under `/tree` but they
may also differ as potential changes to the NbClassic UI will not be
reflected in Notebook versions \<= 6.4.x. In this case as well, you would
be able to access the classic view of Notebook with NbClassic served on
the same server, at `/tree`.

## NbClassic and JupyterLab 3.x

When only JupyterLab 3.x is installed, then NbClassic does not have to be
explicitly installed as JupyterLab 3.x depends on it. They will run on
the same server, and are reachable via `/tree` for NbClassic and
`/lab` for JupyterLab.

## NbClassic and JupyterLab 4.x

When only JupyterLab 4.x is installed, then NbClassic has to be installed
explicitly. They will run on the same server, and are reachable via
`/tree` for NbClassic, and `/lab` for JupyterLab.

## NbClassic Independently

When you choose to install only NbClassic via `pip install nbclassic`,
the classic Notebook UI will be presented at the `/tree` path. As the
other frontends are not installed, attempting to access the other paths
will return errors. Note that NbClassic being a Jupyter Server extension,
indicated Jupyter Server will be available. This provides an additional
way to view the NbClassic frontend. You would be able to manually
enable the extension when running an instance of Jupyter Server,
`> jupyter server --ServerApp.jpserver_extensions="nbclassic=True"`,
which will provide the NbClassic frontend at `/tree` path when visited.
