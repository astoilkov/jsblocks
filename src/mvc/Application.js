define([
  '../core',
  '../modules/Router',
  './clonePrototype',
  './History',
  './Model',
  './Collection',
  './View',
  './Property',
  './bindContext',
  '../query/serverData'
], function (blocks, clonePrototype, Router, History, Model, Collection, View, Property, bindContext, serverData) {

  var application;
  blocks.Application = function (options) {
    return (application = application || new Application(options));
  };

  blocks.core.deleteApplication = function () {
    application = undefined;
  };

  /**
   * MVC Application Class
   *
   * @namespace Application
   * @module mvc
   * @param {Object} options - The options for the application
   */
  function Application(options) {
    this._router = new Router(this);
    this._modelPrototypes = {};
    this._collectionPrototypes = {};
    this._viewPrototypes = {};
    this._views = {};
    this._currentRoutedView = undefined;
    this._started = false;
    this.options = blocks.extend({}, this.options, options);
    this._serverData = null;

    this._setDefaults();

    this._prepare();
  }

  Application.prototype = {
    options: {
      history: true
    },

    /**
     * Creates an application property for a Model
     *
     * @memberof Application
     * @param {Object} [property] - An object describing the options for the current property
     *
     * @example {javascript}
     *
     * var App = blocks.Application();
     *
     * var User = App.Model({
     *   username: App.Property({
     *     defaultValue: 'John Doe'
     *   })
     * });
     */
    Property: function (property) {
      if (blocks.isString(property)) {
        return function () {
          return this[property]();
        };
      } else {
        property = blocks.extend({}, this.Property.Defaults(), property);
        property = new Property(property);

        return property;
      }
    },

    /**
    * Creates a new Model
    *
    * @memberof Application
    * @param {Object} prototype - the Model object properties that will be created
    * @returns {Model} - the Model type with the specified properties
    * @example {javascript}
    *
    * var App = blocks.Application();
    *
    * var User = App.Model({
    *  firstName: App.Property({
    *   required: true,
    *   validateOnChange: true
    *  }),
    *
    *  lastName: App.Property({
    *   required: true,
    *   validateOnChange: true
    *  }),
    *
    *  fullName: App.Property({
    *    value: function () {
    *      return this.firstName() + ' ' + this.lastName();
    *    }
    *  })
    * });
    *
    * App.View('Profile', {
    *  user: User({
    *    firstName: 'John',
    *    lastName: 'Doe'
    *  })
    * });
    *
    * @example {html}
    * <div data-query="view(Profile)">
    *   <h3>
    *     FullName is: {{user.fullName()}}
    *   </h3>
    * </div>
    *
    * <!-- will result in -->
    * <div data-query="view(Profile)">
    *   <h3>
    *     FullName is: John Doe
    *   </h3>
    * </div>
    */
    Model: function (prototype) {
      var _this = this;
      var ExtendedModel = function (dataItem, collection) {
        if (!Model.prototype.isPrototypeOf(this)) {
          return new ExtendedModel(dataItem, collection);
        }
        this._super([_this, prototype, dataItem, collection]);
      };

      prototype = blocks.clone(prototype, true) || {};
      prototype.options = prototype.options || {};

      return blocks.inherit(Model, ExtendedModel, prototype);
    },

    /**
    * Creates a new Collection
    *
    * @memberof Application
    * @param {Object|blocks.Application.Model} [ModelType] - The model type the collection will be created for.
    * @param {Object} prototype - The Collection object properties that will be created.
    * @returns {Collection} - The Collection type with the specified properties
    * @example {javascript}
    *
    * var App = blocks.Application();
    *
    * var User = App.Model({
    *  firstName: App.Property({
    *   required: true,
    *   validateOnChange: true
    *  }),
    *
    *  lastName: App.Property({
    *   required: true,
    *   validateOnChange: true
    *  }),
    *
    *  fullName: App.Property({
    *    value: function () {
    *      return this.firstName() + ' ' + this.lastName();
    *    }
    *  })
    * });
    *
    * var Users = App.Collection(User, {
    *   count: App.Property({
    *     value: function () {
    *       return this().length;
    *     }
    *   })
    * });
    *
    * App.View('Profiles', {
    *  users: Users([{
    *     firstName: 'John',
    *     lastName: 'Doe'
    *   }, {
    *     firstName: 'Johna',
    *     lastName: 'Doa'
    *   }])
    * });
    *
    * @example {html}
    * <div data-query="view(Profiles)">
    *   <h2>Total count is {{users.count}}</h2>
    *   <ul data-query="each(users)">
    *     <li>
    *       FullName is: {{fullName()}}
    *     </li>
    *   </ul>
    * </div>
    *
    * <!-- will result in -->
    * <div data-query="view(Profiles)">
    *   <h2>Total count is 2</h2>
    *   <ul data-query="each(users)">
    *     <li>
    *       FullName is: John Doe
    *     </li>
    *     <li>
    *       FullName is: Johna Doa
    *     </li>
    *   </ul>
    * </div>
    */
    Collection: function (ModelType, prototype) {
      var _this = this;
      var ExtendedCollection = function (initialData) {
        if (!Collection.prototype.isPrototypeOf(this)) {
          return new ExtendedCollection(initialData);
        }
        return this._super([ModelType, prototype, _this, initialData]);
      };

      if (!ModelType) {
        ModelType = this.Model({});
      } else if (!Model.prototype.isPrototypeOf(ModelType.prototype)) {
        prototype = ModelType;
        ModelType = this.Model({});
      }
      prototype = prototype || {};
      prototype.options = prototype.options || {};

      return blocks.inherit(Collection, ExtendedCollection, prototype);
    },

    /**
     * Defines a view that will be part of the Application
     *
     * @memberof Application
     * @param {string} [parentViewName] - Provide this parameter only if you are creating nested views.
     * This is the name of the parent View
     * @param {string} name - The name of the View you are creating
     * @param {Object} prototype - The object that will represent the View
     *
     * @example {javascript}
     * var App = blocks.Application();
     *
     * App.View('Clicker', {
     *   handleClick: function () {
     *     alert('Clicky! Click!');
     *   }
     * });
     *
     * @example {html}
     *
     * <div data-query="view(Clicker)">
     *   <h3><a href="#" data-query="click(handleClick)">Click here!</a></h3>
     * </div>
     */
    View: function (name, prototype, nestedViewPrototype) {
      // TODO: Validate prototype by checking if a property does not override a proto method
      // if the prototype[propertyName] Type eqals the proto[propertyName] Type do not throw error
      if (arguments.length == 1) {
        return this._views[name];
      }

      if (this._started) {
        // @debugMessage('Views can not be constructed / added after the application has been started. Try to add your views synchronous before document.readyState is "complete".', Error);
        return;
      }

      if (blocks.isString(prototype)) {
        this._viewPrototypes[prototype] = this._createView(nestedViewPrototype);
        nestedViewPrototype.options.parentView = name;
      } else {
        this._viewPrototypes[name] = this._createView(prototype);
      }
    },

    extend: function (obj) {
      blocks.extend(this, obj);
      bindContext(this, obj);
      return this;
    },

    navigateTo: function (view, params) {
      if (!view.options.route) {
        return false;
      }
      this._history.navigate(this._router.routeTo(view.options.routeName, params));
      return true;
    },

    start: function (element) {
      if (!this._started) {
        this._started = true;
        this._serverData = serverData;

        if (this._serverData && this._serverData.baseUrl) {
          this._router._setBaseUrl(this._serverData.baseUrl);
        }

        this._createViews();
        blocks.domReady(blocks.bind(this._ready, this, element));
      }
    },

    _prepare: function () {
      blocks.domReady(function () {
        setTimeout(blocks.bind(function () {
          this.start();
        }, this));
      }, this);
    },

    _startHistory: function () {
      this._history = new History(this.options);
      this._history
          .on('urlChange', blocks.bind(this._urlChange, this))
          .start();
    },

    _ready: function (element) {
      this._startHistory();
      blocks.query(this, element);
      this._viewsReady(this._views);
    },

    _viewsReady: function (views) {
      var callReady = this._callReady;

      blocks.each(views, function (view) {
        if (view.ready !== blocks.noop) {
          if (view.isActive()) {
            callReady(view);
          } else {
            view.isActive.once('change', function () {
              callReady(view);
            });
          }
        }
      });
    },

    _callReady: function (view) {
      if (view.loading()) {
        view.loading.once('change', function () {
          view.ready();
        });
      } else {
        view.ready();
      }
    },

    _urlChange: function (data) {
      var _this = this;
      var currentView = this._currentView;
      var routes = this._router.routeFrom(data.url) || [];
      var found = false;

      blocks.each(routes, function (route) {
        blocks.each(_this._views, function (view) {
          if (view.options.routeName == route.id) {
            if (!currentView && (view.options.initialPreload ||
              (data.initial && _this._serverData && _this.options.history == 'pushState'))) {
              view.options.url = undefined;
            }
            if (currentView && currentView != view) {
              currentView.isActive(false);
            }
            view._routed(route.params, data);
            _this._currentView = view;
            found = true;
            return false;
          }
        });
        if (found) {
          return false;
        }
      });

      if (!found && currentView) {
        currentView.isActive(false);
      }

      return found;
    },

    _createView: function (prototype) {
      prototype.options = blocks.extend({}, this.View.Defaults(), prototype.options);
      // if (prototype.options.route) {
      //   prototype.options.routeName = this._router.registerRoute(prototype.options.route);
      // }

      return blocks.inherit(View, function (application, parentView) {
        this._super([application, parentView]);
      }, prototype);
    },

    _createViews: function () {
      var viewPrototypePairs = blocks.pairs(this._viewPrototypes);
      var views = this._views;
      var viewsInOrder = [];
      var pair;
      var View;
      var parentViewName;
      var currentView;
      var i = 0;

      while (viewPrototypePairs.length !== 0) {
        for (; i < viewPrototypePairs.length; i++) {
          pair = viewPrototypePairs[i];
          View = pair.value;
          parentViewName = View.prototype.options.parentView;
          if (parentViewName) {
            //#region blocks
            if (!this._viewPrototypes[parentViewName]) {
              viewPrototypePairs.splice(i, 1);
              i--;
              throw new Error('View with ' + parentViewName + 'does not exist');
              //TODO: Throw critical error parentView with such name does not exists
            }
            //#endregion
            if (views[parentViewName]) {
              currentView = new View(this, views[parentViewName]);
              views[parentViewName][pair.key] = currentView;
              views[parentViewName]._views.push(currentView);
              if (!currentView.parentView().isActive()) {
                currentView.isActive(false);
              }
              viewPrototypePairs.splice(i, 1);
              i--;
            }
          } else {
            currentView = new View(this);
            this[pair.key] = currentView;
            viewPrototypePairs.splice(i, 1);
            i--;
            parentViewName = undefined;
          }

          if (currentView) {
            if (blocks.has(currentView.options, 'route')) {
              currentView.options.routeName = this._router.registerRoute(
                currentView.options.route, this._getParentRouteName(currentView));
            }
            views[pair.key] = currentView;
            viewsInOrder.push(currentView);
          }
        }
      }

      for (i = 0; i < viewsInOrder.length; i++) {
        viewsInOrder[i]._tryInitialize(viewsInOrder[i].isActive());
      }

      this._viewPrototypes = undefined;
    },

    _getParentRouteName: function (view) {
      while (view) {
        if (view.options.routeName) {
          return view.options.routeName;
        }
        view = view.parentView();
      }
    },

    _setDefaults: function () {
      this.Model.Defaults = blocks.observable({
        options: {}
      }).extend();

      this.Collection.Defaults = blocks.observable({
        options: {}
      }).extend();

      this.Property.Defaults = blocks.observable({
        isObservable: true,
        maxErrors: 1
      }).extend();

      this.View.Defaults = blocks.observable({
        options: {}
      }).extend();
    },
    // Application is a singleton. So return a reference instead of a clone.
    clone: function () {
      return this;
    }
  };
  return Application;
});
