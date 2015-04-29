define([
  '../modules/Events'
], function (Events) {
  function ServerEnv(options, html) {
    this.options = options;
    this.html = html;
    this.data = {};
    this._callbacks = {
      init: [],
      started: [],
      ready: [],
      sent: []
    };

    this.on('ready', blocks.bind(this._ready, this));
  }

  ServerEnv.prototype = {
    _waiting: 0,

    _processing: false,

    _stages: ['init', 'started', 'ready', 'sent'],

    _currentStageIndex: 0,

    rendered: '',

    isReady: function () {
      return this._waiting === 0 && !this._processing;
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
    },

    onReady: function (stage, callback) {
      var currentStage = this._stages[this._currentStageIndex];

      if (this.isReady() && currentStage === stage) {
        callback();
      } else {
        this._callbacks[stage].push(callback);
      }
    },

    _ready: function () {
      var callbacks = this._callbacks[this._stages[this._currentStageIndex]];

      this._processing = true;
      blocks.each(callbacks, function (callback) {
        callback();
      });
      callbacks.splice(0, callbacks.length);
      this._processing = false;

      if (this._currentStageIndex < this._stages.length - 1) {
        this._currentStageIndex += 1;
        if (this.isReady()) {
          this.trigger('ready');
        }
      }
    }
  };

  Events.register(ServerEnv.prototype, ['on', 'once', 'off', 'trigger']);
});