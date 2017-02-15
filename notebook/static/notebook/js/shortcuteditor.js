// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

define([
    "jquery",
    "notebook/js/quickhelp",
    "base/js/dialog",
    'components/marked/lib/marked',
], function (
    $,
    QH,
    dialog,
    marked
) {
    var render = preact.render;
    var createClass = preactCompat.createClass;
    var createElement = preactCompat.createElement;


/**
 * Humanize the action name to be consumed by user.
 * internally the actions name are of the form
 * <namespace>:<description-with-dashes>
 * we drop <namespace> and replace dashes for space.
 */
var humanize_action_id = function(str) {
  return str.split(':')[1].replace(/-/g, ' ').replace(/_/g, '-');
};

/**
 * given an action id return 'command-shortcut', 'edit-shortcut' or 'no-shortcut'
 * for the action. This allows us to tag UI in order to visually distinguish
 * Wether an action have a keybinding or not.
 **/

var KeyBinding = createClass({
  displayName: 'KeyBindings',
  getInitialState: function() {
    return {shrt:''};
  },
  handleShrtChange: function (element){
    this.setState({shrt:element.target.value});
  },
  render: function(){
    var that = this;
    var available = this.props.available(this.state.shrt);
    var empty = (this.state.shrt === '');
    var binding_setter = function(){
      if (available) { 
        that.props.onAddBindings(that.state.shrt, that.props.ckey);
      }
      that.state.shrt='';
      return false;
    };
    return createElement('form', {className:'jupyter-keybindings',
            onSubmit: binding_setter
        },
              createElement('i', {className: "pull-right fa fa-plus", alt: 'add-keyboard-shortcut',
                  onClick: binding_setter
              }),
              createElement('input', {
                                      type:'text', 
                               placeholder:'add shortcut', 
                                 className:'pull-right'+((available||empty)?'':' alert alert-danger'),
                                     value:that.state.shrt,
                                  onChange:that.handleShrtChange
              }),
              that.props.shortcuts ? that.props.shortcuts.map(function (item, index) {
                return createElement('span', {className: 'pull-right'},
                  createElement('kbd', {}, [
                    item.h,
                    createElement('i', {className: "fa fa-times", alt: 'remove '+item.h,
                      onClick:function () {
                        that.props.unbind(item.raw);
                      }
                    })
                  ])
                );
              }): null,
              createElement('div', {title: '(' + that.props.ckey + ')' ,
                className:'jupyter-keybindings-text'}, that.props.display )
      );
  }
});

var KeyBindingList = createClass({
  displayName: 'KeyBindingList',
  getInitialState: function(){
    return {data:[]};
  },
  componentDidMount: function(){
      this.setState({data:this.props.callback()});
  },
  render: function() {
      var that = this;
      var childrens = this.state.data.map(function (binding) {
          return createElement(KeyBinding, Object.assign({}, binding, {
          onAddBindings: function (shortcut, action) {
              that.props.bind(shortcut, action);
              that.setState({data:that.props.callback()});
          },
          available: that.props.available,
          unbind: function (shortcut) {
                  that.props.unbind(shortcut);
                  that.setState({data:that.props.callback()});
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
            "Valid modifiers are `Cmd`, `Ctrl`, `Alt` ,`Meta`, `Cmdtrl`. Refer to developer docs "+
            "for the corresponding keys depending on the platform."+
            "You can hover on the name/description of a command to see its exact internal name and "+
            "differentiate from actions defined in various plugins. Changing the "+
            "keybindings of edit mode is not yet possible."
            )}
      }));
      return createElement('div',{}, childrens);
    }
});

var get_shortcuts_data = function(notebook) {
    var actions = Object.keys(notebook.keyboard_manager.actions._actions);
    var src = [];

    for (var i = 0; i < actions.length; i++) {
      var action_id = actions[i];
      var action = notebook.keyboard_manager.actions.get(action_id);

      var shortcuts = notebook.keyboard_manager.command_shortcuts.get_action_shortcuts(action_id);
      var hshortcuts = [];
      if (shortcuts.length > 0) {
        hshortcuts = shortcuts.map(function (raw) {
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


var ShortcutEditor = function(notebook) {

    if(!notebook){
      throw new Error("CommandPalette takes a notebook non-null mandatory argument");
    }

    var body =  $('<div>');
    var mod = dialog.modal({
        notebook: notebook,
        keyboard_manager: notebook.keyboard_manager,
        title : "Edit Command mode Shortcuts",
        body : body,
        buttons : {
            OK : {}
        }
    });
    
    var src = get_shortcuts_data(notebook);

    mod.addClass("modal_stretch");

    mod.modal('show');
    render(
        createElement(KeyBindingList, {
            callback: function () { return  get_shortcuts_data(notebook);},
            bind: function (shortcut, command) {
                return notebook.keyboard_manager.command_shortcuts._persist_shortcut(shortcut, command);
            },
            unbind: function (shortcut) {
                return notebook.keyboard_manager.command_shortcuts._persist_remove_shortcut(shortcut);
            },
            available: function (shrt) { return notebook.keyboard_manager.command_shortcuts.is_available_shortcut(shrt);}
          }),
        body.get(0)
    );
};
    return {ShortcutEditor: ShortcutEditor};
});
