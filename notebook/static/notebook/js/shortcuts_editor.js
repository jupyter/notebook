// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

define(function(require){
    "use strict";

    const QH = require("notebook/js/quickhelp");
    const dialog = require("base/js/dialog");
    const React = require("React");
    const ReactDom = require("react-dom");

    /**
     * Humanize the action name to be consumed by user.
     * internaly the actions anem are of the form
     * <namespace>:<description-with-dashes>
     * we drop <namesapce> and replace dashes for space.
     */
    const humanize_action_id = function(str) {
      return str.split(':')[1].replace(/-/g, ' ').replace(/_/g, '-');
    };

    /**
     * given an action id return 'command-shortcut', 'edit-shortcut' or 'no-shortcut'
     * for the action. This allows us to tag UI in order to visually distinguish
     * wether an action have a keybinding or not.
     **/
    const get_mode_for_action_id = function(name, notebook) {
      let shortcut = notebook.keyboard_manager.command_shortcuts.get_action_shortcut(name);
      if (shortcut) {
        return 'command-shortcut';
      }
      shortcut = notebook.keyboard_manager.edit_shortcuts.get_action_shortcut(name);
      if (shortcut) {
        return 'edit-shortcut';
      }
      return 'no-shortcut';
    };

    const KeyBinding = React.createClass({
      displayName: 'KeyBindings',
      render: () => {
        return React.createElement('div',{style:{borderBottom: '1px solid gray'}},
                this.props.shortcut? React.createElement('i', {className: "pull-right fa fa-times", alt: 'remove title'+this.props.shortcut}):undefined,
                this.props.shortcut? React.createElement('span', {className: 'pull-right'}, React.createElement('kbd', {}, this.props.shortcut)): undefined,
                React.createElement('div', {}, this.props.display)
          );
      }
    });

    const KeyBindingList = React.createClass({
      displayName: 'KeyBindingList',
      render: function() {
          const childrens = this.props.data.map(function(binding){
              return React.createElement(KeyBinding, binding, 'here');
          });

          return React.createElement('div',{}, childrens);
        }
    });


    const ShortcutEditor = function(notebook) {

        if(!notebook){
          throw new Error("CommandPalette takes a notebook non-null mandatory arguement");
        }

        const b =  $('<div>');
        const mod = dialog.modal({
            notebook: notebook,
            keyboard_manager: notebook.keyboard_manager,
            title : "Edit Shortcuts",
            body : b,
            buttons : {
                OK : {}
            }
        });
        
              // will be trigger when user select action
              // generate structure needed for typeahead layout and ability to search
        const src = {};

        const actions = Object.keys(notebook.keyboard_manager.actions._actions);

        for (let i = 0; i < actions.length; i++) {
          const action_id = actions[i];
          const action = notebook.keyboard_manager.actions.get(action_id);
          const group = action_id.split(':')[0];

          src[group] = src[group] || {
            data: [],
            display: 'display'
          };

          let short = notebook.keyboard_manager.command_shortcuts.get_action_shortcut(action_id) ||
            notebook.keyboard_manager.edit_shortcuts.get_action_shortcut(action_id);
          if (short) {
            short = QH._humanize_sequence(short);
          }
        
          src[group].data.push({
            display: humanize_action_id(action_id),
            shortcut: short,
            mode_shortcut: get_mode_for_action_id(action_id, notebook),
            group: group,
            icon: action.icon,
            help: action.help,
            key: action_id,
          });
        }


        mod.modal('show');
        ReactDom.render(
            React.createElement(KeyBindingList, {data:src['jupyter-notebook'].data}),
            b.get(0)
        );
    };
    return {'ShortcutEditor': ShortcutEditor};
});
