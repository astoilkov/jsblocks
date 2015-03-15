define([
  '../core',
  '../modules/createProperty',
  '../modules/uniqueId',
  '../modules/ajax',
  '../modules/Events',
  '../modules/Router'
], function (blocks, createProperty, uniqueId, ajax, Events, Router) {
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

    if (blocks.observable) {
      this.data = blocks
          .observable(blocks.unwrap(data) || [])
          .extend()
          .on('add remove', blocks.bind(this._onArrayChange, this));
      this.view = blocks.observable([]).extend();
      this.hasChanges = blocks.observable(false);
    }

    this._aggregates = null;
    this._changes = [];
    this._changesMeta = {};
    this._page = options.page;
    this._pageSize = options.pageSize;
    this._sortExpressions = blocks.toArray(options.sortExpressions);
    this._filterExpressions = blocks.isArray(options.filterExpressions) ? options.filterExpressions : [{ logic: 'and', filters: [options.filterExpressions] }];
    this._groupExpressions = blocks.toArray(options.groupExpressions);
    this._aggregateExpressions = blocks.toArray(options.aggregateExpressions);

    this._subscribeToEvents();
  }

  blocks.DataSource = DataSource;

    DataSource.prototype = {
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
      },

      // data: null, // the initial data
      // autoSync: false,
      // batch: false,

      //serverPaging: false,
      page: 1,
      pageSize: Number.POSITIVE_INFINITY,


      //#region Advanced

      //serverAggregates: false,
      aggregateExpressions: [
          //{ field: 'Age', aggregate: 'sum' }
      ],

      //serverFiltering: false,
      filterExpressions: {
        //logic: 'or',
        //filters: [
        //    { field: 'category', operator: 'eq', value: 'asd' },
        //    {
        //        logic: 'and',
        //        filters: [

        //        ]
        //    }
        //]
      },

      //serverGrouping: false,
      groupExpressions: [
          //{ field: 'category', aggregate: 'sum', dir: 'desc' },
          //{ field: 'subcategory' },
      ],

      //serverSorting: false,
      sortExpressions: [
          //{ field: 'category', dir: 'desc' },
          //{ field: 'name', dir: 'asc' }
      ]

      //schema: {
      //    model: {
      //        id: 'ProductID',
      //        fields: {
      //            ProductID: {
      //                //this field will not be editable (default value is true)
      //                editable: false,
      //                // a defaultValue will not be assigned (default value is false)
      //                nullable: true
      //            },
      //            ProductName: {
      //                //set validation rules
      //                validation: { required: true }
      //            },
      //            UnitPrice: {
      //                //data type of the field {Number|String|Boolean|Date} default is String
      //                type: 'number',
      //                // used when new model is created
      //                defaultValue: 42,
      //                validation: { required: true, min: 1 }
      //            }
      //        }
      //    },

      //    parse: function (response) {
      //        var products = [];
      //        for (var i = 0; i < response.length; i++) {
      //            var product = {
      //                id: response[i].ProductID,
      //                name: response[i].ProductName
      //            };
      //            products.push(product);
      //        }
      //        return products;
      //    },

      //    // specify the the schema is XML
      //    type: 'xml',
      //    // the XML element which represents a single data record
      //    data: '/books/book',
      //    // define the model - the object which will represent a single data record
      //    model: {
      //        // configure the fields of the object
      //        fields: {
      //            // the 'title' field is mapped to the text of the 'title' XML element
      //            title: 'title/text()',
      //            // the 'id' field is mapped to the 'id' attribute of the 'book' XML element
      //            id: '@cover'
      //        }
      //    }
      //},


      //#endregion
    },

    query: function (options, callback) { // Executes the specified query over the data items. Makes a HTTP request if bound to a remote service.
      //dataSource.query({
      //    sort: { field: 'ProductName', dir: 'desc' },
      //    page: 3,
      //    pageSize: 20
      //});

      callback = arguments[arguments.length - 1];
      if (!options || blocks.isFunction(options)) {
        options = {};
      }

      options.__updateData__ = false;
      this.read(options, callback);
      return this;
    },

    read: function (options, callback) {
      var that = this,
          requiresEntireData = that._requiresEntireData();

      callback = arguments[arguments.length - 1];
      if (blocks.isFunction(options)) {
        options = {};
      }
      options = options || {};

      if (requiresEntireData) {
        options.page = 1;
        options.pageSize = Number.POSITIVE_INFINITY;
      }

      that._ajax('read', options, function (data) {
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
        if (!options || options.__updateData__ !== false) {
          that._updateData(data, requiresEntireData);
        }
        if (callback && blocks.isFunction(callback)) {
          callback(data);
        }
      });
      return that;
    },

    fetch: function (callback) {
      callback = callback || blocks.noop;
      if (this._haveData()) {
        this._updateData(this._data);
      } else {
        this.read(callback);
      }
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

    clearChanges: function () { // or in kendo called 'cancelChanges'
      this._changes.splice(0, this._changes.length);
      this._changesMeta = {};
      this.hasChanges(false);
      return this;
    },

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

    removeWhere: function () {

    },

    //#region Advanced

    aggregates: function () {
      if (!this._aggregates) {
        this._aggregates = this.data.aggregate(this._aggregateExpressions);
      }
      return this._aggregates;
    },

    getById: function () {

    },

    add: function () {
      return this.data.add.apply(this.data, blocks.toArray(arguments));
    },

    remove: function () {
      this.data.remove.apply(this.data, blocks.toArray(arguments));
      return this;
    },

    removeAt: function (index, count) {
      this.data.removeAt(index, count);
      return this;
    },

    page: createProperty('_page'),
    pageSize: createProperty('_pageSize'),
    sortExpressions: createProperty('_sortExpressions'),
    filterExpressions: createProperty('_filterExpressions'),
    groupExpressions: createProperty('_groupExpressions'),
    aggregateExpressions: createProperty('_aggregateExpressions'),
    //#endregion

    _updateData: function (data, requiresEntireData) {
      data = blocks.unwrapObservable(data);
      var pageSize = this._pageSize;
      var startIndex;

      requiresEntireData = arguments.length > 1 ? requiresEntireData : this._requiresEntireData();

      this.view.removeAll();
      if (requiresEntireData) {
        startIndex = (this._page - 1) * pageSize;
        this._haveAllData = true;
        data = blocks.sortBy(data, this._sortExpressions);

        if (this.data().length === 0) {
          this.data.addMany(data);
        }
        this.view.addMany(data.slice(startIndex, startIndex + pageSize));
      } else {
        this.data.removeAll();
        this.data.addMany(data);
        this.view.addMany(data);
      }
      this.clearChanges();
      this._trigger('change');
    },

    _onArrayChange: function (args) {
      var type = args.type;
      if (type == 'remove') {
        this._remove(args.items);
      } else if (type == 'removeAt') {
        this._remove(this.view.slice(args.index, args.index + args.count));
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

    //_checkForExistent: function (items) {
    //    var changes = this._changes;
    //    var count = 0;

    //    blocks.each(changes, function (change, i) {
    //        blocks.each(change.items, function (item) {
    //            if (blocks.contains(items, item)) {
    //                count++;
    //                blocks.removeAt(changes, i);
    //            }
    //        });
    //    });
    //    return items.length != 0 && count == items.length;
    //},

    _haveData: function () {
      var startIndex = (this._page + 1) * this._pageSize;
      var data = this.data();

      return this._haveAllData || (data[startIndex] && data[startIndex + this._pageSize]);
    },

    _requiresEntireData: function () {
      var options = this.options;
      return (!options.serverPaging && this._pageSize != Number.POSITIVE_INFINITY) ||
          (!options.serverSorting && !blocks.isEmpty(options.sortExpressions)) ||
          (!options.serverFiltering && !blocks.isEmpty(options.filterExpressions)) ||
          (!options.serverGrouping && !blocks.isEmpty(options.groupExpressions)) ||
          (!options.serverAggregates && !blocks.isEmpty(options.aggregateExpressions));
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
});
