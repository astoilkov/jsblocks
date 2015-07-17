define([
  '../core',
  '../modules/ajax',
  '../modules/Events',
  './clonePrototype'
], function (blocks, ajax, Events, clonePrototype) {
  /**
   * @namespace View
   */
  function View(application, parentView, prototype) {
    var _this = this;
    var options = this.options;
    var views = this._views = [];

    clonePrototype(prototype, this);

    this._application = application;
    this._parentView = parentView || null;
    this._initCalled = false;
    this._html = undefined;

    this.loading = blocks.observable(false);
    this.isActive = blocks.observable(!blocks.has(options, 'route'));
    this.isActive.on('changing', function (oldValue, newValue) {
      _this._tryInitialize(newValue);
    });

    if (options.preload || this.isActive()) {
      this._load();
    }
  }

  View.prototype = {
    /**
     * Determines if the view is visible or not.
     * This property is automatically populated when routing is enabled for the view.
     *
     * @memberof View
     * @name isActive
     * @type {blocks.observable}
     */

    /**
     * Override the init method to perform actions when the View is first created
     * and shown on the page
     *
     * @memberof View
     * @type {Function}
     *
     * @example {javascript}
     * var App = blocks.Application();
     *
     * App.View('Statistics', {
     *   init: function () {
     *     this.loadRemoteData();
     *   },
     *
     *   loadRemoteData: function () {
     *     // ...stuff...
     *   }
     * });
     */
    init: blocks.noop,

    /**
     * Override the ready method to perform actions when the DOM is ready and
     * all data-query have been executed.
     *
     * @memberof View
     * @type {Function}
     *
     * @example {javascript}
     * var App = blocks.Application();
     *
     * App.View('ContactUs', {
     *   ready: function () {
     *     $('#contact-form').ajaxSubmit();
     *   }
     * });
     */
    ready: blocks.noop,

    /**
     * Override the routed method to perform actions when the View have routing and routing
     * mechanism actives it.
     *
     * @memberof View
     * @type {Function}
     *
     * @example {javascript}
     * var App = blocks.Application();
     *
     * App.View('ContactUs', {
     *   options: {
     *     route: 'contactus'
     *   },
     *
     *   routed: function () {
     *     alert('Navigated to ContactUs page!')
     *   }
     * });
     */
    routed: blocks.noop,

    /**
     * Observable which value is true when the View html
     * is being loaded using ajax request. It could be used
     * to show a loading indicator.
     *
     * @memberof View
     */
    loading: blocks.observable(false),

    /**
     * Gets the parent view.
     * Returns null if the view is not a child of another view.
     *
     * @memberof View
     */
    parentView: function () {
      return this._parentView;
    },

    /**
     * Routes to a specific URL and actives the appropriate views associated with the URL
     *
     * @memberof View
     * @param {String} name -
     * @returns {View} - Chainable. Returns this
     *
     * @example {javascript}
     * var App = blocks.Application();
     *
     * App.View('ContactUs', {
     *   options: {
     *     route: 'contactus'
     *   }
     * });
     *
     * App.View('Navigation', {
     *   navigateToContactUs: function () {
     *     this.route('contactus')
     *   }
     * });
     */
    route: function (/* name */ /*, ...params */) {
      this._application._history.navigate(blocks.toArray(arguments).join('/'));
      return this;
    },

    navigateTo: function (view, params) {
      this._application.navigateTo(view, params);
    },

    _tryInitialize: function (isActive) {
      if (!this._initialized && isActive) {
        if (this.options.url && !this._html) {
          this._callInit();
          this._load();
        } else {
          this._initialized = true;
          this._callInit();
          if (this.isActive()) {
            this.isActive.update();
          }
        }
      }
    },

    _routed: function (params, metadata) {
      this._tryInitialize(true);
      this.routed(params, metadata);
      blocks.each(this._views, function (view) {
        if (!view.options.route) {
          view._routed(params, metadata);
        }
      });
      this.isActive(true);
    },

    _callInit: function () {
      if (this._initCalled) {
        return;
      }

      var key;
      var value;

      blocks.__viewInInitialize__ = this;
      for (key in this) {
        value = this[key];
        if (blocks.isObservable(value)) {
          value.__context__ = this;
        }
      }
      this.init();
      blocks.__viewInInitialize__ = undefined;
      this._initCalled = true;
    },

    _load: function () {
      var url = this.options.url;
      var serverData = this._application._serverData;

      if (serverData && serverData.views && serverData.views[url]) {
        url = this.options.url = undefined;
        this._tryInitialize(true);
      }

      if (url && !this.loading()) {
        this.loading(true);
        ajax({
          isView: true,
          url: url,
          success: blocks.bind(this._loaded, this),
          error: blocks.bind(this._error, this)
        });
      }
    },

    _loaded: function (html) {
      this._html = html;
      this._tryInitialize(true);
      this.loading(false);
    },

    _error: function () {
      this.loading(false);
    }
  };

  Events.register(View.prototype, ['on', 'off', 'trigger']);

  /* @if DEBUG */ {
    blocks.debug.addType('View', function (value) {
      if (value && View.prototype.isPrototypeOf(value)) {
        return true;
      }
      return false;
    });
  } /* @endif */
});
