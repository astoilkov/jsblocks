define([
  '../core',
  '../modules/escapeRegEx',
  '../modules/Events',
  '../query/addListener'
], function (blocks, escapeRegEx, Events, addListener) {
  var routeStripper = /^[#\/]|\s+$/g;
  var rootStripper = /^\/+|\/+$/g;
  var isExplorer = /msie [\w.]+/;
  var trailingSlash = /\/$/;
  var pathStripper = /[?#].*$/;
  var HASH = 'hash';
  var PUSH_STATE = 'pushState';

  function History(options) {
    this._options = blocks.extend({
      root: '/'
    }, options);

    this._location = window.location;
    this._history = window.history;
    this._root = ('/' + this._options.root + '/').replace(rootStripper, '/');
    this._interval = 50;
    this._fragment = this._getFragment();
    this._wants = this._options.history === true ? HASH : this._options.history;
    this._use = this._wants == PUSH_STATE && (this._history && this._history.pushState) ? PUSH_STATE : HASH;
    this._hostRegEx = new RegExp(escapeRegEx(this._location.host));
  }

  History.prototype = {
    start: function () {
      var fragment = this._fragment;
      var docMode = document.documentMode;
      var oldIE = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));

      if (this._use == HASH && oldIE) {
        this._createIFrame();
        this.navigate(fragment);
      }

      this._initEvents(oldIE);
      if (!this._tryAdaptMechanism(fragment)) {
        this._loadUrl();
      }
    },

    navigate: function (fragment, options) {
      if (!options || options === true) {
        options = {
          trigger: !!options
        };
      }
      var url = this._root + (fragment = this._getFragment(fragment || ''));
      var use = this._use;
      var iframe = this._iframe;
      var location = this._location;

      fragment = fragment.replace(pathStripper, '');
      if (this._fragment === fragment) {
        return;
      }
      this._fragment = fragment;
      if (fragment === '' && url !== '/') {
        url = url.slice(0, -1);
      }

      if (this._wants == PUSH_STATE && use == PUSH_STATE) {
        this._history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);
      } else if (use == HASH) {
        this._updateHash(location, fragment, options.replace);
        if (iframe && (fragment !== this.getFragment(this._getHash(iframe)))) {
          if (!options.replace) {
            iframe.document.open().close();
          }
          this._updateHash(iframe.location, fragment, options.replace);
        }
      } else {
        return location.assign(url);
      }

      this._loadUrl(fragment);
    },

    _initEvents: function (oldIE) {
      var use = this._use;
      var onUrlChanged = blocks.bind(this._onUrlChanged, this);

      if (use == PUSH_STATE) {
        addListener(window, 'popstate', onUrlChanged);
        addListener(document, 'click', blocks.bind(this._onDocumentClick, this));
      } else if (use == HASH && !oldIE && ('onhashchange' in window)) {
        addListener(window, 'hashchange', onUrlChanged);
      } else if (use == HASH) {
        this._checkUrlInterval = setInterval(onUrlChanged, this._interval);
      }
    },

    _loadUrl: function (fragment) {
      this._fragment = fragment = this._getFragment(fragment);

      Events.trigger(this, 'urlChange', {
        url: fragment
      });
    },

    _getHash: function (window) {
      var match = (window ? window.location : this._location).href.match(/#(.*)$/);
      return match ? match[1] : '';
    },

    _getFragment: function (fragment) {
      if (fragment == null) {
        if (this._use == PUSH_STATE) {
          var root = this._root.replace(trailingSlash, '');
          fragment = this._location.pathname;
          if (!fragment.indexOf(root)) {
            fragment = fragment.slice(root.length);
          }
        } else {
          fragment = this._getHash();
        }
      }
      return fragment.replace(this._location.origin, '').replace(routeStripper, '');
    },

    _onUrlChanged: function () {
      var current = this._getFragment();
      if (current === this._fragment && this._iframe) {
        current = this._getFragment(this._getHash(this._iframe));
      }
      if (current === this._fragment) {
        return false;
      }
      if (this._iframe) {
        this.navigate(current);
      }
      this._loadUrl();
    },

    _onDocumentClick: function (e) {
      var target = e.target;

      while (target) {
        if (target && target.tagName && target.tagName.toLowerCase() == 'a' && this._hostRegEx.test(target.href) &&
          !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.which !== 2) {
          // handle click
          this.navigate(target.href);
          e.preventDefault();
        }
        target = target.parentNode;
      }
    },

    _tryAdaptMechanism: function (fragment) {
      var root = this._root;
      var use = this._use;
      var location = this._location;
      var atRoot = location.pathname.replace(/[^\/]$/, '$&/') === root;

      this._fragment = fragment;
      if (this._wants == PUSH_STATE) {
        if (use != PUSH_STATE && !atRoot) {
          fragment = this._fragment = this._getFragment(null, true);
          location.replace(root + location.search + '#' + fragment);
          return true;
        } else if (use == PUSH_STATE && atRoot && location.hash) {
          this._fragment = this._getHash().replace(routeStripper, '');
          this._history.replaceState({}, document.title, root + fragment + location.search);
        }
      }
    },

    _updateHash: function (location, fragment, replace) {
      if (replace) {
        var href = location.href.replace(/(javascript:|#).*$/, '');
        location.replace(href + '#' + fragment);
      } else {
        location.hash = '#' + fragment;
      }
    },

    _createIFrame: function () {
      /* jshint scripturl: true */
      var iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = 'javascript:0';
      iframe.tabIndex = -1;
      document.body.appendChild(iframe);
      this._iframe = iframe.contentWindow;
    }
  };

  Events.register(History.prototype, ['on']);

  return History;
});
