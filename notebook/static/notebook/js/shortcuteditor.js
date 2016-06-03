// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.


import QH from "notebook/js/quickhelp";
import dialog from "base/js/dialog";
import {render} from "preact";
import {createElement, createClass} from "preact-compat";
import marked from 'components/marked/lib/marked';

/**
 * Humanize the action name to be consumed by user.
 * internally the actions name are of the form
 * <namespace>:<description-with-dashes>
 * we drop <namespace> and replace dashes for space.
 */
const humanize_action_id = function(str) {
  return str.split(':')[1].replace(/-/g, ' ').replace(/_/g, '-');
};

/**
 * given an action id return 'command-shortcut', 'edit-shortcut' or 'no-shortcut'
 * for the action. This allows us to tag UI in order to visually distinguish
 * Wether an action have a keybinding or not.
 **/

const KeyBinding = createClass({
  displayName: 'KeyBindings',
  getInitialState: function() {
    return {shrt:''};
  },
  handleShrtChange: function (element){
    this.setState({shrt:element.target.value});
  },
  render: function(){
    const that = this;
    const available = this.props.available(this.state.shrt);
    const empty = (this.state.shrt === '');
    return createElement('div', {className:'jupyter-keybindings'},
              createElement('i', {className: "pull-right fa fa-plus", alt: 'add-keyboard-shortcut',
                  onClick:()=>{
                      available?that.props.onAddBindings(that.state.shrt, that.props.ckey):null;
                      that.state.shrt='';
                  }
              }),
              createElement('input', {
                                      type:'text', 
                               placeholder:'add shortcut', 
                                 className:'pull-right'+((available||empty)?'':' alert alert-danger'),
                                     value:this.state.shrt,
                                  onChange:this.handleShrtChange
              }),
              this.props.shortcuts?this.props.shortcuts.map((item, index) => {
                return createElement('span', {className: 'pull-right'},
                  createElement('kbd', {}, [
                    item.h,
                    createElement('i', {className: "fa fa-times", alt: 'remove '+item.h,
                      onClick:()=>{
                        that.props.unbind(item.raw);
                      }
                    })
                  ])
                );
              }):null,
              createElement('div', {title: '(' +this.props.ckey + ')' , className:'jupyter-keybindings-text'}, this.props.display )
      );
  }
});

const KeyBindingList = createClass({
  displayName: 'KeyBindingList',
  getInitialState: function(){
    return {data:[]};
  },
  componentDidMount: function(){
      this.setState({data:this.props.callback()});
  },
  render: function() {
      const childrens = this.state.data.map((binding)=>{
          return createElement(KeyBinding, Object.assign({}, binding, {onAddBindings:(shortcut, action)=>{
              this.props.bind(shortcut, action);
              this.setState({data:this.props.callback()});
          },
          available:this.props.available, 
          unbind: (shortcut) => {
                  this.props.unbind(shortcut);
                  this.setState({data:this.props.callback()});
             }
          }));
      });
      childrens.unshift(createElement('div', {className:'well', key:'disclamer', dangerouslySetInnerHTML:
            {__html: 
            marked(
            
            "This dialog allows you to modify the keymap of the command mode, and persist the changes. "+
            "You can define many type of shorctuts and sequences of keys. "+
            "\n\n"+
            " - Use dashes `-` to represent keys that should be pressed with modifiers, "+
            "for example `Shift-a`, or `Ctrl-;`. \n"+
            " - Separate by commas if the keys need to be pressed in sequence: `h,a,l,t`.\n"+
            "\n\nYou can combine the two: `Ctrl-x,Meta-c,Meta-b,u,t,t,e,r,f,l,y`.\n"+
            "Casing will have no effects: (e.g: `;` and `:` are the same on english keyboards)."+
            " You need to explicitelty write the `Shift` modifier.\n"+
            "Valid modifiers are `Cmd`, `Ctrl`, `Alt` ,`Meta`, `Cmdtrl`. Refer to developper docs "+
            "for their signification depending on the platform."
            )}
      }));
      return createElement('div',{}, childrens);
    }
});

const get_shortcuts_data = function(notebook) {
    const actions = Object.keys(notebook.keyboard_manager.actions._actions);
    const src = [];

    for (let i = 0; i < actions.length; i++) {
      const action_id = actions[i];
      const action = notebook.keyboard_manager.actions.get(action_id);

      let shortcuts = notebook.keyboard_manager.command_shortcuts.get_action_shortcuts(action_id);
      let hshortcuts;
      if (shortcuts.length > 0) {
        hshortcuts = shortcuts.map((raw)=>{
          return {h:QH._humanize_sequence(raw),raw:raw};}
        );
      }
      src.push({
        display: humanize_action_id(action_id),
        shortcuts: hshortcuts,
        key:action_id, // react specific thing
        ckey: action_id
      });
    }
    return src;
};


export const ShortcutEditor = function(notebook) {

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
    render(
        createElement(KeyBindingList, {
            callback:()=>{ return  get_shortcuts_data(notebook);},
            bind: (shortcut, command) => {
                return notebook.keyboard_manager.command_shortcuts._persist_shortcut(shortcut, command);
            },
            unbind: (shortcut) => { 
                return notebook.keyboard_manager.command_shortcuts._persist_remove_shortcut(shortcut);
            },
            available:  (shrt) => { return notebook.keyboard_manager.command_shortcuts.is_available_shortcut(shrt);}
          }),
        body.get(0)
    );
};
