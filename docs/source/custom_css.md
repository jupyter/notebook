# Applying Custom CSS

To apply custom CSS, you can add a `/custom/custom.css` file in the jupyter `config` directory. You can find the path, `~/.jupyter`, to this directory by running `jupyter --paths`. There you can create a folder named `custom` and create a `custom.css` file within the folder.

## Jupyter Styling

You can use a custom CSS file to modify default Jupyter styling.

```css
/* Modify Jupyter Styles */
#top-panel-wrapper,
#jp-top-bar {
  background-color: #aecad4 !important;
}

#menu-panel-wrapper,
#jp-MainMenu,
#menu-panel {
  background-color: #aecad4 !important;
}

.jp-NotebookPanel-toolbar {
  background-color: #aecad4 !important;
}
.lm-MenuBar-content {
  color: #02484d;
}
```

![a screenshot custom jupyter styling](https://user-images.githubusercontent.com/12378147/245519958-17ce04e7-edc2-434e-8d93-a5c2de9fb225.png)

## Markdown

Another potential application for custom CSS is styling markdown.

```css
/* Headings */
h1,
h2 {
  font-family: Impact, Charcoal, sans-serif;
  font-weight: bold;
  text-shadow: 2px 2px 4px #000000;
}

h1 {
  font-size: 52px;
  margin-bottom: 40px;
  color: #10929e;
  text-decoration: underline;
}

h2 {
  font-size: 448px;
  margin-bottom: 32px;
  color: #76b4be;
  text-transform: uppercase;
}

/* Block Quotes */
blockquote {
  font-family: Georgia, serif;
  font-size: 16px;
  color: #19085c;
  border-left: 8px solid #effffc;
  background-color: #eafcff;
  padding: 20px;
}

/* Lists */
ul,
ol {
  font-family: Verdana, Geneva, sans-serif;
  font-size: 18px;
  color: #333333;
  margin-bottom: 24px;
}
```

![a screenshot of custom markdown styling](https://user-images.githubusercontent.com/12378147/245520291-968848d3-d336-4523-a046-023b15082ff8.png)
