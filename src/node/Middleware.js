define([
  '../core',
  './findPageScripts',
  './executePageScripts',
  './BrowserEnv'
], function (blocks, findPageScripts, executePageScripts, BrowserEnv) {
  var fs = require('fs');
  var path = require('path');

  function Middleware(options) {
    if (blocks.isString(options)) {
      options = {
        staticFolder: options
      };
    }

    this._options = blocks.extend({}, Middleware.Defaults, options);
    this._contents = '';
    this._scripts = [];
    this._cache = {};
    this._initialized = false;

    this._initialize();
  }

  Middleware.Defaults = {
    staticFolder: 'app',
    blocksPath: 'node_modues/blocks/blocks.js',
    cache: true
  };

  Middleware.prototype = {
    tryServePage: function (req, res, next) {
      this._renderContents(req, function (err, contents) {
        if (err && (err != 'no query' || req.url != '/')) {
          next();
        } else {
          res.send(contents);
        }
      });
    },

    _initialize: function () {
      var _this = this;
      var url = path.join(this._options.staticFolder, '/index.html');

      fs.readFile(url, { encoding: 'utf-8' }, function (err, contents) {
        if (!err) {
          _this._setContents(contents);
        }
      });
    },

    _setContents: function (contents) {
      var _this = this;

      this._contents = contents;

      findPageScripts(contents, this._options.staticFolder, function (scripts) {
        _this._scripts = scripts;
        _this._initialized = true;
      });
    },

    _renderContents: function (req, callback) {
      var cache = this._cache;
      var location = this._getLocation(req);
      var env;

      if (!this._initialized) {
        callback('not initialized', null);
      } else if (this._options.cache && cache[location]) {
        callback(null, cache[location]);
      } else {
        env = this._createEnv(req);
        executePageScripts(env, this._scripts, this._pageExecuted.bind(this, callback, env.location));
      }
    },

    _pageExecuted: function (callback, location, err, contents) {
      if (!err && this._options.cache) {
        this._cache[location] = contents;
      }
      callback(err, contents);
    },

    _createEnv: function (req) {
      var server = {
        options: this._options,
        html: this._contents,
        data: {},
        rendered: '',
        applications: []
      };

      return blocks.extend({ server: server }, this._createBrowserEnv(req));
    },

    _createBrowserEnv: function (req) {
      var browserEnv = BrowserEnv.Create();

      browserEnv.fillLocation(this._getLocation(req));

      return browserEnv.getObject();
    },

    _getLocation: function (req) {
      return req.protocol + '://' + req.get('host') + req.url;
    }
  };
});