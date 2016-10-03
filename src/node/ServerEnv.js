define([
  '../core',
  '../modules/Events'
], function (blocks, Events) {
  function ServerEnv(options, html) {
    this.options = options;
    this.html = html;
    this.data = {};
    this._root = this._createBubbleNode();
    this._node = this._root;

    this.on('ready', blocks.bind(this._ready, this));
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
    },

    await: function (callback) {
      if (this.isReady()) {
        callback();
      } else {
        this._createBubbleNode(this._node, callback);
      }
    },

    _ready: function () {
      var node = this._node;

      while (this.isReady()) {
        if (!node.isRoot) {
          node.callback();
        }
        this._node = node = this._next(node);

        if (node === this._root) {
          break;
        }
      }
    },

    _next: function (node) {
      var parent = node;
      var next;

      while (!next && parent) {
        next = parent.nodes.pop();
        parent = parent.parent;
      }

      return next || this._root;
    },

    _createBubbleNode: function (parent, callback) {
      var node = {
        isRoot: !parent,
        parent: parent,
        callback: callback,
        nodes: []
      };

      if (parent) {
        parent.nodes.unshift(node);
      }

      return node;
    }
  };

  Events.register(ServerEnv.prototype, ['on', 'once', 'off', 'trigger']);
});