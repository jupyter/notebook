

// Test
casper.notebook_test(function () {
    this.append_cell('1');
    this.append_cell('2');
    this.append_cell('3');
    this.append_cell('4');
    this.append_cell('a5');
    this.append_cell('b6');
    this.append_cell('c7');
    this.append_cell('d8');



    this.then(function () {
         // Copy/paste/cut
        this.select_cell(1);
        this.select_cell(3, false);

        this.trigger_keydown('c'); // Copy

        this.select_cell(6)
        this.select_cell(7,false)

        this.evaluate(function () {
            $("#paste_cell_replace").click();
        });

        var expected_state = ['', '1', '2', '3', '4', 'a5', '1' ,'2' ,'3', 'd8'];

        for (var i=1; i<expected_state.length; i++){
            this.test.assertEquals(this.get_cell_text(i), expected_state[i],
                    'Verify that cell `' + i +  '` has for content: `'+ expected_state[i] + '` found : ' + this.get_cell_text(i)
            );
        }

        this.validate_notebook_state('paste-replace', 'command', 8)

    });
});
