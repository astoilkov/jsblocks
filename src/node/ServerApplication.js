define([
  '../core',
  './Middleware'
], function (blocks, Middleware) {
  var path = require('path');
  var express = require('express');

  function ServerApplication(options) {
    this._options = blocks.extend({}, ServerApplication.Defaults, options);
    this._app = express();
    this._middleware = new Middleware(options);

    this._init();
  }

  ServerApplication.Defaults = blocks.extend({}, Middleware.Defaults, {
    port: 8000
  });

  ServerApplication.prototype = {
    express: function () {
      return this._app;
    },

    _init: function () {
      var options = this._options;
      var app = this._app;
      var middleware = this._middleware;

      app.listen(options.port);

      app.use(express.static(path.resolve(options.static), {
        index: false
      }));

      app.get('/*', function (req, res, next) {
        middleware.tryServePage(req, res, next);
      });
    }
  };
});