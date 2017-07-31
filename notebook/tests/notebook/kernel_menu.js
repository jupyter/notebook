
casper.notebook_test(function () {
    var that = this;

    var menuItems = ['#restart_kernel', '#restart_clear_output', '#restart_run_all', '#shutdown_kernel']
    var cancelSelector = ".modal-footer button:first-of-type"

    menuItems.forEach( function(selector) {
        that.thenClick(selector);
        that.waitForSelector(cancelSelector);
        that.thenClick(cancelSelector);

        that.waitWhileSelector(".modal-content", function() {
            that.test.assert(true, selector + " confirmation modal pops up and is cancelable");
        });
    });

    var shutdownSelector = menuItems.pop();
    var confirmSelector = ".modal-footer .btn-danger"

    menuItems.forEach( function(selector) {
        that.thenClick(shutdownSelector);
        that.waitForSelector(confirmSelector);
        that.thenClick(confirmSelector);

        // wait for shutdown to go through
        that.waitFor(function() { return this.evaluate(function() {
            return IPython.notebook.kernel.is_connected() === false;
        })});

        // Click on one of the restarts
        that.thenClick(selector);

        //  Kernel should get connected, no need for confirmation.
        that.waitFor(function() { return this.evaluate(function() {
                return IPython.notebook.kernel.is_connected() === true;
        })});
        that.then(function() {
            that.test.assert(true, "no confirmation for " + selector + " after session shutdown")
        })
    });

});

