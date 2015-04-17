define([
  '../core',
  '../var/slice',
  '../var/trimRegExp',
  '../modules/Events',
  './var/parameterQueryCache',
  './var/OBSERVABLE',
  './Expression',
  './ChunkManager',
  './ElementsData',
  './Observer',
  './VirtualElement',
  './HtmlElement'
], function (blocks, slice, trimRegExp, Events, parameterQueryCache, OBSERVABLE,
             Expression, ChunkManager, ElementsData, Observer, VirtualElement, HtmlElement) {

  var observableId = 1;

  /**
  * @namespace blocks.observable
  * @param {*} initialValue -
  * @param {*} [context] -
  * @returns {blocks.observable}
  */
  blocks.observable = function (initialValue, thisArg) {
    var observable = function (value) {
      if (arguments.length === 0) {
        Events.trigger(observable, 'get', observable);
      }

      var currentValue = getObservableValue(observable);
      var update = observable.update;

      if (arguments.length === 0) {
        Observer.registerObservable(observable);
        return currentValue;
      } else if (!blocks.equals(value, currentValue, false) && Events.trigger(observable, 'changing', value, currentValue) !== false) {
        observable.update = blocks.noop;
        if (!observable._dependencyType) {
          if (blocks.isArray(currentValue) && blocks.isArray(value) && observable.removeAll && observable.addMany) {
            observable.removeAll();
            observable.addMany(value);
          } else {
            observable.__value__ = value;
          }
        } else if (observable._dependencyType == 2) {
          observable.__value__.set.call(observable.__context__, value);
        }

        observable.update = update;
        observable.update();

        Events.trigger(observable, 'change', value, currentValue);
      }
      return observable;
    };

    initialValue = blocks.unwrap(initialValue);

    blocks.extend(observable, blocks.observable.fn.base);
    observable.__id__ = observableId++;
    observable.__value__ = initialValue;
    observable.__context__ = thisArg || blocks.__viewInInitialize__ || observable;
    observable._expressionKeys = {};
    observable._expressions = [];
    observable._elementKeys = {};
    observable._elements = [];

    if (blocks.isArray(initialValue)) {
      blocks.extend(observable, blocks.observable.fn.array);
      observable._indexes = [];
      observable._chunkManager = new ChunkManager(observable);
    } else if (blocks.isFunction(initialValue)) {
      observable._dependencyType = 1; // Function dependecy
    } else if (initialValue && blocks.isFunction(initialValue.get) && blocks.isFunction(initialValue.set)) {
      observable._dependencyType = 2; // Custom object
    }

    updateDependencies(observable);

    return observable;
  };

  function updateDependencies(observable) {
    if (observable._dependencyType) {
      observable._getDependency = blocks.bind(getDependency, observable);
      observable.on('get', observable._getDependency);
    }
  }

  function getDependency() {
    var observable = this;
    var value = observable.__value__;
    var accessor = observable._dependencyType == 1 ? value : value.get;

    Events.off(observable, 'get', observable._getDependency);
    observable._getDependency = undefined;

    Observer.startObserving();
    accessor.call(observable.__context__);
    blocks.each(Observer.stopObserving(), function (dependency) {
      //(dependency._dependencies = dependency._dependencies || []).push(observable);
      var dependencies = (dependency._dependencies = dependency._dependencies || []);
      var exists = false;
      blocks.each(dependencies, function (value) {
        if (observable === value) {
          exists = true;
          return false;
        }
      });
      if (!exists) {
        dependencies.push(observable);
      }
    });
  }

  function getObservableValue(observable) {
    var context = observable.__context__;
    return observable._dependencyType == 1 ? observable.__value__.call(context)
      : observable._dependencyType == 2 ? observable.__value__.get.call(context)
      : observable.__value__;
  }

  blocks.extend(blocks.observable, {
    getIndex: function (observable, index, forceGet) {
      if (!blocks.isObservable(observable)) {
        return blocks.observable(index);
      }
      var indexes = observable._indexes;
      var $index;

      if (indexes) {
        if (indexes.length == observable.__value__.length || forceGet) {
          $index = indexes[index];
        } else {
          $index = blocks.observable(index);
          indexes.push($index);
        }
      } else {
        $index = blocks.observable(index);
      }

      return $index;
    },

    fn: {
      base: {
        __identity__: OBSERVABLE,

        /**
         * Updates all elements, expressions and dependencies where the observable is used
         *
         * @memberof blocks.observable
         * @returns {blocks.observable} Returns the observable itself - return this;
         */
        update: function () {
          var elements = this._elements;
          var domQuery;
          var context;
          var element;
          var offset;
          var value;

          blocks.eachRight(this._expressions, function updateExpression(expression) {
            element = expression.element;
            context = expression.context;

            if (!element) {
              element = expression.element = ElementsData.data(expression.elementId).dom;
            }

            try {
              value = blocks.unwrap(parameterQueryCache[expression.expression](context));
            } catch (ex) {
              value = '';
            }

            value = value == null ? '' : value.toString();

            offset = expression.length - value.length;
            expression.length = value.length;

            if (expression.attr) {
              element.setAttribute(expression.attr, Expression.GetValue(context, null, expression.entire));
            } else {
              if (element.nextSibling) {
                element = element.nextSibling;
                element.nodeValue = value + element.nodeValue.substring(expression.length + offset);
              } else {
                element.parentNode.appendChild(document.createTextNode(value));
              }
            }
          });

          for (var i = 0; i < elements.length; i++) {
            value = elements[i];
            element = value.element;
            if (!element && ElementsData.data(value.elementId)) {
              element = value.element = ElementsData.data(value.elementId).dom;
              if (!element) {
                element = ElementsData.data(value.elementId).virtual;
              }
            }
            if (document.body.contains(element) || VirtualElement.Is(element)) {
              domQuery = blocks.domQuery(element);
              domQuery.contextBubble(value.context, function () {
                domQuery.executeMethods(element, value.cache);
              });
            } else {
              elements.splice(i, 1);
              i -= 1;
            }
          }

          blocks.each(this._dependencies, function updateDependency(dependency) {
            updateDependencies(dependency);
            dependency.update();
          });

          blocks.each(this._indexes, function updateIndex(observable, index) {
            observable(index);
          });

          return this;
        },


        on: function (eventName, callback, thisArg) {
          Events.on(this, eventName, callback, thisArg || this.__context__);
          return this;
        },

        once: function (eventName, callback, thisArg) {
          Events.once(this, eventName, callback, thisArg || this.__context__);
          return this;
        },

        off: function (eventName, callback) {
          Events.off(this, eventName, callback);
          return this;
        },

        /**
         * Extends the current observable with particular functionality depending on the parameters
         * specified. If the method is called without arguments and jsvalue framework is included
         * the observable will be extended with the methods available in jsvalue for the current type
         *
         * @memberof blocks.observable
         * @param {String} [name] -
         * @param {...*} [options]
         * @returns {*} - The result of the extend or the observable itself
         *
         * @example {javascript}
         * blocks.observable.formatter = function () {
         *   // your code here
         * };
         *
         * // extending using the formatter extender
         * var data = blocks.observable([1, 2, 3]).extend('formatter');
         *
         */
        extend: function (name /*, options*/) {
          var extendFunc = blocks.observable[name];
          var result;

          if (arguments.length === 0) {
            if (blocks.core.expressionsCreated) {
              blocks.core.applyExpressions(blocks.type(this()), this);
            }
            return this;
          } else if (extendFunc) {
            result = extendFunc.apply(this, blocks.toArray(arguments).slice(1));
            return blocks.isObservable(result) ? result : this;
          }
        },

        clone: function (cloneValue) {
          var value = this.__value__;
          return blocks.observable(cloneValue ? blocks.clone(value) : value, this.__context__);
        },

        toString: function () {
          var context = this.__context__;
          var value = this._dependencyType == 1 ? this.__value__.call(context)
            : this._dependencyType == 2 ? this.__value__.get.call(context)
            : this.__value__;

          Observer.registerObservable(this);

          if (value != null && blocks.isFunction(value.toString)) {
            return value.toString();
          }
          return String(value);
        }
      },

      /**
       * @memberof blocks.observable
       * @class array
       */
      array: {

        /**
         * Removes all items from the collection and replaces them with the new value provided.
         * The value could be Array, observable array or jsvalue.Array
         *
         * @memberof array
         * @param {Array} value - The new value that will be populated
         * @returns {blocks.observable} - Returns the observable itself - return this;
         *
         * @example {javascript}
         * // creates an observable array with [1, 2, 3] as values
         * var items = blocks.observable([1, 2, 3]);
         *
         * // removes the previous values and fills the observable array with [5, 6, 7] values
         * items.reset([5, 6, 7]);
         */
        reset: function (value) {
          value = blocks.isArray(value) ? value : [];
          return this(value);
        },

        /**
         * Adds values to the end of the observable array
         *
         * @memberof array
         * @param {*} value - The values that will be added to the end of the array
         * @param {number} [index] - Optional index specifying where to insert the value
         * @returns {blocks.observable} - Returns the observable itself - return this;
         *
         * @example {javascript}
         * var items = blocks.observable([1, 2, 3]);
         *
         * // results in observable array with [1, 2, 3, 4] values
         * items.add(4);
         *
         */
        add: function (value, index) {
          this.splice(blocks.isNumber(index) ? index : this.__value__.length, 0, value);

          return this;
        },

        /**
         * Adds the values from the provided array(s) to the end of the collection
         *
         * @memberof array
         * @param {Array} value - The array that will be added to the end of the array
         * @param {number} [index] - Optional position where the array of values to be inserted
         * @returns {blocks.observable} - Returns the observable itself - return this;
         *
         * @example {javascript}
         * var items = blocks.observable([1, 2, 3]);
         *
         * // results in observable array with [1, 2, 3, 4, 5, 6] values
         * items.addMany([4, 5], [6]);
         */
        addMany: function (value, index) {
          this.splice.apply(this, [blocks.isNumber(index) ? index : this.__value__.length, 0].concat(blocks.toArray(value)));
          return this;
        },

        /**
         * Swaps two values in the observable array.
         * Note: Faster than removing the items and adding them at the locations
         *
         * @memberof array
         * @param {number} indexA - The first index that points to the index in the array that will be swapped
         * @param {number} indexB - The second index that points to the index in the array that will be swapped
         * @returns {blocks.observable} - Returns the observable itself - return this;
         *
         * @example {javascript}
         * var items = blocks.observable([4, 2, 3, 1]);
         *
         * // results in observable array with [1, 2, 3, 4] values
         * items.swap(0, 3);
         */
        swap: function (indexA, indexB) {
          var array = this();
          var elements = this._elements;
          var chunkManager = this._chunkManager;
          var element;

          blocks.swap(array, indexA, indexB);

          for (var i = 0; i < elements.length; i++) {
            element = elements[i].element;
            if (indexA > indexB) {
              chunkManager.insertAt(element, indexA, chunkManager.getAt(element, indexB));
              chunkManager.insertAt(element, indexB, chunkManager.getAt(element, indexA));
            } else {
              chunkManager.insertAt(element, indexB, chunkManager.getAt(element, indexA));
              chunkManager.insertAt(element, indexA, chunkManager.getAt(element, indexB));
            }
          }

          return this;
        },

        /**
         * Moves an item from one location to another in the array.
         * Note: Faster than removing the item and adding it at the location
         *
         * @memberof array
         * @param {number} sourceIndex - The index pointing to the item that will be moved
         * @param {number} targetIndex - The index where the item will be moved to
         * @returns {blocks.observable} - Returns the observable itself - return this;
         *
         * @example {javascript}
         * var items = blocks.observable([1, 4, 2, 3, 5]);
         *
         * // results in observable array with [1, 2, 3, 4, 5] values
         * items.move(1, 4);
         */
        move: function (sourceIndex, targetIndex) {
          var array = this();
          var elements = this._elements;
          var chunkManager = this._chunkManager;
          var element;

          blocks.move(array, sourceIndex, targetIndex);

          if (targetIndex > sourceIndex) {
            targetIndex++;
          }

          for (var i = 0; i < elements.length; i++) {
            element = elements[i].element;
            chunkManager.insertAt(element, targetIndex, chunkManager.getAt(element, sourceIndex));
          }

          return this;
        },

        /**
         * Removes an item from the observable array
         *
         * @memberof array
         * @param {[type]}   position [description]
         * @param {Function} callback [description]
         * @returns {blocks.observable} - Returns the observable itself - return this;
         *
         * @example {javascript}
         *
         */
        remove: function (callback, thisArg) {
          return this.removeAll(callback, thisArg, true);
        },

        /**
         * Removes an item at the specified index
         *
         * @memberof array
         * @param {number} index - The index location of the item that will be removed
         * @param {number} [count] - Optional parameter that if specified will remove
         * the next items starting from the specified index
         * @returns {blocks.observable} - Returns the observable itself - return this;
         */
        removeAt: function (index, count) {
          if (!blocks.isNumber(count)) {
            count = 1;
          }
          this.splice(index, count);

          return this;
        },

        /**
         * Removes all items from the observable array and optionally filter which items
         * to be removed by providing a callback
         *
         * @memberof array
         * @param {Function} [callback] - Optional callback function which filters which items
         * to be removed. Returning a truthy value will remove the item and vice versa
         * @param {*}  [thisArg] - Optional this context for the callback function
         * @param {blocks.observable} - Returns the observable itself - return this;
         */
        removeAll: function (callback, thisArg, removeOne) {
          var array = this.__value__;
          var chunkManager = this._chunkManager;
          var items;
          var i;

          if (arguments.length === 0) {
            if (Events.has(this, 'removing') || Events.has(this, 'remove')) {
              items = blocks.clone(array);
            }
            Events.trigger(this, 'removing', {
              type: 'removing',
              items: items,
              index: 0
            });

            chunkManager.removeAll();

            //this._indexes.splice(0, array.length);
            this._indexes = [];
            items = array.splice(0, array.length);
            Events.trigger(this, 'remove', {
              type: 'remove',
              items: items,
              index: 0
            });
          } else {
            var isCallbackAFunction = blocks.isFunction(callback);
            var value;

            for (i = 0; i < array.length; i++) {
              value = array[i];
              if (value === callback || (isCallbackAFunction && callback.call(thisArg, value, i, array))) {
                this.splice(i, 1);
                i -= 1;
                if (removeOne) {
                  break;
                }
              }
            }
          }

          this.update();

          return this;
        },

        //#region Base

        /**
         * The concat() method is used to join two or more arrays
         *
         * @memberof array
         * @param {...Array} The arrays to be joined
         * @returns {Array} The joined array
         */
        concat: function () {
          var array = this();
          return array.concat.apply(array, blocks.toArray(arguments));
        },

        //
        /**
         * The slice() method returns the selected elements in an array, as a new array object
         *
         * @memberof array
         * @param {number} start An integer that specifies where to start the selection (The first element has an index of 0)
         * @param {number} [end] An integer that specifies where to end the selection. If omitted, all elements from the start
         * position and to the end of the array will be selected. Use negative numbers to select from the end of an array
         * @returns {Array} A new array, containing the selected elements
         */
        slice: function (start, end) {
          if (arguments.length > 1) {
            return this().slice(start, end);
          }
          return this().slice(start);
        },

        /**
         * The join() method joins the elements of an array into a string, and returns the string
         *
         * @memberof array
         * @param {string} [seperator=','] The separator to be used. If omitted, the elements are separated with a comma
         * @returns {string} The array values, separated by the specified separator
         */
        join: function (seperator) {
          if (arguments.length > 0) {
            return this().join(seperator);
          }
          return this().join();
        },

        ///**
        // * The indexOf() method returns the position of the first occurrence of a specified value in a string.
        // * @param {*} item The item to search for.
        // * @param {number} [index=0] Where to start the search. Negative values will start at the given position counting from the end, and search to the end.
        // * @returns {number} The position of the specified item, otherwise -1
        // */
        //indexOf: function (item, index) {
        //    return blocks.indexOf(this(), item, index);
        //},


        ///**
        // * The lastIndexOf() method returns the position of the last occurrence of a specified value in a string.
        // * @param {*} item The item to search for.
        // * @param {number} [index=0] Where to start the search. Negative values will start at the given position counting from the end, and search to the beginning.
        // * @returns {number} The position of the specified item, otherwise -1.
        // */
        //lastIndexOf: function (item, index) {
        //    var array = this();
        //    if (arguments.length > 1) {
        //        return blocks.lastIndexOf(array, item, index);
        //    }
        //    return blocks.lastIndexOf(array, item);
        //},

        //#endregion

        /**
         * The pop() method removes the last element of a observable array, and returns that element
         *
         * @memberof array
         * @returns {*} The removed array item
         */
        pop: function () {
          var that = this;
          var array = that();

          return that.splice(array.length - 1, 1)[0];
        },

        /**
         * The push() method adds new items to the end of the observable array, and returns the new length
         *
         * @memberof array
         * @param {...*} values - The item(s) to add to the observable array
         * @returns {number} The new length of the observable array
         */
        push: function () {
          this.addMany(arguments);
          return this.__value__.length;
        },

        /**
         * Reverses the order of the elements in the observable array
         *
         * @memberof array
         * @returns {Array} The array after it has been reversed
         */
        reverse: function () {
          var array = this().reverse();
          var chunkManager = this._chunkManager;

          this._indexes.reverse();

          chunkManager.each(function (domElement) {
            for (var j = 1; j < array.length; j++) {
              chunkManager.insertAt(domElement, 0, chunkManager.getAt(domElement, j));
            }
          });

          this.update();

          return array;
        },

        /**
         * Removes the first element of a observable array, and returns that element
         *
         * @memberof array
         * @returns {*} The removed array item
         */
        shift: function () {
          return this.splice(0, 1)[0];
          //returns - The removed array item
        },

        /**
         * Sorts the elements of an array
         *
         * @memberof array
         * @param {Function} [sortfunction] - A function that defines the sort order
         * @returns {Array} - The Array object, with the items sorted
         */
        sort: function (sortfunction) {
          var array = this.__value__;
          var length = array.length;
          var useSortFunction = arguments.length > 0;
          var chunkManager = this._chunkManager;
          var indexes = this._indexes;
          var i = 0;
          var j;
          var item;

          for (; i < length; i++) {
            var result = [array[i], i];

            chunkManager.each(function (domElement) {
              result.push(chunkManager.getAt(domElement, i));
            });
            //if (!useSortFunction) { // TODO: Test performance
            //    result.toString = function () { return this[0]; }
            //}
            array[i] = result;
          }

          //if (useSortFunction) { // TODO: Test performance
          //    array.sort(function (a, b) {
          //        return sortfunction.call(this, a[0], b[0])
          //    });
          //}

          // TODO: Test performance (Comment)
          array.sort(function (a, b) {
            a = a[0];
            b = b[0];
            if (useSortFunction) {
              return sortfunction.call(this, a, b);
            }
            if (a < b) {
              return -1;
            }
            if (a > b) {
              return 1;
            }
            return 0;
          });

          if (indexes.length > 0) {
            this._indexes = [];
          }

          for (i = 0; i < length; i++) {
            item = array[i];
            if (indexes.length > 0) {
              this._indexes.push(indexes[item[1]]);
            }

            j = 2;
            chunkManager.each(function (domElement) {
              chunkManager.insertAt(domElement, length, item[j]);
              j++;
            });
            array[i] = item[0];
          }

          this.update();

          //chunkManager.dispose();

          return array;
        },

        /**
         * Adds and/or removes elements from the observable array
         *
         * @memberof array
         * @param {number} index An integer that specifies at what position to add/remove items.
         * Use negative values to specify the position from the end of the array.
         * @param {number} howMany The number of items to be removed. If set to 0, no items will be removed.
         * @param {...*} The new item(s) to be added to the array.
         * @returns {Array} A new array containing the removed items, if any.
         */
        splice: function (index, howMany) {
          var _this = this;
          var array = this.__value__;
          var indexes = this._indexes;
          var chunkManager = this._chunkManager;
          var returnValue = [];
          var args = arguments;
          var addItems;

          index = index < 0 ? array.length - index : index;

          if (howMany && index < array.length && index >= 0) {
            howMany = Math.min(array.length - index, howMany);
            returnValue = array.slice(index, index + howMany);
            Events.trigger(this, 'removing', {
              type: 'removing',
              items: returnValue,
              index: index
            });

            chunkManager.each(function (domElement) {
              for (var j = 0; j < howMany; j++) {
                chunkManager.removeAt(domElement, index);
              }
            });

            ElementsData.collectGarbage();

            indexes.splice(index, howMany);
            returnValue = array.splice(index, howMany);
            Events.trigger(this, 'remove', {
              type: 'remove',
              items: returnValue,
              index: index
            });
            chunkManager.dispose();
          }

          if (args.length > 2) {
            addItems = blocks.toArray(args);
            addItems.splice(0, 2);
            Events.trigger(this, 'adding', {
              type: 'adding',
              index: index,
              items: addItems
            });

            blocks.each(addItems, function (item, i) {
              indexes.splice(index + i, 0, blocks.observable(index + i));
            });

            chunkManager.each(function (domElement, virtualElement) {
              var html = '';
              var length = addItems.length;
              var i = 0;

              var domQuery = blocks.domQuery(domElement);
              domQuery.contextBubble(blocks.context(domElement), function () {
                for (; i < length; i++) {
                  // TODO: Should be refactored in a method because
                  // the same logic is used in the each method
                  domQuery.dataIndex(blocks.observable.getIndex(_this, index + i, true));
                  domQuery.pushContext(addItems[i]);
                  html += virtualElement.renderChildren(domQuery);
                  domQuery.popContext();
                  domQuery.dataIndex(undefined);
                }
              });

              if (domElement.childNodes.length === 0) {
                (new HtmlElement(domElement)).html(html);
                //domElement.innerHTML = html;
                domQuery.createElementObservableDependencies(domElement.childNodes);
              } else {
                var fragment = domQuery.createFragment(html);
                chunkManager.insertAt(domElement, index, fragment);
              }
            });

            array.splice.apply(array, [index, 0].concat(addItems));
            Events.trigger(this, 'add', {
              type: 'add',
              index: index,
              items: addItems
            });
          }

          // TODO: Explain why this is here. Fixes a bug.
          chunkManager.dispose();

          this.update();
          return returnValue;
        },

        /**
         * The unshift() method adds new items to the beginning of an array, and returns the new length.
         *
         * @memberof array
         * @this {blocks.observable}
         * @param {...*} The new items that will be added to the beginning of the observable array.
         * @returns {number} The new length of the observable array.
         */
        unshift: function () {
          this.addMany(arguments, 0);
          return this.__value__.length;
        }
      }
    }
  });
});
