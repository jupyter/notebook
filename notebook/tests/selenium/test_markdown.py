from nbformat.v4 import new_markdown_cell

def get_rendered_contents(nb):
    cl = ["text_cell", "render"]
    rendered_cells = [cell.find_element_by_class_name("text_cell_render") 
                      for cell in nb.cells 
                      if all([c in cell.get_attribute("class") for c in cl])]
    return [x.get_attribute('innerHTML').strip()
            for x in rendered_cells 
            if x is not None]

            
def test_markdown_cell(prefill_notebook):
    nb = prefill_notebook([new_markdown_cell(md) for md in [
        '# Foo', '**Bar**', '*Baz*', '```\nx = 1\n```', '```aaaa\nx = 1\n```',
    ]])

    assert get_rendered_contents(nb) == [
        '<h1 id="Foo">Foo<a class="anchor-link" href="#Foo">¶</a></h1>',
        '<p><strong>Bar</strong></p>',
        '<p><em>Baz</em></p>',
        '<pre><code>x = 1</code></pre>',
        '<pre><code class="cm-s-ipython language-aaaa">x = 1</code></pre>',
    ]
