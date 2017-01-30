// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
require([
    'jquery',
    'base/js/dialog',
    'base/js/utils',
    'underscore',
    'base/js/namespace'
], function ($, dialog, utils, _, IPython) {
    'use strict';
    var i18n = utils.i18n;
    var gettext = function(text) {
    	return i18n.gettext(text);
    }    
    $('#notebook_about').click(function () {
        // use underscore template to auto html escape
        if (sys_info) {
          var text = gettext('You are using Jupyter notebook.');
          text = text + '<br/><br/>';
          text = text + gettext('The version of the notebook server is: ');
          text = text + _.template('<b><%- version %></b>')({ version: sys_info.notebook_version });
          if (sys_info.commit_hash) {
              text = text + _.template('-<%- hash %>')({ hash: sys_info.commit_hash });
          }
         text = text + '<br/>';
         text = text + gettext('The server is running on this version of Python:');
          text = text + _.template('<br/><pre>Python <%- pyver %></pre>')({ 
            pyver: sys_info.sys_version });
          var kinfo = $('<div/>').attr('id', '#about-kinfo').text(gettext('Waiting for kernel to be available...'));
          var body = $('<div/>');
          body.append($('<h4/>').text(gettext('Server Information:')));
          body.append($('<p/>').html(text));
          body.append($('<h4/>').text(gettext('Current Kernel Information:')));
          body.append(kinfo);
        } else {
          var text = gettext('Could not access sys_info variable for version information.');
          var body = $('<div/>');
          body.append($('<h4/>').text(gettext('Cannot find sys_info!')));
          body.append($('<p/>').html(text));
        }
        dialog.modal({
            title: gettext('About Jupyter Notebook'),
            body: body,
            buttons: { 'OK': {} }
        });
        try {
            IPython.notebook.session.kernel.kernel_info(function (data) {
                kinfo.html($('<pre/>').text(data.content.banner));
            });
        } catch (e) {
            kinfo.html($('<p/>').text(gettext('unable to contact kernel')));
        }
    });
});
