define([
  './createBrowserEnvObject'
], function (createBrowserEnvObject) {
  var url = require('url');

  function BrowserEnv() {
    var env = createBrowserEnvObject();
    this._env = env;

    this._initialize();
  }

  BrowserEnv.Create = function () {
    return new BrowserEnv();
  };

  BrowserEnv.prototype = {
    getObject: function () {
      return this._env;
    },

    fillLocation: function (fullUrl) {
      var props = url.parse(fullUrl);
      var copy = 'host hostname href pathname protocol'.split(' ');
      var location = this._env.window.location;

      blocks.each(copy, function (name) {
        location[name] = props[name];
      });
    },

    addElementsById: function (elementsById) {
      var env = this._env;
      env.document.__elementsById__ = elementsById;
      blocks.each(elementsById, function (element, id) {
        env[id] = element;
      });
    },

    _initialize: function () {
      var env = this._env;
      var document = env.document;

      document.getElementById = function (id) {
        return (document.__elementsById__ || {})[id] || null;
      };
    }
  };
});