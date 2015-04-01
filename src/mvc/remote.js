define([
  '../core',
  '../modules/ajax'
], function (blocks, ajax) {
  blocks.observable.remote = function (options) {
    this._baseUpdate = this.update;
    this.hasChanges = blocks.observable(false);
  };

  blocks.observable.fn.remote = {
    options: {
      baseUrl: '',
      idAttr: '',

      read: {
        url: '',
        type: GET,
        contentType: CONTENT_TYPE
      },

      update: {
        url: '',
        type: 'POST',
        contentType: CONTENT_TYPE
      },

      create: {
        url: '',
        type: 'POST',
        contentType: CONTENT_TYPE
      },

      destroy: {
        url: '',
        type: 'POST',
        contentType: CONTENT_TYPE
      }
    },

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
      var context = this.__context__;

      if (blocks.isFunction(params)) {
        callback = params;
        params = undefined;
      }

      this._ajax('read', { data: params }, blocks.bind(this._handleRead, this));

      return this;
    },

    _handleRead: function (data) {
      if (blocks.isString(data)) {
        data = JSON.parse(data);
      }

      if (!blocks.isArray(data)) {
        if (blocks.isArray(data.value)) {
          data = data.value;
        } else if (blocks.isObject(data)) {
          blocks.each(data, function (value) {
            if (blocks.isArray(value)) {
              data = value;
              return false;
            }
          });
        }

        if (!blocks.isArray(data)) {
          data = [data];
        }
      }

      this.reset(data);

      if (callback && blocks.isFunction(callback)) {
        callback(data);
      }
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
      this._changes.splice(0, this._changes.length);
      this._changesMeta = {};
      this.hasChanges(false);
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
      var _this = this;
      var changes = this._changes;
      var changesLeft = changes.length;
      var data;

      blocks.each(changes, function (change) {
        blocks.each(change.items, function (item) {
          data = item;
          if (item.__id__) {
            delete item.__id__;
          }
          if (change.type == DESTROY && blocks.isObject(item) && _this.options.idAttr) {
            data = item[_this.options.idAttr];
          }
          _this._ajax(change.type, {
            data: data
          }, function () {
            changesLeft--;
            if (!changesLeft) {
              _this._trigger('sync');
            }
          });
        });
      });
      return this.clearChanges();
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

    _update: function () {
      if (arguments.length === 0) {
        return;
      }
      var items;
      if (arguments.length > 1 && blocks.type(arguments[0]) != blocks.type(arguments[1])) {
        items = [arguments[1]];
        items[0][this.options.idAttr] = arguments[0];
      } else {
        items = blocks.flatten(arguments);
      }
      if (items.length > 0) {
        this._changes.push({
          type: UPDATE,
          items: items
        });
        this._onChangePush();
      }
    },

    _ajax: function (options) {
      var _this = this;
      var type;

      options = blocks.extend({}, this.options[optionsName], options);
      type = options.type.toUpperCase();
      options.url = Router.GenerateRoute(options.url, options.data);
      this._trigger('requestStart', {

      });
      ajax({
        type: options.type,
        url: options.url,
        data: type == GET ? null : JSON.stringify(options.data),
        contentType: options.contentType, // 'application/json; charset=utf-8',
        dataType: options.dataType,
        jsonp: options.jsonp,
        success: function (data, statusMessage, status) {
          _this._trigger('requestEnd', {});
          if (data) {
            callback(data, statusMessage, status);
          }
        },
        error: function (/*message, statusObject, status*/) {
          _this._trigger('requestEnd', {});
          _this._trigger('error');
        }
      });
    }
  };
});