import NotebookApp = require("./app");
import NotebookComponent = require("./NotebookComponent");
import render = phosphor.virtualdom.render;
import demo = require("./demodata")
import mathjaxutils = require("./mathjaxutils");
export function main(): void {
    //    var notebook = new NotebookApp.NotebookApplication;
    // notebook.run();
    var test = document.getElementById('test');
    mathjaxutils.init();
    render(NotebookComponent.Notebook(demo.notebook), test);
};
