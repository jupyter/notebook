
def get_rendered_contents(nb):
    cl = ["text_cell", "render"]
    rendered_cells = [cell.find_element_by_class_name("text_cell_render") 
                      for cell in nb.cells 
                      if all([c in cell.get_attribute("class") for c in cl])]
    return [x.get_attribute('innerHTML').strip()
            for x in rendered_cells 
            if x is not None]

            
def test_markdown_cell(notebook):
    nb = notebook
    cell_text = ["# Foo",
                 '**Bar**',
                 '*Baz*',
                 '```\nx = 1\n```',
                 '```aaaa\nx = 1\n```',
                 ]
    expected_contents = ['<h1 id="Foo">Foo<a class="anchor-link" href="#Foo">¶</a></h1>',
                         '<p><strong>Bar</strong></p>',
                         '<p><em>Baz</em></p>', 
                         '<pre><code>x = 1</code></pre>',
                         '<pre><code class="cm-s-ipython language-aaaa">x = 1</code></pre>'
                         ]
    nb.append(*cell_text, cell_type="markdown")
    nb.run_all()
    rendered_contents = get_rendered_contents(nb)
    assert rendered_contents == expected_contents
