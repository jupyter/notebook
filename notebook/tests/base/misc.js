
//
// Miscellaneous javascript tests
//
casper.notebook_test(function () {
    console.log('b');
    var jsver = this.evaluate(function () {
        console.log('a');
        var cell = IPython.notebook.get_cell(0);
            console.log('a2');
        cell.set_text('import notebook; print(notebook.__version__)');
            console.log('a3');
        cell.execute();
            console.log('a4');
        return IPython.version;
    });

    console.log('b2');
    this.wait_for_output(0);

    // refactor this into  just a get_output(0)
    console.log('b3');
    this.then(function () {
    console.log('c');
        var result = this.get_output_cell(0);
        console.log('c2');
        this.test.assertEquals(result.text.trim(), jsver, 'IPython.version in JS matches server-side.');
        console.log('c3');
    });
    console.log('b4');

});
