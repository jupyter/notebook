///<reference path="../components/phosphor/dist/phosphor.d.ts"/>

import nbformat = require("./nbformat");
import DOM = phosphor.virtualdom.dom;
import Component = phosphor.virtualdom.Component;
import BaseComponent = phosphor.virtualdom.BaseComponent;
import Elem = phosphor.virtualdom.Elem;
import createFactory = phosphor.virtualdom.createFactory;
import render = phosphor.virtualdom.render;
import IMessage = phosphor.core.IMessage;

var div = DOM.div;
var pre = DOM.pre;
var img = DOM.img;

class MimeBundleComponent extends Component<nbformat.MimeBundle> {
  render() {
    // possible optimization: iterate through 
    var x: string | string[];
    if (x = this.data["image/png"]) {
      return img({src:"data:image/png;base64,"+x})
    } else if (x = this.data["image/jpg"]) {
      return img({src:"data:image/jpg;base64,"+x})
    } else if (x = this.data["text/plain"]) {
      return pre(typeof x === "string" ? x : x.join('\n'));
    }
  }
}
export var MimeBundle = createFactory(MimeBundleComponent);

class ExecuteResultComponent extends Component<nbformat.ExecuteResult> {
  render() {
    return MimeBundle(this.data.data);
  }
}
export var ExecuteResult = createFactory(ExecuteResultComponent);

class DisplayDataComponent extends Component<nbformat.DisplayData> {
  render() {
    return MimeBundle(this.data.data);
  }
}
export var DisplayData = createFactory(DisplayDataComponent);

class StreamComponent extends Component<nbformat.Stream> {
  render() {
    return pre(this.data.text.join('\n'));
  }
}
export var Stream = createFactory(StreamComponent);
//export var x;

class JupyterErrorComponent extends Component<nbformat.JupyterError> {
  render() {
    var o = this.data;
    return pre(o.ename+'\n'+o.evalue+'\n'+(o.traceback.join('\n')));
  }
}
export var JupyterError = createFactory(JupyterErrorComponent)

class MarkdownCellComponent extends BaseComponent<nbformat.MarkdownCell> {
  onUpdateRequest(msg: IMessage): void {
    // replace the innerHTML of the node with the rendered markdown
    var x = this.data.source;
    this.node.innerHTML = marked(typeof x === "string" ? x : x.join(''));
  }
}
export var MarkdownCell = createFactory(MarkdownCellComponent)


/**   
 * We inherit from BaseComponent so that we can explicitly control the rendering.  We want to use the virtual dom to render
 * the output, but we want to explicitly manage the code editor.
*/
class CodeCellComponent extends BaseComponent<nbformat.CodeCell> {

  constructor(data: nbformat.CodeCell, children: Elem[]) {
    super(data, children);
    this.editor_node = document.createElement('div');
    this.editor_node.classList.add("ipy-input")
    this.output_node = document.createElement('div');
    this.node.appendChild(this.editor_node);
    this.node.appendChild(this.output_node);

    var x = this.data.source;
    this._editor  = CodeMirror(this.editor_node, {
      mode: 'python', 
      value: typeof x === "string" ? x : x.join(""),
      lineNumbers: true})
  }

  protected onUpdateRequest(msg: IMessage): void {
    var x = this.data.source;
    // we could call setValue on the editor itself, but the dts file doesn't recognize it.
    this._editor.getDoc().setValue(typeof x === "string" ? x : x.join(""));
    // we may want to save the refs at some point
    render(this.renderOutput(), this.output_node);
  }

  protected onAfterAttach(msg: IMessage): void {
    this._editor.refresh();
  }
  renderOutput(): Elem[] {
    var r: Elem[] = [];
    var outputs: nbformat.Output[] = this.data.outputs;
    for(var i = 0; i < outputs.length; i++) {
      var x = outputs[i];
      switch(x.output_type) {
        case "execute_result": 
          r.push(ExecuteResult(<nbformat.ExecuteResult>x)); 
          break;
        case "display_data": 
          r.push(DisplayData(<nbformat.DisplayData>x)); 
          break;
        case "stream": 
          r.push(Stream(<nbformat.Stream>x)); 
          break;
        case "error": 
          r.push(JupyterError(<nbformat.JupyterError>x)); 
          break;
      }
    }
    return r;
  }

  editor_node: HTMLElement;
  output_node: HTMLElement;
  _editor: CodeMirror.Editor;
}
export var CodeCell = createFactory(CodeCellComponent);

class NotebookComponent extends Component<nbformat.Notebook> {
  render() {
    var cells = this.data.cells;
    var r: Elem[] = [];
    for(var i = 0; i < cells.length; i++) {
      var c = cells[i];
      switch(c.cell_type) {
        case "code":
          r.push(CodeCell(<nbformat.CodeCell>c));
          break;
        case "markdown":
          r.push(MarkdownCell(<nbformat.MarkdownCell>c));
          break;
        }
    }
    return r;
  }
}
export var Notebook = createFactory(NotebookComponent);
