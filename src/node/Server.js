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
    _started: false,
    /**
     * Returns the express instance used by the blocks server internally.
     * When called synchronous directly after the server has been crated
     * pre middlewares can be added.
     * But the server will need to be started explicitly.
     * @return {object} the express app
     * @example {javascript}
     * var server = blocks.server();
     * var app = blocks.express();
     * app.use('/test', function (req, res) {
     *   res.json({some: 'test'});
     * });
     * // required for ssr to work now
     * server.start();
     */
    express: function () {
      this._delayStart = true;
      return this._app;
    },

    _init: function () {
      var options = this._options;
      var app = this._app;
      var self = this;

      app.listen(options.port);

      blocks.each(blocks.toArray(options.use), function (middleware) {
        if (blocks.isFunction(middleware)) {
          app.use(middleware);
        }
      });

      app.use(express.static(path.resolve(options.static), {
        index: false
      }));

      process.nextTick(function () {
        if (!self._delayStart) {
          self.start();
        }
      });

    },

    /**
     * Starts the ssr server.
     * Does not need to be called if server.express()
     * is not called.
     */
    start: function () {
      if (this._started) {
        return;
      }
      var middleware = this._middleware;
      this._app.get('/*', function (req, res, next) {
        middleware.tryServePage(req, res, next);
      });
      this._started = true;
    },

    /**
     * Returns if the server has been started.
     * @return {boolean}
     */
    started: function () {
      return this._started;
    }
  };
  return Server;
});