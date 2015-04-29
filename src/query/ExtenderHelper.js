define([
  '../core',
  '../modules/Events',
  './Observer'
], function (blocks, Events, Observer) {
  var ExtenderHelper = {
    waiting: {},

    initExpressionExtender: function (observable) {
      var newObservable = observable.clone();

      newObservable.view = blocks.observable([]);
      newObservable.view._connections = {};
      newObservable.view._observed = [];
      newObservable.view._updateObservable = blocks.bind(ExtenderHelper.updateObservable, newObservable);
      newObservable._operations = observable._operations ? blocks.clone(observable._operations) : [];
      newObservable._getter = blocks.bind(ExtenderHelper.getter, newObservable);
      newObservable.view._initialized = false;

      newObservable.view.on('get', newObservable._getter);

      return newObservable;
    },

    getter: function () {
      Events.off(this.view, 'get', this._getter);
      this._getter = undefined;
      this.view._initialized = true;
      ExtenderHelper.executeOperationsPure(this);
    },

    updateObservable: function () {
      ExtenderHelper.executeOperations(this);
    },

    executeOperationsPure: function (observable) {
      var chunk = [];
      var observed = observable.view._observed;
      var updateObservable = observable.view._updateObservable;

      blocks.each(observed, function (observable) {
        Events.off(observable, 'change', updateObservable);
      });
      observed = observable.view._observed = [];
      Observer.startObserving();

      blocks.each(observable._operations, function (operation) {
        if (operation.type == 'step') {
          var view = observable.view;
          observable.view = blocks.observable([]);
          observable.view._connections = {};
          if (chunk.length) {
            ExtenderHelper.executeOperationsChunk(observable, chunk);
          }
          operation.step.call(observable.__context__);
          observable.view = view;
        } else {
          chunk.push(operation);
        }
      });

      if (chunk.length) {
        ExtenderHelper.executeOperationsChunk(observable, chunk);
      }

      blocks.each(Observer.stopObserving(), function (observable) {
        observed.push(observable);
        observable.on('change', updateObservable);
      });
    },

    executeOperations: function (observable) {
      var id = observable.__id__;
      var waiting = ExtenderHelper.waiting;

      if (!waiting[id]) {
        waiting[id] = true;
        setTimeout(function () {
          ExtenderHelper.executeOperationsPure(observable);
          waiting[id] = false;
        }, 0);
      }
    },

    executeOperationsChunk: function (observable, operations) {
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
  };

  return ExtenderHelper;
});