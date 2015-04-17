module Notebook {

    import NotebookApp = require("app");

    function main(): void {
        var notebook = new NotebookApp.NotebookApplication;
        notebook.run();
    };

    window.onload = main;
}