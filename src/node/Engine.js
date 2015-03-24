define([
  './findPageScripts',
  './executePageScripts',
  './BrowserEnv'
], function (findPageScripts, executePageScripts, BrowserEnv) {
  var fs = require('fs');
  var url = require('url');

  function Engine(options) {
    this._options = options;
    this._cache = {};
    this._callback = null;
    this._locals = null;
  }

  Engine.Create = function (options) {
    var engine = new Engine(options);
    return function (filePath, options, callback) {
      engine.render(filePath, options, callback);
    };
  };

  Engine.prototype = {
    render: function (filePath, options, callback) {
      var cachedPage = this._cache[filePath];

      this._renderOptions = options;
      this._callback = callback;

      if (this._options.cache && cachedPage) {
        callback(null, cachedPage);
      } else {
        this._renderFile(filePath);
      }
    },

    _renderFile: function (filePath) {
      var _this = this;
      fs.readFile(filePath, { encoding: 'utf-8' }, function (err, contents) {
        _this._renderContents(contents);
      });
    },

    _renderContents: function (contents, filePath) {
      var browserEnv = this._createBrowserEnv();
      var callback = this._callback;
      var cache = this._cache;

      findPageScripts(contents, function (scripts) {
        var htmlResult = executePageScripts(browserEnv, contents, scripts);
        callback(null, htmlResult);
        if (filePath) {
          cache[filePath] = htmlResult;
        }
      });
    },

    _createBrowserEnv: function () {
      var browserEnv = BrowserEnv.Create();
      var req = this._renderOptions.req;

      browserEnv.fillLocation(req.protocol + '://' + req.get('host') + req.url);

      return browserEnv;
    }
  };

  return Engine;
});