
define([
  '../core',
  '../modules/Events',
  './Observer'
], function (blocks, Events, Observer) {

  /**
   * @memberof blocks.observable
   * @class extenders
   */

  /**
   * Extends the observable by adding a .view property which is filtered
   * based on the provided options
   *
   * @memberof extenders
   * @param {(Function|Object|String)} options - provide a callback function
   * which returns true or false, you could also provide an observable
   * @returns {blocks.observable} - Returns a new observable
   * containing a .view property with the filtered data
   */
  blocks.observable.filter = function (options) {
    var observable = initExpressionExtender(this);
    var callback = options;

    if (!blocks.isFunction(callback) || blocks.isObservable(callback)) {
      callback = function (value) {
        var filter = blocks.unwrap(options);
        var filterString = String(filter).toLowerCase();
        value = String(blocks.unwrap(value)).toLowerCase();

        return !filter || value.indexOf(filterString) != -1;
      };
    }

    observable._operations.push({
      type: 'filter',
      filter: callback
    });

    observable.on('add', function () {
      if (observable.view._initialized) {
        observable.view._connections = {};
        observable.view.reset();
        executeOperations(observable);
      }
    });

    observable.on('remove', function () {
      if (observable.view._initialized) {
        observable.view._connections = {};
        observable.view.reset();
        executeOperations(observable);
      }
    });

    return observable;
  };

  blocks.observable.step = function (options) {
    var observable = initExpressionExtender(this);

    observable._operations.push({
      type: 'step',
      step: options
    });

    return observable;
  };

  /**
   * Extends the observable by adding a .view property in which the first n
   * items are skipped
   *
   * @memberof extenders
   * @param {(number|blocks.observable)} value - The number of items to be skipped
   * @returns {blocks.observable} - Returns a new observable
   * containing a .view property with the manipulated data
   */
  blocks.observable.skip = function (value) {
    var observable = initExpressionExtender(this);

    observable._operations.push({
      type: 'skip',
      skip: value
    });

    return observable;
  };

  /**
   * Extends the observable by adding a .view property in which there is
   * always maximum n items
   *
   * @memberof extenders
   * @param {(number|blocks.observable))} value - The max number of items to be in the collection
   * @returns {blocks.observable} - Returns a new observable
   * containing a .view property with the manipulated data
   */
  blocks.observable.take = function (value) {
    var observable = initExpressionExtender(this);

    observable._operations.push({
      type: 'take',
      take: value
    });

    return observable;
  };

  /**
   * Extends the observable by adding a .view property which is sorted
   * based on the provided options
   *
   * @memberof extenders
   * @param {(Function|string)} options - provide a callback sort function or field name to be sorted
   * @returns {blocks.observable} - Returns a new observable
   * containing a .view property with the sorted data
   */
  blocks.observable.sort = function (options) {
    var observable = initExpressionExtender(this);

    observable._operations.push({
      type: 'sort',
      sort: options
    });

    return observable;
  };

  function initExpressionExtender(observable) {
    var newObservable = observable.clone();

    newObservable.view = blocks.observable([]);
    newObservable.view._connections = {};
    newObservable.view._observed = [];
    newObservable.view._updateObservable = blocks.bind(updateObservable, newObservable);
    newObservable._operations = observable._operations ? blocks.clone(observable._operations) : [];
    newObservable._getter = blocks.bind(getter, newObservable);
    newObservable.view._initialized = false;

    newObservable.view.on('get', newObservable._getter);

    return newObservable;
  }

  function getter() {
    Events.off(this.view, 'get', this._getter);
    this._getter = undefined;
    this.view._initialized = true;
    executeOperations(this);
  }

  function updateObservable() {
    executeOperations(this);
  }

  function executeOperations(observable) {
    var chunk = [];
    var observed = observable.view._observed;
    var updateObservable = observable.view._updateObservable;

    blocks.each(observed, function (observable) {
      Events.off(observable, 'change', updateObservable);
      //observable.off('change', updateObservable);
    });
    observed = observable.view._observed = [];
    Observer.startObserving();

    blocks.each(observable._operations, function (operation) {
      if (operation.type == 'step') {
        var view = observable.view;
        observable.view = blocks.observable([]);
        observable.view._connections = {};
        if (chunk.length) {
          executeOperationsChunk(observable, chunk);
        }
        operation.step.call(observable.__context__);
        observable.view = view;
      } else {
        chunk.push(operation);
      }
      //if (operation.type == 'sort') {
      //  if (chunk.length) {
      //    executeOperationsChunk(observable, chunk);
      //  } else {
      //    executeOperationsChunk(observable, [{ type: 'filter', filter: function () { return true; }}]);
      //  }
      //  if (blocks.isString(operation.sort)) {
      //    observable.view.sort(function (valueA, valueB) {
      //      return valueA[operation.sort] - valueB[operation.sort];
      //    });
      //  } else if (blocks.isFunction(operation.sort)) {
      //    observable.view.sort(operation.sort);
      //  } else {
      //    observable.view.sort();
      //  }
      //  chunk = [];
      //} else {
      //  chunk.push(operation);
      //}
    });

    if (chunk.length) {
      executeOperationsChunk(observable, chunk);
    }

    blocks.each(Observer.stopObserving(), function (observable) {
      observed.push(observable);
      observable.on('change', updateObservable);
    });
  }

  function executeOperationsChunk(observable, operations) {
    var ADD = 'add';
    var REMOVE = 'remove';
    var EXISTS = 'exists';
    var action = EXISTS;

    var collection = observable.__value__;
    var view = observable.view;
    var connections = view._connections;
    var newConnections = {};
    var viewIndex = 0;
    var update = view.update;
    var skip = 0;
    var take = collection.length;
    view.update = blocks.noop;

    blocks.each(operations, function (operation) {
      if (operation.type == 'skip') {
        skip = operation.skip;
        if (blocks.isFunction(skip)) {
          skip = skip.call(observable.__context__);
        }
        skip = blocks.unwrap(skip);
      } else if (operation.type == 'take') {
        take = operation.take;
        if (blocks.isFunction(take)) {
          take = take.call(observable.__context__);
        }
        take = blocks.unwrap(take);
      } else if (operation.type == 'sort') {
        if (blocks.isString(operation.sort)) {
          collection = blocks.clone(collection).sort(function (valueA, valueB) {
            return valueA[operation.sort] - valueB[operation.sort];
          });
        } else if (blocks.isFunction(operation.sort)) {
          collection = blocks.clone(collection).sort(operation.sort);
        } else {
          collection = blocks.clone(collection).sort();
        }
        if (operations.length == 1) {
          operations.push({ type: 'filter', filter: function () { return true; }});
        }
      }
    });

    blocks.each(collection, function iterateCollection(value, index) {
      if (take <= 0) {
        while (view().length - viewIndex > 0) {
          view.removeAt(view().length - 1);
        }
        return false;
      }
      blocks.each(operations, function executeExtender(operation) {
        var filterCallback = operation.filter;

        action = undefined;

        if (filterCallback) {
          if (filterCallback.call(observable.__context__, value, index, collection)) {
            action = EXISTS;

            if (connections[index] === undefined) {
              action = ADD;
            }
          } else {
            action = undefined;
            if (connections[index] !== undefined) {
              action = REMOVE;
            }
            return false;
          }
        } else if (operation.type == 'skip') {
          action = EXISTS;
          skip -= 1;
          if (skip >= 0) {
            action = REMOVE;
            return false;
          } else if (skip < 0 && connections[index] === undefined) {
            action = ADD;
          }
        } else if (operation.type == 'take') {
          if (take <= 0) {
            action = REMOVE;
            return false;
          } else {
            take -= 1;
            action = EXISTS;

            if (connections[index] === undefined) {
              action = ADD;
            }
          }
        }
      });

      switch (action) {
        case ADD:
          newConnections[index] = viewIndex;
          view.splice(viewIndex, 0, value);
          viewIndex++;
          break;
        case REMOVE:
          view.removeAt(viewIndex);
          break;
        case EXISTS:
          newConnections[index] = viewIndex;
          viewIndex++;
          break;
      }
    });

    view._connections = newConnections;
    view.update = update;
    view.update();
  }
});
