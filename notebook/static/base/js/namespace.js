// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

var Jupyter = Jupyter || {};
define(function(){
    "use strict";

    // expose modules
    Jupyter.utils = require('base/js/utils');
    Jupyter.load_extensions = Jupyter.utils.load_extensions;
     
    Jupyter.security = require('base/js/security');
    Jupyter.keyboard = require('base/js/keyboard');
    Jupyter.dialog = require('base/js/dialog');


    // exposed constructors
    var comm = require('services/kernels/comm');
    Jupyter.CommManager = comm.CommManager;
    Jupyter.Comm = comm.Comm;

    Jupyter.NotificationWidget = require('base/js/notificationwidget').NotificationWidget;
    Jupyter.Kernel = require('services/kernels/kernel').Kernel;
    Jupyter.Session = require('services/kernels/session').Session;
    Jupyter.LoginWidget = require('auth/js/loginwidget').LoginWidget
    Jupyter.Page = require('base/js/page').Page;

    Jupyter.version = "4.0.0.dev";
    Jupyter._target = '_blank';
    return Jupyter;
});

// deprecated since 4.0, remove in 5+
var IPython = Jupyter
