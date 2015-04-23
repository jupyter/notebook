///<reference path="../components/phosphor/dist/phosphor.d.ts"/>

import nbformat = require("./nbformat");

    import DOM = phosphor.virtualdom.dom;
    import Component = phosphor.virtualdom.Component;
    import Elem = phosphor.virtualdom.Elem;    import createFactory = phosphor.virtualdom.createFactory;
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

class CodeCellComponent extends Component<nbformat.CodeCell> {
  render(): Elem[] {
    var outputs: nbformat.Output[] = this.data.outputs;
    var r: Elem[] = []; // TODO: how do I type r?
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
        }
    }
    return r;
  }
}
export var Notebook = createFactory(NotebookComponent);
