define([
  '../core',
  './BrowserEnv'
], function (blocks, BrowserEnv) {
  var path = require('path');
  var fs = require('fs');
  var express = require('express');

  function ServerApplication(options) {
    this._options = blocks.extend({}, ServerApplication.Defaults, options);
    this._app = express();

    this._init();
  }

  ServerApplication.Defaults = {
    port: 3000,
    staticFolder: 'public',
    blocksPath: 'auto-include', // 'auto-find'
    pages: 'auto',
    cache: 'smart'
  };

  ServerApplication.prototype = {
    expressApp: function () {
      return this._app;
    },

    _init: function () {
      var options = this._options;
      var app = this._app;
      var pages = [];
      var engine = this._engine = blocks.createEngine({
        staticFolder: options.staticFolder,
        blocksPath: options.blocksPath,
        cache: options.cache
      });

      app.listen(options.port);

      app.engine('html', engine);

      app.set('view engine', 'html');

      app.use(express.static(path.join(__dirname, options.staticFolder)));

      this._initPages();
    },

    _initPages: function () {
      var pages = this._options.pages;
      var routes = this._options.routes;
      var app = this._app;

      if (pages == 'auto') {
        pages = this._findPages();
      }

      blocks.each(pages, function (page, index) {
        pages[index] = page = page.replace(/.html$/, '');
        var route = page;

        if (page == 'index') {
          route = '';
        }

        app.get('/' + route, function (req, res) {
          res.render(page, {
            req: req,
            res: res
          });
        });
      });

      blocks.each(routes, function (route, page) {
        app.get(route, function (req, res) {
          res.render(page, {
            req: req,
            res: res
          });
        });
      });
    },

    _findPages: function () {
      var views = fs.readdirSync('views');
      var pages = [];

      blocks.each(views, function (fileName) {
        if (blocks.endsWith(fileName, '.html')) {
          pages.push(fileName);
        }
      });

      return pages;
    }
  };
});