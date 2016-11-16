define([
  './createBrowserEnvObject',
  '../core'
], function (createBrowserEnvObject, blocks) {
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
    setBaseUrl: function (url) {
      if (url) {
        this._env.__baseUrl__ = url;
      }
    },
    addElementsById: function (elementsById) {
      var env = this._env;
      env.document.__elementsById__ = elementsById;
      blocks.each(elementsById, function (element, id) {
        env[id] = element;
      });
    },

    fillServer: function (server) {
      var window = this._env.window;
      var timeout = setTimeout;
      var clear = clearTimeout;

      window.setTimeout = function (callback, delay) {
        if (delay === 0) {
          server.wait();
          return timeout(function () {
            var result = callback();

            server.ready();

            return result;
          }, delay);
        }

        return timeout(blocks.noop, delay);
      };

      window.clearTimeout = function (id) {
        return clear(id);
      };
    },

    _initialize: function () {
      var env = this._env;
      var document = env.document;
      env.window._blocks = blocks;

      document.getElementById = function (id) {
        return (document.__elementsById__ || {})[id] || null;
      };
    }
  };
  return BrowserEnv;
});