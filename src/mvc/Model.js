define([
  '../core',
  '../DataSource',
  './clonePrototype',
  './Property'
], function (blocks, DataSource, clonePrototype, Property) {

  /**
   * @namespace Model
   */
  function Model(application, prototype, dataItem, collection) {
    var _this = this;
    this._application = application;
    this._collection = collection;
    this._initialDataItem = blocks.clone(dataItem, true);

    blocks.each(Model.prototype, function (value, key) {
      if (blocks.isFunction(value) && key.indexOf('_') !== 0) {
        _this[key] = blocks.bind(value, _this);
      }
    });
    clonePrototype(prototype, this);

    this.valid = blocks.observable(true);

    this.isLoading = blocks.observable(false);

    this.validationErrors = blocks.observable([]);

    this._isNew = false;
    this._dataItem = dataItem || {}; // for original values
    this._properties = Property.Inflate(this);
    if (!this.options.baseUrl) {
      this.options.baseUrl = application.options.baseUrl;
    }
    this.options.mode = DataSource.ObjectMode;
    this._dataSource = new DataSource(this.options);
    this._dataSource.on('change', this._onDataSourceChange, this);
    this._dataSource.requestStart(function () {
      _this.isLoading(true);
    });
    this._dataSource.requestEnd(function () {
      _this.isLoading(false);
    });
    this._dataSource.on('sync', this._onDataSourceSync);
    this.hasChanges = this._dataSource.hasChanges;

    this._ensurePropertiesCreated(dataItem);
    this.init();
  }

  Model.prototype = {
    /**
     * The options for the Model
     *
     * @memberof Model
     * @type {Object}
     */
    options: {},

    /**
     * Override the init method to perform actions on creation for each Model instance
     *
     * @memberof Model
     * @type {Function}
     *
     * @example {javascript}
     * var App = blocks.Application();
     *
     * var Product = App.Model({
     *   init: function () {
     *     this.finalPrice = this.price() * this.ratio();
     *   },
     *
     *   price: App.Property({
     *     defaultValue: 0
     *   }),
     *
     *   ratio: App.Property({
     *     defaultValue: 1
     *   })
     * });
     */
    init: blocks.noop,

    collection: function () {
      return this._collection;
    },

    /**
     * Validates all observable properties that have validation and returns true if
     * all values are valid otherwise returns false
     *
     * @memberof Model
     * @returns {boolean} - Value indicating if the model is valid or not
     *
     * @example {javascript}
     * var App = blocks.Application();
     *
     * var User = App.Model({
     *   username: App.Property({
     *     required: true
     *   }),
     *
     *   email: App.Property({
     *     email: true
     *   })
     * });
     *
     * App.View('SignUp', {
     *   newUser: User(),
     *
     *   registerUser: function () {
     *     if (this.newUser.validate()) {
     *       alert('Successful registration!');
     *     }
     *   }
     * });
     */
    validate: function () {
      var properties = this._properties;
      var isValid = true;
      var property;
      var key;

      for (key in properties) {
        property = this[key];
        if (blocks.isObservable(property) && !property.validate()) {
          isValid = false;
        }
      }
      this.valid(isValid);
      this._updateValidationErrors();
      return isValid;
    },

    /**
     * Extracts the raw(non observable) dataItem object values from the Model
     *
     * @memberof Model
     * @returns {Object} - Returns the raw dataItem object
     *
     * @example {javascript}
     * var App = blocks.Application();
     * var User = App.Model({
     *   firstName: App.Property({
     *     defaultValue: 'John'
     *   })
     * });
     *
     * App.View('Profile', {
     *   user: User(),
     *
     *   init: function () {
     *     var dataItem = this.user.dataItem();
     *     // -> { firstName: 'defaultValue' }
     *   }
     * });
     */
    dataItem: function () {
      var properties = this._properties;
      var dataItem = {};
      var key;
      var property;

      for (key in properties) {
        property = properties[key];
        if (key != '__id__' && blocks.isFunction(this[property.propertyName])) {
          dataItem[property.field || property.propertyName] = this[property.propertyName]();
        }
      }
      if (this.isNew()) {
        delete dataItem[this.options.idAttr];
      }

      return dataItem;
    },

    /**
     * Applies new properties to the Model by providing an Object
     *
     * @memberof Model
     * @param {Object} dataItem - The object from which the new values will be applied
     * @returns {Model} - Chainable. Returns itself
     */
    reset: function (dataItem) {
      this._ensurePropertiesCreated(dataItem);
      return this;
    },

    /**
     * Determines whether the instance is new. If true when syncing the item will send
     * for insertion instead of updating it. The check is determined by the idAttr value
     * specified in the options. If idAttr is not specified the item will always be considered new.
     *
     * @memberof Model
     * @returns {boolean} - Returns whether the instance is new
     */
    isNew: function () {
      var idAttr = this.options.idAttr;
      var value = blocks.unwrap(this[idAttr]);
      var property = this._properties[idAttr];

      if ((!value && value !== 0) || (property && value === property.defaultValue)) {
        return true;
      }
      return false;
    },

    /**
     * Fires a request to the server to populate the Model based on the read URL specified
     *
     * @memberof Model
     * @param {Object} [params] - The parameters Object that will be used to populate the
     * Model from the specified options.read URL. If the URL does not contain parameters
     * @returns {Model} - Chainable. Returns the Model itself - returns this;
     */
    read: function (params, callback) {
      // TODO: Write tests for the callback checking if it is beeing called
      if (blocks.isFunction(params)) {
        callback = params;
        params = undefined;
      }
      this._dataSource.read({
        data: params
      }, callback);
      return this;
    },


    destroy: function (removeFromCollection) {
      removeFromCollection = removeFromCollection === false ? false : true;
      if (removeFromCollection && this._collection) {
        this._collection.remove(this);
      }
      this._dataSource._remove([this.dataItem()]);
      return this;
    },

    /**
     * Synchronizes the changes with the server by sending requests to the provided URL's
     *
     * @memberof Model
     * @returns {Model} - Returns the Model itself - return this;
     */
    sync: function () {
      if (this.isNew()) {
        this._dataSource.data.add(this.dataItem());
      }
      this._dataSource.sync();
      return this;
    },

    clone: function () {
      return new this.constructor(blocks.clone(this._initialDataItem, true));
    },

    _setPropertyValue: function (property, propertyValue) {
      var propertyName = property.propertyName;
      if (blocks.isFunction(this[propertyName])) {
        this[propertyName](propertyValue);
        this._dataSource.update(this.dataItem());
      } else if (property.isObservable) {
        this[propertyName] = this._createObservable(property, propertyValue);
      } else {
        this[propertyName] = function () {
          return propertyValue;
        };
      }
    },

    _ensurePropertiesCreated: function (dataItem) {
      var properties = this._properties;
      var property;
      var key;
      var field;

      if (dataItem) {
        if (Model.prototype.isPrototypeOf(dataItem)) {
          dataItem = dataItem.dataItem();
        }

        for (key in dataItem) {
          property = properties[key];
          if (!property) {
            property = properties[key] = blocks.extend({}, this._application.Property.Defaults());
            property.propertyName = key;
          }
          this._setPropertyValue(property, dataItem[key]);
        }
      }

      for (key in properties) {
        property = properties[key];
        if (!blocks.has(dataItem, property.propertyName)) {
          field = property.field || property.propertyName;
          this._setPropertyValue(property, property.value || (blocks.has(dataItem, field) ? dataItem[field] : property.defaultValue));
        }
      }
    },

    _createObservable: function (property, value) {
      var _this = this;
      var properties = this._properties;
      var observable = Property.Create(property, this, value);

      observable
        .on('change', function () {
          if (!_this.isNew()) {
            _this._dataSource.update(_this.dataItem());
          }
        })
        .on('validate', function () {
          var isValid = true;
          var key;
          for (key in properties) {
            if (!_this[key].valid()) {
              isValid = false;
              break;
            }
          }
          _this._updateValidationErrors();
          _this.valid(isValid);
        });

      if (!this._collection) {
        observable.extend();
      }
      return observable;
    },

    _onDataSourceChange: function () {
      var dataItem = blocks.unwrapObservable(this._dataSource.data())[0];
      this._ensurePropertiesCreated(dataItem);
    },

    _updateValidationErrors: function () {
      var properties = this._properties;
      var result = [];
      var value;
      var key;

      for (key in properties) {
        value = this[key];
        if (value.errorMessages) {
          result.push.apply(result, value.errorMessages());
        }
      }

      this.validationErrors.reset(result);
    }
  };

  if (blocks.core.expressionsCreated) {
    blocks.core.applyExpressions('object', Model.prototype);
  }
});
