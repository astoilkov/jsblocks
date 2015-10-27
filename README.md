# [![jsblocks](http://jsblocks.com/img/logoBeta.png)](http://jsblocks.com?ref=github_readme) &nbsp;&nbsp; [![Build Status](https://travis-ci.org/astoilkov/jsblocks.svg?branch=master)](https://travis-ci.org/astoilkov/jsblocks)

### Better MV-ish Framework

##### From simple user interfaces to complex single-page applications using faster, server-side rendered and easy to learn framework.

[[ official website ]](http://jsblocks.com?ref=github_readme)


> I am also working on a [Markdown Editor](http://caret.io?ref=jsblocks). I will appreciate it if you check it out and [tell me](mailto:antonio.stoilkov@gmail.com) what you think.

### Features

 * [Server-side rendering](http://jsblocks.com/learn/introduction-why-jsblocks#server-side-rendering?ref=github_readme)
 * [Debugging experience](http://jsblocks.com/learn/introduction-why-jsblocks#debugging-experience?ref=github_readme)
 * [Faster](http://jsblocks.com/#performance?ref=github_readme)
 * [MV-ish](http://jsblocks.com/learn/introduction-why-jsblocks#mv-ish?ref=github_readme)
 * [Modular](http://jsblocks.com/learn/introduction-why-jsblocks#modular?ref=github_readme)
 * [Built-in utility library](http://jsblocks.com/learn/introduction-why-jsblocks#built-in-utility-library?ref=github_readme)
 * [Forward thinking](http://jsblocks.com/learn/introduction-why-jsblocks#forward-thinking?ref=github_readme)
 * [... and many more](http://jsblocks.com/learn/introduction-why-jsblocks#feature-rich?ref=github_readme)

### Getting started

Just copy and paste the code below for your first jsblocks application.
Continue with the [documentation](http://jsblocks.com/learn?ref=github_readme)
and the [jsblocks starter template project](https://github.com/astoilkov/jsblocks-seed)

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="http://jsblocks.com/blocks/0.3.2/blocks.js"></script>
    <script>
      blocks.query({
        firstName: blocks.observable()
      });
    </script>
  </head>
  <body>
    Name:
    <input data-query="val(firstName)" placeholder="Enter your name here" />
    <hr />
    <h1>Hello {{firstName}}!</h1>
  </body>
</html>
```

### Example projects
 * [TodoMVC](https://github.com/astoilkov/jsblocks-todomvc)
 * [E-shopping](https://github.com/astoilkov/jsblocks-shopping-example)

### Ask a question
 * [Gitter](https://gitter.im/astoilkov/jsblocks?utm_source=github_link)
 * [Github Issue](https://github.com/astoilkov/jsblocks/issues/new)

### Contribute
 * Documentation can be found under [jsblocks-docs](https://github.com/astoilkov/jsblocks-docs)
