///<reference path="../components/phosphor/dist/phosphor.d.ts"/>

/* TODO:

For executing, need:

* kernelselector
* session
* kernel
* comm


*/


import nbformat = require("./nbformat");
import mathjaxutils = require("./mathjaxutils");
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
      return pre(x);
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
    return pre(this.data.text);
  }
}
export var Stream = createFactory(StreamComponent);

class JupyterErrorComponent extends Component<nbformat.JupyterError> {
  render() {
    var o = this.data;
    return pre(o.ename+'\n'+o.evalue+'\n'+(o.traceback.join('\n')));
  }
}
export var JupyterError = createFactory(JupyterErrorComponent)

// customized renderer example from marked.js readme
var renderer = new (<any>marked).Renderer();
renderer.heading = function (text: string, level: number) {
  var escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');
  return `<h${level} id="${escapedText}">${text}<a class="anchor-link" href="#${escapedText}">¶</a></h${level}>`;
}

renderer.unescape = function(html: string): string {
  // from https://github.com/chjj/marked/blob/2b5802f258c5e23e48366f2377fbb4c807f47658/lib/marked.js#L1085
  return html.replace(/&([#\w]+);/g, function(_, n) {
    n = n.toLowerCase();
    if (n === 'colon') return ':';
    if (n.charAt(0) === '#') {
      return n.charAt(1) === 'x'
        ? String.fromCharCode(parseInt(n.substring(2), 16))
        : String.fromCharCode(+n.substring(1));
    }
    return '';
  });
}

renderer.check_url = function(href: string): boolean {
    try {
        var prot = decodeURIComponent(this.unescape(href))
            .replace(/[^\w:]/g, '')
            .toLowerCase();
    } catch (e) {
        return false;
    }
    if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0) {
        return false;
    }
    return true;
};

renderer.link = function(href: string, title: string, text: string) {
    //modified from the mark.js source to open all urls in new tabs
    if (this.options.sanitize && !this.check_url(href)) {
        return '';
    }
    return `<a href="${href}" ${title ? `title="${title}"` : ""} ${href[0] !== "#" ? "target=_blank" : ""}>${text}</a>`;
};

class MarkdownCellComponent extends BaseComponent<nbformat.MarkdownCell> {
  onUpdateRequest(msg: IMessage): void {
    // replace the innerHTML of the node with the rendered markdown
    var t = mathjaxutils.remove_math(this.data.source);
    marked(t.html, { sanitize: true, renderer: renderer}, (err: any, html: string) => {
        this.node.innerHTML = mathjaxutils.replace_math(html, t.math);
        // TODO: do some serious sanitization, using, for example, the caja sanitizer
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, this.node]);
    });
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

    this._editor  = CodeMirror(this.editor_node, {
      mode: 'python', 
      value: this.data.source,
      lineNumbers: true})
  }

  protected onUpdateRequest(msg: IMessage): void {
    // we could call setValue on the editor itself, but the dts file doesn't recognize it.
    this._editor.getDoc().setValue(this.data.source);
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
