define([
  '../modules/Events'
], function (Events) {
  function ServerEnv(options, html) {
    this.options = options;
    this.html = html;

    this.data = {};

  }

  ServerEnv.prototype = {
    _waiting: 0,

    rendered: '',

    isReady: function () {
      return this._waiting === 0;
    },

    wait: function () {
      this._waiting += 1;
    },

    ready: function () {
      if (this._waiting > 0) {
        this._waiting -= 1;
        if (this._waiting === 0) {
          this.trigger('ready');
        }
      }
    }
  };

  Events.register(ServerEnv.prototype, ['on', 'once', 'off', 'trigger']);
});