// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
//
//


var Jupyter = Jupyter || {};

var jprop = function(name, module_path){
    Object.defineProperty(Jupyter, name, {
      get: function() { 
          console.warn('accessing `'+name+'` is deprecated. Use require("'+module_path+'")');
          return require(module_path); 
      },
      enumerable: true,
      configurable: false
    });
}

var jglobal = function(name, module_path){
    Object.defineProperty(Jupyter, name, {
      get: function() { 
          console.warn('accessing `'+name+'` is deprecated. Use require("'+module_path+'").'+name);
          return require(module_path)[name]; 
      },
      enumerable: true,
      configurable: false
    });
}

define(function(){
    "use strict";

    // expose modules
    
    jprop('utils','base/js/utils')
    
    //Jupyter.load_extensions = Jupyter.utils.load_extensions;
    // 
    jprop('security','base/js/security');
    jprop('keyboard','base/js/keyboard');
    jprop('dialog','base/js/dialog');
    jprop('mathjaxutils','notebook/js/mathjaxutils');


    //// exposed constructors
    jglobal('CommManager','services/kernels/comm')
    jglobal('Comm','services/kernels/comm')

    jglobal('NotificationWidget','base/js/notificationwidget');
    jglobal('Kernel','services/kernels/kernel');
    jglobal('Session','services/sessions/session');
    jglobal('LoginWidget','auth/js/loginwidget');
    jglobal('Page','base/js/page');
    jglobal('TextCell','base/js/textcell');
    jglobal('MarkdownCell','base/js/textcell');
    jglobal('RawCell','base/js/textcell');
    jglobal('Cell','base/js/cell');
    jglobal('OutputArea','notebook/js/outputarea');

    Jupyter.version = "4.0.0.dev";
    Jupyter._target = '_blank';
    return Jupyter;
});

// deprecated since 4.0, remove in 5+
var IPython = Jupyter
