define([
  './createBrowserEnvObject'
], function (createBrowserEnvObject) {
  var url = require('url');

  function BrowserEnv() {
    this._object = createBrowserEnvObject();
  }

  BrowserEnv.Create = function () {
    return new BrowserEnv();
  };

  BrowserEnv.prototype = {
    getObject: function () {
      return this._object;
    },

    fillLocation: function (fullUrl) {
      var props = url.parse(fullUrl);
      var copy = 'host hostname href pathname protocol'.split(' ');
      var location = this._object.window.location;

      blocks.each(copy, function (name) {
        location[name] = props[name];
      });
    }
  };
});