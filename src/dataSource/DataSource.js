define([
  '../core',
  '../modules/createProperty',
  '../modules/uniqueId',
  '../modules/ajax',
  '../modules/Events',
  '../modules/Router'
], function (blocks, createProperty, uniqueId, ajax, Events, Router) {
  /* global JSON */

  var CREATE = 'create';
  var UPDATE = 'update';
  var DESTROY = 'destroy';
  var GET = 'GET';
  var CONTENT_TYPE = 'application/json; charset=utf-8';
  //var JSONP = 'jsonp';
  var EVENTS = [
      'change',
      'sync',
      'error',
      'requestStart',
      'requestEnd'
  ];

  function DataSource(options) {
    options = options || {};
    var data = options.data;
    var baseUrl = options.baseUrl;

    // set options.data to undefined and return the extended options object using ||
    options = this.options = (options.data = undefined) || blocks.extend(true, {}, this.options, options);

    if (baseUrl) {
      options.read.url = baseUrl + options.read.url;
      options.create.url = baseUrl + options.create.url;
      options.destroy.url = baseUrl + options.destroy.url;
      options.update.url = baseUrl + options.update.url;
    }

    this.data = blocks
        .observable(blocks.unwrap(data) || [])
        .extend()
        .on('add remove', blocks.bind(this._onArrayChange, this));
    this.hasChanges = blocks.observable(false);

    this._aggregates = null;
    this._changes = [];
    this._changesMeta = {};

    this._subscribeToEvents();
  }

  blocks.DataSource = DataSource;

  DataSource.ArrayMode = 1;
  DataSource.ObjectMode = 2;

  DataSource.prototype = {
    options: {
      baseUrl: '',
      idAttr: '',
      mode: DataSource.ArrayMode,

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

    read: function (options, callback) {
      var _this = this;

      callback = arguments[arguments.length - 1];
      if (blocks.isFunction(options)) {
        options = {};
      }
      options = options || {};

      _this._ajax('read', options, function (data) {
        if (blocks.isString(data)) {
          data = JSON.parse(data);
        }

        if (_this.options.mode == DataSource.ArrayMode) {
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
          }
        }

        if (!blocks.isArray(data)) {
          data = [data];
        }

        if (!options || options.__updateData__ !== false) {
          _this._updateData(data);
        }
        if (callback && blocks.isFunction(callback)) {
          callback(data);
        }
      });
      return _this;
    },

    // should accept dataItem only
    // should accept id + object with the new data
    update: function () {
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

    hasChanges: function () {
      return this._changes.length > 0;
    },

    clearChanges: function () {
      this._changes.splice(0, this._changes.length);
      this._changesMeta = {};
      this.hasChanges(false);
      return this;
    },

    sync: function (callback) {
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
          _this._ajax(change.type, {
            data: data
          }, function () {
            changesLeft--;
            if (!changesLeft) {
              if (blocks.isFunction(callback)) {
                callback();
              }
              _this._trigger('sync');
            }
          });
        });
      });

      return this.clearChanges();
    },

    _ajax: function (optionsName, options, callback) {
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
    },

    _updateData: function (data) {
      this.data.removeAll();
      this.data.addMany(data);

      this.clearChanges();
      this._trigger('change');
    },

    _onArrayChange: function (args) {
      var type = args.type;
      if (type == 'remove') {
        this._remove(args.items);
      } else if (type == 'removeAt') {
        this._remove(this.data.slice(args.index, args.index + args.count));
      } else if (type == 'add') {
        this._add(args.items);
      }
    },

    _onChangePush: function () {
      var metadata = this._changesMeta;
      var changes = this._changes;
      var change = changes[changes.length - 1];
      var idAttr = this.options.idAttr;
      var type = change.type;
      var metaItem;

      blocks.each(change.items, function (item) {
        switch (type) {
          case CREATE:
            item.__id__ = uniqueId();
            metadata[item.__id__] = item;
            break;
          case UPDATE:
            metaItem = metadata[item[idAttr]];
            if (metaItem) {
              changes.splice(metaItem.index, 1);
              metaItem.item = item;
              metaItem.index = changes.length - 1;
            }
            metadata[item[idAttr]] = {
              index: changes.length - 1,
              item: item
            };
            break;
          case DESTROY:
            metaItem = metadata[item ? item.__id__ : undefined];
            if (metaItem) {
              changes.splice(metaItem.index, 1);
              changes.pop();
              metadata[item.__id__] = undefined;
            }
            break;
        }
      });

      if (changes.length > 0 && this.options.autoSync) {
        this.sync();
      } else {
        this.hasChanges(changes.length > 0);
      }
    },

    _add: function (items) {
      this._changes.push({
        type: CREATE,
        items: items
      });
      this._onChangePush();
    },

    _remove: function (items) {
      this._changes.push({
        type: DESTROY,
        items: items
      });
      this._onChangePush();
    },

    _subscribeToEvents: function () {
      var _this = this;
      var options = this.options;

      blocks.each(EVENTS, function (value) {
        if (options[value]) {
          _this.on(value, options[value]);
        }
      });
    }
  };

  Events.register(DataSource.prototype, [
    'on',
    '_trigger',


    // TODO: Should remove these
    'change',
    'error',
    'requestStart',
    'requestEnd'
  ]);

  blocks.core.applyExpressions('array', blocks.DataSource.prototype, blocks.toObject([/*'remove', 'removeAt', 'removeAll', 'add',*/ 'size', 'at', 'isEmpty', 'each']));
  return DataSource;
});
