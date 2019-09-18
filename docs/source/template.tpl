{%- extends 'rst.tpl' -%}

{% macro notebooklink() -%}

`View the original notebook on nbviewer <https://nbviewer.jupyter.org/github/jupyter/notebook/blob/master/docs/{{ resources['metadata']['path'] }}/{{ resources['metadata']['name'] | replace(' ', '%20') }}.ipynb>`__


{%- endmacro %}

{%- block header %}
{{ notebooklink() }}
{% endblock header -%}

{%- block footer %}
{{ notebooklink() }}
{% endblock footer -%}

{% block markdowncell scoped %}
{{ cell.source | markdown2rst | replace(".ipynb>", ".html>") }}
{% endblock markdowncell %}
