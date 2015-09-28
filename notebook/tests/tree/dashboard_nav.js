

casper.get_list_items = function () {
    return this.evaluate(function () {
        return $.makeArray($('.item_link').map(function () {
            return {
                link: $(this).attr('href'),
                label: $(this).find('.item_name').text()
            };
        }));
    });
};

casper.test_items = function (origin, prefix, visited) {
    visited = visited || {};
    casper.then(function () {
        var items = casper.get_list_items();
        var tree_link = RegExp('^' + (prefix + 'tree/').replace(/\//g, '\\/'));
        casper.each(items, function (self, item) {
            if (item.link.match(tree_link)) {
                var followed_url = item.link;
                if (!visited[followed_url]) {
                    visited[followed_url] = true;
                    casper.thenOpen(origin + followed_url, function () {
                        this.waitFor(this.page_loaded);
                        casper.wait_for_dashboard();
                        // getCurrentUrl is with host, and url-decoded,
                        // but item.link is without host, and url-encoded
                        var expected = origin + decodeURIComponent(item.link);
                        this.test.assertEquals(this.getCurrentUrl(), expected, 'Testing dashboard link: ' + expected);
                        casper.test_items(origin, prefix, visited);
                        this.back();
                    });
                }
            }
        });
    });
};

casper.dashboard_test(function () {
    var baseUrl = this.get_notebook_server();
    m = /(https?:\/\/[^\/]+)(.*)/.exec(baseUrl);
    origin = m[1];
    prefix = m[2];
    casper.test_items(origin, prefix);
});

