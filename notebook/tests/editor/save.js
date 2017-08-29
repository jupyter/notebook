//
// Test prompt when overwriting a file that is modified on disk
//

casper.editor_test(function () {
    var fname = "has#hash and space and unicø∂e.py";
    
    this.append_cell("s = '??'", 'code');
    
    this.thenEvaluate(function (nbname) {
        require(['base/js/events'], function (events) {
            IPython.editor.set_notebook_name(nbname);
            IPython._save_success = IPython._save_failed = false;
            events.on('file_saved.Editor', function () {
                IPython._save_success = true;
            });
            IPython.notebook.save_notebook();
        });
    }, {nbname:nbname});
    
    this.waitFor(function () {
        return this.evaluate(function(){
            return IPython._save_failed || IPython._save_success;
        });
    });
    
    this.thenEvaluate(function(){
        IPython._checkpoint_created = false;
        require(['base/js/events'], function (events) {
            events.on('checkpoint_created.Notebook', function (evt, data) {
                IPython._checkpoint_created = true;
            });
        });
        IPython.notebook.save_checkpoint();
    });
    
    this.waitFor(function() {
        return this.evaluate(function () {
            return IPython && IPython.notebook && true;
        });
    });
    
});
