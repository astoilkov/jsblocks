define([
  '../core',
  './Middleware'
], function (blocks, Middleware) {
  var path = require('path');
  var express = require('express');

  function Server(options) {
    this._options = blocks.extend({}, Server.Defaults, options);
    this._app = express();
    this._middleware = new Middleware(options);

    this._init();
  }

  Server.Defaults = blocks.extend({}, Middleware.Defaults, {
    port: 8000,
    use: null
  });

  Server.prototype = {
    express: function () {
      return this._app;
    },

    _init: function () {
      var options = this._options;
      var app = this._app;
      var middleware = this._middleware;

      app.listen(options.port);

      blocks.each(blocks.toArray(options.use), function (middleware) {
        app.use(middleware);
      });

      app.use(express.static(path.resolve(options.static), {
        index: false
      }));

      app.get('/*', function (req, res, next) {
        middleware.tryServePage(req, res, next);
      });
    }
  };
});