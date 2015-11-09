//
// Test cell attachments
//
var fs = require('fs');
casper.notebook_test(function () {
    // Test the Edit->Insert Image menu to insert new attachments
    "use strict";
    casper.test.info("Testing attachments insertion through the menuitem");

    this.viewport(1024, 768);

    // Click on menuitem
    var selector = '#insert_image > a';
    this.waitForSelector(selector);
    this.thenEvaluate(function(sel) {
        IPython.notebook.to_markdown();
        var cell = IPython.notebook.get_selected_cell();
        cell.set_text("");
        cell.unrender();

        $(sel).click();
    }, selector);
    // Wait for the dialog to be shown
    this.waitUntilVisible(".modal-body");
    this.wait(200);

    // Select the image file to insert

    // For some reason, this doesn't seem to work in a reliable way in
    // phantomjs. So we manually set the input's files attribute
    //this.page.uploadFile('.modal-body input[name=file]', 'test.png')
    this.then(function() {
        var fname = 'notebook/tests/_testdata/black_square_22.png';
        if (!fs.exists(fname)) {
            this.test.fail(
                " does not exist, are you running the tests " +
                "from the root directory ? "
            );
        }
        this.fill('form#insert-image-form', {'file': fname});
    });

    // Validate and render the markdown cell
    this.thenClick('#btn_ok');
    this.thenEvaluate(function() {
        IPython.notebook.get_cell(0).render();
    });
    this.wait(300);
    // Check that an <img> tag has been inserted and that it contains the
    // image
    this.then(function() {
        var img = this.evaluate(function() {
            var cell = IPython.notebook.get_cell(0);
            var img = $("div.text_cell_render").find("img");
            return {
                src: img.attr("src"),
                width: img.width(),
                height: img.height(),
            };
        });
        this.test.assertType(img, "object", "Image('image/png')");
        this.test.assertEquals(img.src.split(',')[0],
                               "data:image/png;base64",
                               "Image data-uri prefix");
        this.test.assertEquals(img.width, 2, "width == 2");
        this.test.assertEquals(img.height, 2, "height == 2");
    });

    //this.then(function() {
        //this.capture('test.png');
    //});
});

