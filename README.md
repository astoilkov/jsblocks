# jsblocks

Better MV-ish Framework

Build simple user interfaces or complex single-page applications using fast, server-side rendered and easy to learn framework.

[[ official website ]](http://104.131.138.38)

### Features

 * [Server-side rendering](http://104.131.138.38/learn/introduction-why-jsblocks#server-side-rendering)
 * [Debugging experience](http://104.131.138.38/learn/introduction-why-jsblocks#debugging-experience)
 * [Faster](http://104.131.138.38/#performance)
 * [MV-ish](http://104.131.138.38/learn/introduction-why-jsblocks#mv-ish)
 * [Modular](http://104.131.138.38/learn/introduction-why-jsblocks#modular)
 * [Built-in utility library](http://104.131.138.38/learn/introduction-why-jsblocks#built-in-utility-library)
 * [Forward thinking](http://104.131.138.38/learn/introduction-why-jsblocks#forward-thinking)
 * [... and many more](http://104.131.138.38/learn/introduction-why-jsblocks#feature-rich)

### Getting started

 * include it in your page or [download](http://104.131.138.38/blocks.js) it

```html
<script src="http://104.131.138.38/blocks.js"></script>
```

 * start with the example below or [read the documentation](http://104.131.138.38/learn)

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="http://104.131.138.38/blocks.js"></script>
    <script>
      blocks.query({
        name: blocks.observable()
      });
    </script>
  </head>
  <body>
    Name:
    <input data-query="val(name)" placeholder="Enter your name here" />
    <hr />
    <h1>Hello {{name}}!</h1>
  </body>
</html>
```
