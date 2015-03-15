define([
  './findPageScripts',
  './executePageScripts',
  './BrowserEnv'
], function (findPageScripts, executePageScripts, BrowserEnv) {
  var fs = require('fs');
  var url = require('url');

  function Engine(options) {
    this._options = options;
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
      this._renderOptions = options;
      this._callback = callback;

      this._renderFile(filePath);
    },

    _renderFile: function (filePath) {
      var _this = this;
      fs.readFile(filePath, { encoding: 'utf-8' }, function (err, contents) {
        _this._renderContents(contents);
      });
    },

    _renderContents: function (contents) {
      var browserEnv = this._createBrowserEnv();
      var callback = this._callback;

      findPageScripts(contents, function (scripts) {
        var htmlResult = executePageScripts(browserEnv, contents, scripts);
        callback(null, htmlResult);
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