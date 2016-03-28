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

    const KeyBinding = React.createClass({
      displayName: 'KeyBindings',
      getInitialState: function() {
        return {shrt:''};
      },
      handleShrtChange: function (element){
        this.setState({shrt:element.target.value});
      },
      render: function(){
        const that = this;
        const av = this.props.available(this.state.shrt);
        return React.createElement('div',{style:{borderBottom: '1px solid gray'}, className:'jupyter-keybindings'},
                this.props.shortcut? 
                    React.createElement('i', {className: "pull-right fa fa-times", alt: 'remove title'+this.props.shortcut}):
                    React.createElement('i', {className: "pull-right fa fa-plus", alt: 'add-keyboard-shortcut', onClick:()=>{
                        av?that.props.onAddBindings(that.state.shrt, that.props.ckey):undefined;
                    }}),
                this.props.shortcut? undefined :
                    React.createElement('input', {type:'text', placeholder:'add shortcut', className:'pull-right'+(av?'':' alert alert-danger'), value:this.state.shrt, onChange:this.handleShrtChange}),
                this.props.shortcut? React.createElement('span', {className: 'pull-right'}, React.createElement('kbd', {}, this.props.shortcut)): undefined,
                React.createElement('div', {title: '(' +this.props.ckey + ')' , className:'jupyter-keybindings-text'}, this.props.display )
          );
      }
    });

    const KeyBindingList = React.createClass({
      displayName: 'KeyBindingList',
      getInitialState: function(){
        return {data:[]};
      },
      componentDidMount: function(){
          this.setState({data:this.props.callback()});
      },
      render: function() {
          const childrens = this.state.data.map((binding)=>{
              return React.createElement(KeyBinding, Object.assign({}, binding, {onAddBindings:(shortcut, action)=>{
                  this.props.bind(shortcut, action);
                  this.setState({data:this.props.callback()});
              },
              available:this.props.available
              }));
          });

          return React.createElement('div',{}, childrens);
        }
    });

    const get_shortcuts_data = function(notebook) {
        const actions = Object.keys(notebook.keyboard_manager.actions._actions);
        const src = [];

        for (let i = 0; i < actions.length; i++) {
          const action_id = actions[i];
          const action = notebook.keyboard_manager.actions.get(action_id);

          let shortcut = notebook.keyboard_manager.command_shortcuts.get_action_shortcut(action_id) ||
            notebook.keyboard_manager.edit_shortcuts.get_action_shortcut(action_id);
          if (shortcut) {
            shortcut = QH._humanize_sequence(shortcut);
          }
        
          src.push({
            display: humanize_action_id(action_id),
            shortcut: shortcut,
            key:action_id, // react specific thing
            ckey: action_id
          });
        }

        return src;
    };


    const ShortcutEditor = function(notebook) {

        if(!notebook){
          throw new Error("CommandPalette takes a notebook non-null mandatory arguement");
        }

        const body =  $('<div>');
        const mod = dialog.modal({
            notebook: notebook,
            keyboard_manager: notebook.keyboard_manager,
            title : "Edit Command mode Shortcuts",
            body : body,
            buttons : {
                OK : {}
            }
        });
        
        const src = get_shortcuts_data(notebook);

        mod.addClass("modal_stretch");

        mod.modal('show');
        ReactDom.render(
            React.createElement(KeyBindingList, {
                callback:()=>{ return  get_shortcuts_data(notebook);},
                bind: (shortcut, command)=>{return notebook.keyboard_manager.command_shortcuts.add_shortcut(shortcut, command);},
                available: (shrt) => { return notebook.keyboard_manager.command_shortcuts.is_available_shortcut(shrt);}
              }),
            body.get(0)
        );
    };
    return {'ShortcutEditor': ShortcutEditor};
});
