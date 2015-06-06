define([
  '../core',
  '../DataSource',
  './clonePrototype',
  './Model',
  './Property'
], function (blocks, DataSource, clonePrototype, Model, Property) {
  /**
  * @namespace Collection
  */
  function Collection(ModelType, prototype, application, initialData) {
    return createCollectionObservable(ModelType, prototype, application, initialData);
  }

  blocks.observable.remote = function (options) {
    return createCollectionObservable(null, {
      options: options
    }, null, this.__value__);
  };

  function createCollectionObservable(ModelType, prototype, application, initialData) {
    var observable = blocks.observable([]).extend();
    var properties = Property.Inflate(prototype);
    var key;

    for (key in properties) {
      observable[key] = properties[key];
    }

    observable._baseUpdate = observable.update;
    blocks.each(blocks.observable.fn.collection, function (value, key) {
      if (blocks.isFunction(value) && key.indexOf('_') !== 0) {
        observable[key] = blocks.bind(observable[key], observable);
      }
    });
    blocks.extend(observable, blocks.observable.fn.collection, prototype);
    clonePrototype(prototype, observable);
    observable._Model = ModelType;
    observable._prototype = prototype;

    if (application) {
      observable._application = application;
      observable._view = blocks.__viewInInitialize__;
      if (!prototype.options.baseUrl) {
        prototype.options.baseUrl = application.options.baseUrl;
      }
    }

    observable._dataSource = new DataSource(prototype.options);
    observable._dataSource.on('change', observable._onDataSourceChange, observable);
    observable.hasChanges = observable._dataSource.hasChanges;
    if (ModelType) {
      observable.on('adding', observable._onAdding, observable);
      observable.on('remove add', observable._onChange, observable);
    }

    if (blocks.isArray(initialData)) {
      observable.reset(initialData);
    }

    if (prototype.init) {
      prototype.init.call(observable);
    }

    return observable;
  }

  blocks.observable.fn.collection = {

    /**
     * Fires a request to the server to populate the Model based on the read URL specified
     *
     * @memberof Collection
     * @param {Object} [params] - The parameters Object that will be used to populate the
     * Collection from the specified options.read URL. If the URL does not contain parameters
     * @returns {Collection} - Chainable. Returns the Collection itself - return this;
     *
     * @example {javascript}
     * var App = blocks.Application();
     *
     * var Products = App.Collection({
     *   options: {
     *     read: {
     *       url: 'http://your-servrice-url/{{id}}'
     *     }
     *   }
     * });
     *
     * var products = Products().read({
     *   // the id that will be replaced in the above options.read URL
     *   id: 3
     * });
     */
    read: function (params, callback) {
      // TODO: Write tests for the callback checking if it is being called
      var _this = this;

      if (blocks.isFunction(params)) {
        callback = params;
        params = undefined;
      }
      this._dataSource.read({
        data: params
      }, callback ? function () {
        callback.call(_this.__context__);
      } : blocks.noop);

      return this;
    },

    /**
     * Clear all changes made to the collection
     *
     * @memberof Collection
     * @returns {Collection} Chainable. Returns this
     *
     * @example {javascript}
     * var App = blocks.Application();
     *
     * var Products = App.Collection({
     *
     * });
     *
     * App.View('Products', function () {
     *   products: Products(),
     *
     *   init: function () {
     *     this.products.push({
     *       ProductName: 'Fish'
     *     });
     *
     *     // -> this.products.length = 1
     *     this.products.clearChanges();
     *     // -> this.products.length = 0
     *   }
     * });
     */
    clearChanges: function () {
      this._dataSource.clearChanges();
      return this;
    },

    /**
     * Performs an ajax request for all create, update and delete operations in order to sync them
     * with a database.
     *
     * @memberof Collection
     * @returns {Collection} - Chainable. Returns the Collection itself - return this;
     *
     * @example {javascript}
     * var App = blocks.Application();
     * var Products = App.Collection({
     *   options: {
     *     create: {
     *       url: 'serviceURL/CreateProduct'
     *     }
     *   }
     * });
     *
     * App.View('Products', function () {
     *   products: Products(),
     *
     *   init: function () {
     *     this.products.push({
     *       ProductName: 'Fish'
     *     });
     *
     *     // sends AJAX request to the create.url with the new item
     *     this.products.sync();
     *   }
     * });
     */
    sync: function () {
      this._dataSource.sync();
      return this;
    },

    /**
     *
     *
     * @memberof Collection
     * @param {number} id -
     * @param {Object} newValues -
     * @returns {Collection} - Chainable. Returns the Collection itself - return this;
     */
    update: function (id, newValues) {
      if (arguments.length === 0) {
        this._baseUpdate.call(this);
      } else {
        this._dataSource.update(id, newValues);
      }
      return this;
    },

    sortBy: function (callback, thisArg) {
      if (typeof callback == 'string') {
        var fieldName = callback;
        callback = function (value) {
          return value[fieldName]();
        };
      }
      blocks.sortBy(this.__value__, callback, thisArg);
      return this;
    },

    clone: function (cloneValue) {
      return createCollectionObservable(
        this._Model,
        this._prototype,
        this._application,
        cloneValue ? blocks.clone(this.__value__) : this.__value__);
    },

    // TODO: Add a test which adds to the center of the collection or the start
    // startIndex = args.index,
    _onAdding: function (args) {
      var _this = this;
      var ModelType = this._Model;
      var items = args.items;

      blocks.each(items, function (item, index) {
        if (Model.prototype.isPrototypeOf(item)) {
          item = item.dataItem();
        }
        items[index] = new ModelType(item, _this);
      });
    },

    _onChange: function (args) {
      var type = args.type;
      var items = args.items;
      var newItems = [];
      var i = 0;
      var item;

      if (this._internalChanging) {
        return;
      }

      for (; i < items.length; i++) {
        item = items[i];
        if (item && (type == 'remove' || (type == 'add' && item.isNew()))) {
          newItems.push(item.dataItem());
        }
      }

      if (type == 'remove') {
        this._dataSource.data.removeAt(args.index, args.items.length);
      } else if (type == 'add') {
        this._dataSource.data.addMany(newItems);
      }
    },

    _onDataSourceChange: function () {
      this._internalChanging = true;
      this.reset(this._dataSource.data());
      this._internalChanging = false;
      this.clearChanges();
      if (this._view) {
        this._view.trigger('ready');
      }
    }
  };

  return Collection;
});
