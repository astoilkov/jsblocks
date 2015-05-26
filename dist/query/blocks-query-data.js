/*!
 * jsblocks JavaScript Library v@VERSION
 * http://jsblocks.com/
 *
 * Copyright 2014, Antonio Stoilkov
 * Released under the MIT license
 * http://jsblocks.org/license
 *
 * Date: @DATE
 */
(function(global, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory(global, true);
  } else {
    factory(global);
  }

  // Pass this if window is not defined yet
}(typeof window !== 'undefined' ? window : this, function(global, noGlobal) {
  var toString = Object.prototype.toString;
  var slice = Array.prototype.slice;
  var hasOwn = Object.prototype.hasOwnProperty;
  var support = {};
  var core = {};

  /**
  * @namespace blocks
  */
  var blocks = function (value) {
    if (core.expressionsCreated) {
      if (arguments.length === 0) {
        return core.staticExpression;
      }
      return core.createExpression(value);
      //return core.createExpression(blocks.unwrap(value));
    }
    return value;
  };

  blocks.version = '0.3.2';
  blocks.core = core;

  /**
   * Copies properties from all provided objects into the first object parameter
   *
   * @memberof blocks
   * @param {Object} obj
   * @param {...Object} objects
   * @returns {Object}
   */
  blocks.extend = function() {
    var src, copyIsArray, copy, name, options, clone,
      target = arguments[0] || {},
      i = 1,
      length = arguments.length,
      deep = false;

    // Handle a deep copy situation
    if (typeof target === 'boolean') {
      deep = target;
      target = arguments[1] || {};
      // skip the boolean and the target
      i = 2;
    }

    // Handle case when target is a string or something (possible in deep copy)
    if (typeof target !== 'object' && !blocks.isFunction(target)) {
      target = {};
    }

    for (; i < length; i++) {
      // Only deal with non-null/undefined values
      if ((options = arguments[i]) != null) {
        // Extend the base object
        for (name in options) {
          src = target[name];
          copy = options[name];

          // Prevent never-ending loop
          if (target === copy) {
            continue;
          }

          // Recurse if we're merging plain objects or arrays
          if (deep && copy && (blocks.isPlainObject(copy) || (copyIsArray = blocks.isArray(copy)))) {
            if (copyIsArray) {
              copyIsArray = false;
              clone = src && blocks.isArray(src) ? src : [];
            } else {
              clone = src && blocks.isPlainObject(src) ? src : {};
            }

            // Never move original objects, clone them
            target[name] = blocks.extend(deep, clone, copy);

          } else {
            target[name] = copy;
          }
        }
      }
    }

    // Return the modified object
    return target;
  };

  /**
   * @callback iterateCallback
   * @param {*} value - The value
   * @param {(number|string)} indexOrKey - Index or key
   * @param {(Array|Object)} collection - The collection that is being iterated
   */

  /**
   * Iterates over the collection
   *
   * @memberof blocks
   * @param {(Array|Object)} collection - The array or object to iterate over
   * @param {Function} callback - The callback that will be executed for each element in the collection
   * @param {*} [thisArg] - Optional this context for the callback
   *
   * @example {javascript}
   * blocks.each([3, 1, 4], function (value, index, collection) {
   *   // value is the current item (3, 1 and 4)
   *   // index is the current index (0, 1 and 2)
   *   // collection points to the array passed to the function - [3, 1, 4]
   * });
   */
  blocks.each = function(collection, callback, thisArg) {
    if (collection == null) {
      return;
    }

    var length = collection.length;
    var indexOrKey = -1;
    var isArray = typeof length == 'number';

    callback = parseCallback(callback, thisArg);

    if (isArray) {
      while (++indexOrKey < length) {
        if (callback(collection[indexOrKey], indexOrKey, collection) === false) {
          break;
        }
      }
    } else {
      for (indexOrKey in collection) {
        if (callback(collection[indexOrKey], indexOrKey, collection) === false) {
          break;
        }
      }
    }
  };

  /**
   * Iterates over the collection from end to start
   *
   * @memberof blocks
   * @param {(Array|Object)} collection - The array or object to iterate over
   * @param {Function} callback - The callback that will be executed for each element in the collection
   * @param {*} [thisArg] - Optional this context for the callback
   *
   * @example {javascript}
   * blocks.eachRight([3, 1, 4], function (value, index, collection) {
   *   // value is the current item (4, 1 and 3)
   *   // index is the current index (2, 1 and 0)
   *   // collection points to the array passed to the function - [3, 1, 4]
   * });
   */
  blocks.eachRight = function(collection, callback, thisArg) {
    if (collection == null) {
      return;
    }

    var length = collection.length,
      indexOrKey = collection.length,
      isCollectionAnArray = typeof length == 'number';

    callback = parseCallback(callback, thisArg);

    if (isCollectionAnArray) {
      while (--indexOrKey >= 0) {
        callback(collection[indexOrKey], indexOrKey, collection);
      }
    } else {
      for (indexOrKey in collection) {
        callback(collection[indexOrKey], indexOrKey, collection);
      }
    }
  };

  blocks.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(type) {
    blocks['is' + type] = function(obj) {
      return toString.call(obj) == '[object ' + type + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable 'Arguments' type.
  if (!blocks.isArguments(arguments)) {
    blocks.isArguments = function(obj) {
      return !!(obj && hasOwn.call(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof(/./) !== 'function') {
    blocks.isFunction = function(obj) {
      return !!(obj && typeof obj === 'function');
    };
  }

  /**
   * Determines if a value is an array.
   * Returns false for array like objects (for example arguments object)
   *
   * @memberof blocks
   * @param {*} value - The value to check if it is an array
   * @returns {boolean} - Whether the value is an array
   *
   * @example {javascript}
   * blocks.isArray([1, 2, 3]);
   * // -> true
   *
   * function calculate() {
   *   blocks.isArray(arguments);
   *   // -> false
   * }
   */
  blocks.isArray = Array.isArray || function(value) {
    return toString.call(value) == '[object Array]';
  };

  blocks.extend(blocks, {

    /**
     * Represents a dummy empty function
     *
     * @memberof blocks
     * @returns {Function} - Empty function
     *
     * @example {javascript}
     * function max(collection, callback) {
     *   callback = callback || blocks.noop;
     * }
     */
    noop: function() {},

    inherit: function(BaseClass, Class, prototype) {
      if ((arguments.length < 3 && blocks.isPlainObject(Class)) || arguments.length == 1) {
        prototype = Class;
        Class = BaseClass;
        BaseClass = undefined;
      }

      if (BaseClass) {
        Class.prototype = objectCreate(BaseClass.prototype);
        Class.prototype.constructor = Class;
        blocks.extend(Class.prototype, prototype);
        Class.prototype.__Class__ = BaseClass;
        Class.prototype._super = _super;
      } else if (prototype) {
        Class.prototype = prototype;
      }

      return Class;
    },

    /**
     * Determines the true type of an object
     *
     * @memberof blocks
     * @param {*} value - The value for which to determine its type
     * @returns {string} - Returns the type of the value as a string
     *
     * @example {javascript}
     * blocks.type('a string');
     * // -> string
     *
     * blocks.type(314);
     * // -> number
     *
     * blocks.type([]);
     * // -> array
     *
     * blocks.type({});
     * // -> object
     *
     * blocks.type(blocks.noop);
     * // -> function
     *
     * blocks.type(new RegExp());
     * // -> regexp
     *
     * blocks.type(undefined);
     * // -> undefined
     *
     * blocks.type(null);
     * // -> null
     */
    type: function(value) {
      if (value instanceof Array) {
        return 'array';
      }
      if (typeof value == 'string' || value instanceof String) {
        return 'string';
      }
      if (typeof value == 'number' || value instanceof Number) {
        return 'number';
      }
      if (value instanceof Date) {
        return 'date';
      }
      if (toString.call(value) === '[object RegExp]') {
        return 'regexp';
      }
      if (value === null) {
        return 'null';
      }
      if (value === undefined) {
        return 'undefined';
      }

      if (blocks.isFunction(value)) {
        return 'function';
      }

      if (blocks.isBoolean(value)) {
        return 'boolean';
      }

      return 'object';
    },

    /**
     * Determines if a specific value is the specified type
     *
     * @memberof blocks
     * @param {*} value - The value
     * @param {string} type - The type
     * @returns {boolean} - If the value is from the specified type
     *
     * @example {javascript}
     * blocks.is([], 'array');
     * // -> true
     *
     * blocks.is(function () {}, 'object');
     * // -> false
     */
    is: function(value, type) {
      if (arguments.length > 1 && blocks.isFunction(type)) {
        return type.prototype.isPrototypeOf(value);
      }
      return blocks.type(value) == type;
    },

    /**
     * Checks if a variable has the specified property.
     * Uses hasOwnProperty internally
     *
     * @memberof blocks
     * @param {*} obj - The object to call hasOwnPrototype for
     * @param {String} key - The key to check if exists in the object
     * @returns {boolean} Returns if the key exists in the provided object
     *
     * @example {javascript}
     * blocks.has({
     *   price: undefined
     * }, 'price');
     * // -> true
     *
     * blocks.has({
     *   price: 314
     * }, 'ratio');
     * // -> false
     */
    has: function(obj, key) {
      return !!(obj && hasOwn.call(obj, key));
    },

    hasValue: function(value) {
      return value != null && (!blocks.isNumber(value) || !isNaN(value));
    },

    toString: function(value) {
      // TODO: Implement and make tests
      var result = '';
      if (blocks.hasValue(value)) {
        result = value.toString();
      }
      return result;
    },

    /**
     * Unwraps a jsblocks value to its raw representation.
     * Unwraps blocks.observable() and blocks() values
     *
     * @memberof blocks
     * @param {*} value - The value that will be unwrapped
     * @returns {*} The unwrapped value
     *
     * @example {javascript}
     * blocks.unwrap(blocks.observable(314));
     * // -> 314
     *
     * blocks.unwrap(blocks([3, 1, 4]));
     * // -> [3, 1, 4]
     *
     * blocks.unwrap('a string or any other value will not be changed');
     * // -> 'a string or any other value will not be changed'
     */
    unwrap: function(value) {
      if (core.expressionsCreated && core.isExpression(value)) {
        return value.value();
      }

      if (blocks.unwrapObservable) {
        return blocks.unwrapObservable(value);
      }
      return value;
    },

    /**
     * Unwraps a jQuery instance and returns the first element
     *
     * @param {*} element - If jQuery element is specified it will be unwraped
     * @returns {*} - The unwraped value
     *
     * @example {javascript}
     * var articles = $('.article');
     * blocks.$unwrap()
     */
    $unwrap: function(element, callback, thisArg) {
      callback = parseCallback(callback, thisArg);

      if (element && element.jquery) {
        if (callback) {
          element.each(function () {
            callback(this);
          });
        }
        element = element[0];
      } else {
        if (callback) {
          callback(element);
        }
      }

      return element;
    },

    /**
     * Converts a value to an array. Arguments object is converted to array
     * and primitive values are wrapped in an array. Does nothing when value
     * is already an array
     *
     * @memberof blocks
     * @param {*} value - The value to be converted to an array
     * @returns {Array} - The array
     *
     * @example {javascript}
     * blocks.toArray(3);
     * // -> [3]
     *
     * function calculate() {
     *   var numbers = blocks.toArray(arguments);
     * }
     *
     * blocks.toArray([3, 1, 4]);
     * // -> [3, 1, 4]
     */
    toArray: function(value) {
      // TODO: Think if it should be removed permanantely.
      // Run tests after change to observe difference
      //if (value == null) {
      //    return [];
      //}
      if (blocks.isArguments(value)) {
        return slice.call(value);
      }
      if (blocks.isElements(value)) {
        // TODO: if not IE8 and below use slice.call
        /* jshint newcap: false */
        var result = Array(value.length);
        var index = -1;
        var length = value.length;
        while (++index < length) {
          result[index] = value[index];
        }
        return result;
      }
      if (!blocks.isArray(value)) {
        return [value];
      }
      return value;
    },

    /**
     * Converts an integer or string to a unit.
     * If the value could not be parsed to a number it is not converted
     *
     * @memberof blocks
     * @param {[type]} value - The value to be converted to the specified unit
     * @param {String} [unit='px'] - Optionally provide a unit to convert to.
     * Default value is 'px'
     *
     * @example {javascript}
     *
     * blocks.toUnit(230);
     * // -> 230px
     *
     * blocks.toUnit(230, '%');
     * // -> 230%
     *
     * blocks.toUnit('60px', '%');
     * // -> 60%
     */
    toUnit: function(value, unit) {
      var unitIsSpecified = unit;
      unit = unit || 'px';

      if (blocks.isNaN(parseFloat(value))) {
        return value;
      }

      if (blocks.isString(value) && blocks.isNaN(parseInt(value.charAt(value.length - 1), 10))) {
        if (unitIsSpecified) {
          return value.replace(/[^0-9]+$/, unit);
        }
        return value;
      }
      return value + unit;
    },

    /**
     * Clones value. If deepClone is set to true the value will be cloned recursively
     *
     * @memberof blocks
     * @param {*} value -
     * @param {boolean} [deepClone] - Description
     * @returns {*} Description
     *
     * @example {javascript}
     * var array = [3, 1, 4];
     * var cloned = blocks.clone(array);
     * // -> [3, 1, 4]
     * var areEqual = array == cloned;
     * // -> false
     */
    clone: function(value, deepClone) {
      if (value == null) {
        return value;
      }

      var type = blocks.type(value);
      var clone;
      var key;

      if (type == 'array') {
        return value.slice(0);
      } else if (type == 'object') {
        if (value.constructor === Object) {
          clone = {};
        } else {
          clone = new value.constructor();
        }

        for (key in value) {
          clone[key] = deepClone ? blocks.clone(value[key], true) : value[key];
        }
        return clone;
      } else if (type == 'date') {
        return new Date(value.getFullYear(), value.getMonth(), value.getDate(),
          value.getHours(), value.getMinutes(), value.getSeconds(), value.getMilliseconds());
      } else if (type == 'string') {
        return value.toString();
      } else if (type == 'regexp') {
        var flags = '';
        if (value.global) {
          flags += 'g';
        }
        if (value.ignoreCase) {
          flags += 'i';
        }
        if (value.multiline) {
          flags += 'm';
        }
        clone = new RegExp(value.source, flags);
        clone.lastIndex = value.lastIndex;
        return clone;
      }

      return value;
    },

    /**
     * Determines if the specified value is a HTML elements collection
     *
     * @memberof blocks
     * @param {*} value - The value to check if it is elements collection
     * @returns {boolean} - Returns whether the value is elements collection
     */
    isElements: function(value) {
      var isElements = false;
      if (value) {
        if (typeof HTMLCollection != 'undefined') {
          isElements = value instanceof window.HTMLCollection;
        }
        if (typeof NodeList != 'undefined' && !isElements) {
          isElements = value instanceof NodeList;
        }
        if (!isElements && blocks.isString(value.item)) {
          try {
            value.item(0);
            isElements = true;
          } catch (e) {}
        }
      }
      return isElements;
    },

    /**
     * Determines if the specified value is a HTML element
     *
     * @memberof blocks
     * @param {*} value - The value to check if it is a HTML element
     * @returns {boolean} - Returns whether the value is a HTML element
     *
     * @example {javascript}
     * blocks.isElement(document.body);
     * // -> true
     *
     * blocks.isElement({});
     * // -> false
     */
    isElement: function(value) {
      return !!(value && value.nodeType === 1);
    },

    /**
     * Determines if a the specified value is a boolean.
     *
     * @memberof blocks
     * @param {*} value - The value to be checked if it is a boolean
     * @returns {boolean} - Whether the value is a boolean or not
     *
     * @example {javascript}
     * blocks.isBoolean(true);
     * // -> true
     *
     * blocks.isBoolean(new Boolean(false));
     * // -> true
     *
     * blocks.isBoolean(1);
     * // -> false
     */
    isBoolean: function(value) {
      return value === true || value === false || toString.call(value) == '[object Boolean]';
    },

    /**
     * Determines if the specified value is an object
     *
     * @memberof blocks
     * @param {[type]} obj - The value to check for if it is an object
     * @returns {boolean} - Returns whether the value is an object
     */
    isObject: function(obj) {
      return obj === Object(obj);
    },

    /**
     * Determines if a value is a object created using {} or new Object
     *
     * @memberof blocks
     * @param {*} obj - The value that will be checked
     * @returns {boolean} - Whether the value is a plain object or not
     *
     * @example {javascript}
     * blocks.isPlainObject({ property: true });
     * // -> true
     *
     * blocks.isPlainObject(new Object());
     * // -> true
     *
     * function Car () {
     *
     * }
     *
     * blocks.isPlainObject(new Car());
     * // -> false
     */
    isPlainObject: function(obj) {
      var key;

      // Must be an Object.
      // Because of IE, we also have to check the presence of the constructor property.
      // Make sure that DOM nodes and window objects don't pass through, as well
      if (!obj || typeof obj !== 'object' || toString.call(obj) !== '[object Object]' || obj.nodeType || obj.window == obj) {
        return false;
      }

      try {
        // Not own constructor property must be Object
        if (obj.constructor && !hasOwn.call(obj, 'constructor') && !hasOwn.call(obj.constructor.prototype, 'isPrototypeOf')) {
          return false;
        }
      } catch (e) {
        // IE8,9 Will throw exceptions on certain host objects #9897
        return false;
      }

      // Support: IE<9
      // Handle iteration over inherited properties before own properties.
      if (support.ownPropertiesAreLast) {
        for (key in obj) {
          return hasOwn.call(obj, key);
        }
      }

      // Own properties are enumerated firstly, so to speed up,
      // if last one is own, then all properties are own.
      // jshint noempty: false
      // Disable JSHint error: Empty blocks. This option warns when you have an empty block in your code.
      for (key in obj) {}

      return key === undefined || hasOwn.call(obj, key);
    },

    isFinite: function(value) {
      return isFinite(value) && !blocks.isNaN(parseFloat(value));
    },

    isNaN: function(value) {
      return blocks.isNumber(value) && value != +value;
    },

    isNull: function(value) {
      return value === null;
    },

    isUndefined: function(value) {
      return value === undefined;
    },

    nothing: {},

    access: function(obj, path, defaultValue) {
      var index = 0;
      var name;

      defaultValue = arguments.length > 2 ? defaultValue : blocks.nothing;
      path = path.split('.');
      name = path[0];

      while (name) {
        if (obj == null) {
          return defaultValue;
        }
        obj = obj[name];
        name = path[++index];
      }
      return obj;
    },

    swap: function(array, indexA, indexB) {
      var length = array.length;
      if (indexA >= 0 && indexB >= 0 && indexA < length && indexB < length) {
        array[indexA] = array[indexB] + (array[indexB] = array[indexA], 0);
      }
      return array;
    },

    move: function(array, sourceIndex, targetIndex) {
      if (sourceIndex != targetIndex) {
        if (sourceIndex <= targetIndex) {
          targetIndex++;
        }
        array.splice(targetIndex, 0, array[sourceIndex]);
        if (sourceIndex > targetIndex) {
          sourceIndex++;
        }
        array.splice(sourceIndex, 1);
      }
      return array;
    },

    /**
     * Changes the this binding to a function and optionally passes additional parameters to the
     * function
     *
     * @memberof blocks
     * @param {Function} func - The function for which to change the this binding and optionally
     * add arguments
     * @param {*} thisArg - The new this binding context value
     * @param {...*} [args] - Optional arguments that will be passed to the function
     * @returns {Function} - The newly created function having the new this binding and optional
     * arguments
     *
     * @example {javascript}
     * var alert = blocks.bind(function () {
     *   alert(this);
     * }, 'Hello bind method!');
     *
     * alert();
     * // -> alerts 'Hello bind method'
     *
     * var alertAll = blocks.bind(function (firstName, lastName) {
     *   alert('My name is ' + firstName + ' ' + lastName);
     * }, null, 'John', 'Doe');
     *
     * alertAll();
     * // -> alerts 'My name is John Doe'
     */
    bind: function(func, thisArg) {
      var Class = function() {};
      var args = slice.call(arguments, 2);
      var bound;

      bound = function() {
        if (!(this instanceof bound)) {
          return func.apply(thisArg, args.concat(slice.call(arguments)));
        }
        Class.prototype = func.prototype;
        var self = new Class();
        //Class.prototype = null;
        var result = func.apply(self, args.concat(slice.call(arguments)));
        if (Object(result) === result) {
          return result;
        }
        return self;
      };
      return bound;
    },

    /**
     * Determines if two values are deeply equal.
     * Set deepEqual to false to stop recusively equality checking
     *
     * @memberof blocks
     * @param {*} a - The first object to be campared
     * @param {*} b - The second object to be compared
     * @param {boolean} [deepEqual] - Determines if the equality check will recursively check all
     * child properties
     * @returns {boolean} - Whether the two values are equal
     *
     * @example {javascript}
     * blocks.equals([3, 4], [3, 4]);
     * // -> true
     *
     * blocks.equals({ value: 7 }, { value: 7, result: 1});
     * // -> false
     */
    equals: function(a, b, deepEqual) {
      // TODO: deepEqual could accept a Number which represents the levels it could go in the recursion
      a = blocks.unwrap(a);
      b = blocks.unwrap(b);
      return equals(a, b, [], [], deepEqual);
    }
  });

  // Internal recursive comparison function for `isEqual`.
  function equals(a, b, aStack, bStack, deepEqual) {
    if (deepEqual !== false) {
      deepEqual = true;
    }

    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) {
      return a !== 0 || 1 / a == 1 / b;
    }

    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) {
      return a === b;
    }

    // Unwrap any wrapped objects.
    if (a instanceof blocks) {
      a = a._wrapped;
    }
    if (b instanceof blocks) {
      b = b._wrapped;
    }

    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) {
      return false;
    }

    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `'5'` is
        // equivalent to `new String('5')`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a === 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
        // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
          a.global == b.global &&
          a.multiline == b.multiline &&
          a.ignoreCase == b.ignoreCase;
    }

    if (typeof a != 'object' || typeof b != 'object') {
      return false;
    }

    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) {
        return bStack[length] == b;
      }
    }

    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor,
      bCtor = b.constructor;
    if (aCtor !== bCtor && !(blocks.isFunction(aCtor) && (aCtor instanceof aCtor) &&
        blocks.isFunction(bCtor) && (bCtor instanceof bCtor)) &&
      ('constructor' in a && 'constructor' in b)) {
      return false;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    var size = 0,
      result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = (deepEqual ? equals(a[size], b[size], aStack, bStack, deepEqual) : a[size] === b[size]))) {
            break;
          }
        }
      }
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (blocks.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = blocks.has(b, key) && (deepEqual ? equals(a[key], b[key], aStack, bStack, deepEqual) : a[key] === b[key]))) {
            break;
          }
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (blocks.has(b, key) && !(size--)) {
            break;
          }
        }
        result = !size;
      }
    }

    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  }

  blocks.at = function (index) {
    return {
      index: index,
      prototypeIndentification: '__blocks.at__'
    };
  };

  blocks.first = function () {
    return blocks.first;
  };

  blocks.last = function () {
    return blocks.last;
  };

  function _super(name, args) {
    var Class = this.__Class__;
    var result;
    var func;

    if (blocks.isString(name)) {
      func = Class.prototype[name];
    } else {
      args = name;
      func = Class;
    }

    this.__Class__ = Class.prototype.__Class__;
    result = func.apply(this, args || []);
    this.__Class__ = Class;

    return result;
  }

  var objectCreate = Object.create || function(prototype) {
    var Class = function() {};
    Class.prototype = prototype;
    return new Class();
  };

  for (var key in [support]) {
    break;
  }
  support.ownPropertiesAreLast = key != '0';

  function parseCallback(callback, thisArg) {
    if (thisArg != null) {
      var orgCallback = callback;
      callback = function(value, index, collection) {
        return orgCallback.call(thisArg, value, index, collection);
      };
    }
    return callback;
  }

  (function () {
    // @debug-code
  })();

  (function () {
    
(function () {


  var blocksAt = blocks.at;
  blocks.at = function (index) {
    return {
      index: index,
      prototypeIndentification: '__blocks.at__'
    };
  };

  blocks.first = function () {
    return blocks.first;
  };

  blocks.last = function () {
    return blocks.last;
  };

  var positions = {
    isPosition: function (position) {
      return position == blocks.first || position == blocks.last || (position && position.prototypeIndentification == '__blocks.at__');
    },

    determineIndex: function (value, length) {
      if (value == blocks.first) {
        return 0;
      } else if (value.prototypeIndentification == '__blocks.at__') {
        return value.index;
      }
      return length;
    }
  };

    var methodsData = {};


  /**
  * @namespace blocks.expressions
  */

  /**
  * @memberof blocks.expressions
  * @class BaseExpression
  */
  function BaseExpression(value, parent) {
    this._value = value;
    this._computedValue = undefined;
    if (parent) {
      this._parent = parent;
      this._currentResult = blocks.isBoolean(parent._result) ? parent._result : parent._currentResult;
      this._lastCondition = parent._condition || parent._lastCondition;
      this._hasNot = parent._hasNot;
    }
  }

  BaseExpression.prototype = {
    _prototypeIndentification: '__blocks.expression__',
    _expression: BaseExpression,

    /**
    * @memberof BaseExpression
    * @returns {String}
    */
    type: function () {
      return 'base';
    },

    /**
    * @memberof BaseExpression
    * @param {(String|Array)} types - 
    * @returns {boolean}
    */
    is: function (types) {
      this._setResult(blocks.is(this._value, types));
      return this;
    },

    /**
    * Description
    * @memberof BaseExpression
    */
    value: function () {
      return this._value;
    },

    /**
    * @memberof BaseExpression
    * @returns {Expression}
    */
    not: function () {
      var expression = new this._expression(this._value, this);
      expression._hasNot = !this._hasNot;
      return expression;
    },

    /**
    * @memberof 
    */
    or: function () {
      var expression = new this._expression(this._value, this);
      expression._condition = 'or';
      return expression;
    },

    and: function () {
      var expression = new this._expression(this._value, this);
      expression._condition = 'and';
      return expression;
    },

    result: function () {
      return this._not ? !this._result : this._result;
    },

    each: function (/*callback, thisArg*/) {
      //if (thisArg !== undefined) {
      //    callback.call(this._value, 0, this.toArray());
      //} else {
      //    callback(this._value, 0, this.toArray());
      //}
    },

    equals: function (value, deepEqual) {
      var expression = new this._expression(this._value, this);
      expression._setResult(blocks.equals(this._value, value, deepEqual));
      return expression;
    },

    hasValue: function () {
      return this._resultExpression(blocks.hasValue(this._value));
    },

    toString: function () {
      return new StringExpression(blocks.toString(this._value));
    },

    toArray: function () {
      return new RootArrayExpression(blocks.toArray(this.value()));
    },

    clone: function (deepClone) {
      return blocks(blocks.clone(this._value, deepClone));
    },

    _setResult: function (result) {
      if (this._hasNot) {
        result = !result;
      }
      switch (this._lastCondition) {
        case 'and':
          this._result = this._currentResult && result;
          break;
        case 'or':
          this._result = this._currentResult || result;
          break;
        default:
          this._result = result;
          break;
      }
      this._hasNot = false;
      this._lastCondition = undefined;
    },

    _resultExpression: function (result) {
      var expression = new this._expression(this._value, this);
      expression._setResult(result);
      return expression;
    }
  };

  blocks.extend(blocks, {
    isEmpty: function (value) {
      if (value == null) {
        return true;
      }
      if (blocks.isArray(value) || blocks.isString(value) || blocks.isArguments(value)) {
        return !value.length;
      }
      for (var key in value) {
        if (blocks.has(value, key)) {
          return false;
        }
        return true;
      }
      return true;
    }
  });
    var identity = function (value) {
    return value;
  };

    var hasOwn = Object.prototype.hasOwnProperty;


  var nativeMax = Math.max;
  var ceil = Math.ceil;

  blocks.extend(blocks, {
    range: function (start, end, step) {
      tart = +start || 0;
      step = typeof step == 'number' ? step : (+step || 1);

      if (end == null) {
        end = start;
        start = 0;
      }
      var index = -1;
      var length = nativeMax(0, ceil((end - start) / (step || 1)));
      var result = Array(length);

      while (++index < length) {
        result[index] = start;
        start += step;
      }
      return result;
    },

    groupBy: function (collection, accessor, thisArg) {
      return group(function (result, key, value) {
        if (!hasOwn.call(result, key)) {
          result[key] = [];
        }
        result[key].push(value);
      }, collection, accessor, thisArg);
    },

    countBy: function (collection, accessor, thisArg) {
      return group(function (result, key) {
        if (!hasOwn.call(result, key)) {
          result[key] = 0;
        }
        result[key]++;
      }, collection, accessor, thisArg);
    },

    sortBy: function (collection, callback, thisArg) {
      var length = callback ? callback.length : 0;
      var dir;
      var sortExpression;
      var result;
      var a;
      var b;

      if (blocks.isPlainObject(callback)) {
        callback = [callback];
        length = 1;
      }
      if (blocks.isArray(callback)) {
        if (length > 0) {
          return collection.sort(function (left, right) {
            for (i = 0; i < length; i++) {
              sortExpression = callback[i];
              dir = sortExpression.dir ? sortExpression.dir.toLowerCase() : 'asc';
              if (dir == 'none') {
                continue;
              }
              a = left[sortExpression.field];
              b = right[sortExpression.field];
              if (a !== b) {
                result = a > b ? 1 : -1;
                return dir == 'desc' ? -result : result;
              }
            }
          });
        }
        return collection;
      }

      callback = PrepareValues.parseCallback(callback, thisArg);
      if (!callback) {
        callback = identity;
      }
      return blocks(collection).map(function (value, index, list) {
        return {
          value: value,
          index: index,
          criteria: callback(value, index, list)
        };
      }).sort(function (left, right) {
        a = left.criteria;
        b = right.criteria;
        if (a !== b) {
          if (a > b || a === undefined) return 1;
          if (a < b || b === undefined) return -1;
        }
        return left.index - right.index;
      }).map('value').value();
    }
  });

  function group(behavior, array, accessor, thisArg) {
    accessor = PrepareValues.parseCallback(accessor, thisArg) || accessor;

    var result = {};
    var i = 0;
    var length = array.length;
    var isAccessorACallback = blocks.isFunction(accessor);
    var hasAccessor = accessor != null;
    var value;
    var key;

    for (; i < length; i++) {
      value = array[i];
      key = hasAccessor ? isAccessorACallback ? accessor(value, i, array) : value[accessor] : value;
      behavior(result, key, value, array, accessor);
    }
    return result;
  }

    var staticMethods = {};

    var slice = Array.prototype.slice;


  var HelperDescriptors = {
    skip: function () {
      return {
        name: 'skip',
        args: ['skip']
      }
    },

    take: function () {
      return {
        name: 'take',
        args: ['take']
      }
    },

    and: function () {
      return {
        name: 'and',
        args: []
      }
    },

    or: function () {
      return {
        name: 'or',
        args: []
      }
    },

    not: function () {
      return {
        name: 'not',
        args: []
      }
    },

    reverse: function () {
      return {
        name: 'reverse',
        args: []
      };
    }
  };

  for (var key in HelperDescriptors) {
    HelperDescriptors[key].identity = key;
  }

  var core = blocks.core;
  
  var PrepareValues = {
    parseCallback: function (callback, thisArg) {
      if (typeof callback == 'string') {
        var fieldName = callback;
        return function (value) {
          return value[fieldName];
        };
      }
      if (thisArg != null) {
        var orgCallback = callback;
        callback = function (value, index, collection) {
          return orgCallback.call(thisArg, value, index, collection);
        };
      }
      return callback;
    },

    uniquePrepare: function (callback, thisArg) {
      if (!blocks.isFunction(callback)) {
        return callback;
      }
      return PrepareValues.parseCallback(callback, thisArg);
    },

    mapPrepare: function (callback, thisArg) {
      //if (thisArg != null) {
      //    var orgCallback = callback;
      //    callback = function (value, index, collection) {
      //        return orgCallback.call(thisArg, value, index, collection);
      //    };
      //};
      //return callback;
      return PrepareValues.parseCallback(callback, thisArg);
    },

    filterPrepare: function (callback, thisArg) {
      if (blocks.isFunction(callback) || blocks.isString(callback)) {
        return PrepareValues.parseCallback(callback, thisArg);
      }
      return PrepareValues.createFilterCallback(callback);
    },

    reducePrepare: function (callback, memo, thisArg) {
      if (blocks.isFunction(callback) || blocks.isString(callback)) {
        return PrepareValues.parseCallback(callback, thisArg);
      }
      return PrepareValues.parseCallback(callback, thisArg);
    },

    createFilterCallback: function (filterExpressions) {
      return function (value) {
        return PrepareValues.resolveFilterExpressionValue(false, value, filterExpressions);
      };
    },

    resolveFilterExpressionValue: function (result, value, filterExpression) {
      if (filterExpression.field && filterExpression.operator) {
        var compareValue = filterExpression.value;
        value = value[filterExpression.field];
        switch (filterExpression.operator.toLowerCase()) {
          case 'eq':
            result = value === compareValue;
            break;
          case 'neq':
            result = value !== compareValue;
            break;
          case 'lt':
            result = value < compareValue;
            break;
          case 'lte':
            result = value <= compareValue;
            break;
          case 'gt':
            result = value > compareValue;
            break;
          case 'gte':
            result = value >= compareValue;
            break;
          case 'startswith':
            result = blocks(value).startsWith(compareValue);
            break;
          case 'endswith':
            result = blocks(value).endsWith(compareValue);
            break;
          case 'contains':
            result = value.indexOf(compareValue) !== -1;
            break;
        }
        return result;
      } else if (filterExpression.logic && filterExpression.filters) {
        if (result && filterExpression.logic == 'or') {
          return true;
        } else {
          var currentResult = false,
              length = filterExpression.filters.length,
              i = 0;
          for (; i < length; i++) {
            currentResult = PrepareValues.resolveFilterExpressionValue(false, value, filterExpression.filters[i]);
            if (currentResult && filterExpression.logic == 'or') {
              break;
            }
          }
          return currentResult;
        }
      } else {
        for (var key in filterExpression) {
          if (value[key] !== filterExpression[key]) {
            return false;
          }
        }
        return true;
      }
    },

    flatten: function (shallow, value, result) {
      if (blocks.isArray(value) || blocks.isArguments(value)) {
        if (shallow) {
          result.push.apply(result, value);
        } else {
          for (var i = 0; i < value.length; i++) {
            PrepareValues.flatten(shallow, value[i], result);
          }
        }
      } else {
        result.push(value);
      }
    }
  };
  PrepareValues.reduceRightPrepare = PrepareValues.reducePrepare;

  for (var key in PrepareValues) {
    core[key] = PrepareValues[key];
  }


var CollectionDescriptors = {
contains: function anonymous(index,type,expression,tillExpressions,skipTake
/**/) {
return {
boolResult: false,
args: ['searchValue'],
beforeLoop: 'result' + index + '=false;',
inLoop: 'if (value===searchValue' + index + '){result' + index + '=true;break ;};'}
},each: function anonymous(index,type,expression,tillExpressions,skipTake
/**/) {
var prepareValues = 'callback' + index + '=blocks.core.parseCallback(callback' + index + ',thisArg' + index + ');';
return {
args: ['callback', 'thisArg'],
beforeLoop: (index === ''?'' + prepareValues + '':''),
inLoop: 'callback' + index + '(value,indexOrKey,collection);',
prepareValues: prepareValues}
},
// Objects with different constructors are not equivalent, but `Object`s
equals: function anonymous(index,type,expression,tillExpressions,skipTake
/**/) {
var prepareValues = 'deepEqual' + index + '=deepEqual' + index + '===false?false:true;';
return {
boolResult: true,
args: ['compareValue', 'deepEqual'],
beforeLoop: (index === ''?'' + prepareValues + '':'')+'var index' + index + '=0;var resultResolved' + index + '=false;var size' + index + '=0;var key' + index + ';result' + index + '=true;if (Object.prototype.toString.call(collection)!==Object.prototype.toString.call(compareValue' + index + ')){result' + index + '=false;resultResolved' + index + '=true;};if (!resultResolved' + index + '){var aCtor=collection.constructor;var bCtor=compareValue' + index + '.constructor;if (aCtor!==bCtor&&!(blocks.isFunction(aCtor)&&aCtor instanceof aCtor&&blocks.isFunction(bCtor)&&bCtor instanceof bCtor)&&("constructor" in collection&&"constructor" in compareValue' + index + ')){result' + index + '=false;resultResolved' + index + '=true;}};',
inLoop: (type == 'array'?'if (!resultResolved' + index + '){if (deepEqual' + index + '?!blocks.equals(value,compareValue' + index + '[size' + index + '],true):value!==compareValue' + index + '[size' + index + ']){result' + index + '=false;break;}size' + index + '+=1;};':'')+(type == 'object'?'if (!resultResolved' + index + '){if (blocks.has(collection,indexOrKey)){if (!blocks.has(compareValue' + index + ',indexOrKey)||(deepEqual' + index + '?!blocks.equals(value,compareValue' + index + '[indexOrKey],true):value!==compareValue' + index + '[indexOrKey])){result' + index + '=false;break;}size' + index + '+=1;}};':''),
afterLoop: (type == 'array'?'if (!compareValue' + index + '||size' + index + '!==compareValue' + index + '.length){result' + index + '=false;resultResolved' + index + '=true;};':'')+(type == 'object'?'if (!resultResolved' + index + '&&result' + index + '){for (key' + index + ' in compareValue' + index + '){if (blocks.has(compareValue' + index + ',key' + index + ')&&!size' + index + '--){break ;}}result' + index + '=!size' + index + ';};':''),
prepareValues: prepareValues}
},every: function anonymous(index,type,expression,tillExpressions,skipTake
/**/) {
var prepareValues = 'callback' + index + '=blocks.core.parseCallback(callback' + index + ',thisArg' + index + ');';
return {
boolResult: true,
args: ['callback', 'thisArg'],
beforeLoop: 'result' + index + '=true;'+(index === ''?'' + prepareValues + '':''),
inLoop: 'if (callback' + index + '){if (!callback' + index + '(value,indexOrKey,collection)){result' + index + '=false;break ;}}else if (!value){result' + index + '=false;break ;};',
prepareValues: prepareValues}
},filter: function anonymous(index,type,expression,tillExpressions,skipTake
/**/) {
var prepareValues = 'callback' + index + '=blocks.core.filterPrepare(callback' + index + ',thisArg' + index + ');';
return {
args: ['callback', 'thisArg'],
beforeLoop: (index === ''?'' + prepareValues + '':'')+(index === '' || tillExpressions.length === 0?''+(type == 'array'?'result' + index + '=[];':'')+(type == 'object'?'result' + index + '={};':''):''),
inLoop: 'if (!callback' + index + '(value,indexOrKey,collection)){continue ;};' + skipTake + ';'+(index === '' || tillExpressions.length === 0?''+(type == 'array'?'result' + index + '.push(value);':'')+(type == 'object'?'result' + index + '[indexOrKey]=value;':''):''),
prepareValues: prepareValues}
},first: function anonymous(index,type,expression,tillExpressions,skipTake
/**/) {
var prepareValues = 'if (callback' + index + '){callback' + index + '=blocks.core.parseCallback(callback' + index + ',thisArg' + index + ');};';
return {
args: ['callback', 'thisArg'],
beforeLoop: 'var isNumber' + index + '=blocks.isNumber(callback' + index + ');var size' + index + '=0;var count' + index + '=1;var current' + index + ';if (isNumber' + index + '){result' + index + '=[];count' + index + '=callback' + index + ';callback' + index + '=thisArg' + index + ';};'+(index === ''?'' + prepareValues + '':''),
inLoop: 'if (callback' + index + '){if (callback' + index + '(value,indexOrKey,collection)){current' + index + '=value;}else {continue ;}}else {current' + index + '=value;};if (isNumber' + index + '){if (size' + index + '++>=count' + index + '){break ;}result' + index + '.push(current' + index + ');}else {result' + index + '=current' + index + ';break ;};',
prepareValues: prepareValues,
everything: true}
},has: function anonymous(index,type,expression,tillExpressions,skipTake
/**/) {
return {
boolResult: false,
args: ['key'],
beforeLoop: 'result' + index + '=false;',
afterLoop: 'result' + index + '=blocks.has(collection,key' + index + ');'}
},
// TODO: ifNeedsResult could be removed and automatically detect if you need to include the this.result in the descriptor string
invoke: function anonymous(index,type,expression,tillExpressions,skipTake
/**/) {
return {
args: ['method', 'args'],
beforeLoop: 'var isFunc' + index + '=blocks.isFunction(method' + index + ');'+(index === '' || tillExpressions.length === 0?''+(type == 'array'?'result' + index + '=[];':'')+(type == 'object'?'result' + index + '={};':''):'')+(index === ''?'args' + index + '=Array.prototype.slice.call(arguments,2);':''),
inLoop: 'value=(isFunc' + index + '?method' + index + ':value[method' + index + ']).apply(value,args' + index + '||[]);'+(index === '' || tillExpressions.length === 0?''+(type == 'array'?'result' + index + '.push(value);':'')+(type == 'object'?'result' + index + '[indexOrKey]=value;':''):'')}
},isEmpty: function anonymous(index,type,expression,tillExpressions,skipTake
/**/) {
return {
boolResult: true,
beforeLoop: 'result' + index + '=true;',
inLoop: 'result' + index + '=false;'}
},join: function anonymous(index,type,expression,tillExpressions,skipTake
/**/) {
return {
args: ['separator'],
beforeLoop: 'separator' + index + '=typeof separator' + index + '=="undefined"?",":separator' + index + ';result' + index + '="";',
inLoop: 'result' + index + '+=value+separator' + index + ';',
afterLoop: 'result' + index + '=result' + index + '.substring(0,result' + index + '.length-separator' + index + '.length);'}
},
// NOTE: The code could be minified using UglifyJS.
map: function anonymous(index,type,expression,tillExpressions,skipTake
/**/) {
var prepareValues = 'callback' + index + '=blocks.core.parseCallback(callback' + index + ',thisArg' + index + ');';
return {
args: ['callback', 'thisArg'],
beforeLoop: (index === ''?'' + prepareValues + '':'')+(index === ''?''+(type == 'array'?'result' + index + '=Array(collection.length);':'')+(type == 'object'?'result' + index + '=[];':''):'')+(index !== '' && tillExpressions.length === 0?'result' + index + '=[];':''),
inLoop: 'value=callback' + index + '(value,indexOrKey,collection);'+(index === ''?''+(type == 'array'?'result' + index + '[indexOrKey]=value;':'')+(type == 'object'?'result' + index + '.push(value);':''):'')+(index !== '' && tillExpressions.length === 0?'result' + index + '.push(value);':''),
prepareValues: prepareValues}
},max: function anonymous(index,type,expression,tillExpressions,skipTake
/**/) {
var prepareValues = 'callback' + index + '=blocks.core.parseCallback(callback' + index + ',thisArg' + index + ');';
return {
args: ['callback', 'thisArg'],
beforeLoop: 'var max' + index + '=-Infinity;result' + index + '=max' + index + ';'+(index === ''?'' + prepareValues + '':''),
inLoop: 'max' + index + '=callback' + index + '?callback' + index + '(value,indexOrKey,collection):value;result' + index + '=max' + index + '>result' + index + '?max' + index + ':result' + index + ';',
prepareValues: prepareValues,
type: 'NumberExpression'}
},min: function anonymous(index,type,expression,tillExpressions,skipTake
/**/) {
var prepareValues = 'callback' + index + '=blocks.core.parseCallback(callback' + index + ',thisArg' + index + ');';
return {
args: ['callback', 'thisArg'],
beforeLoop: 'var min' + index + '=Infinity;result' + index + '=min' + index + ';'+(index === ''?'' + prepareValues + '':''),
inLoop: 'min' + index + '=callback' + index + '?callback' + index + '(value,indexOrKey,collection):value;result' + index + '=min' + index + '<result' + index + '?min' + index + ':result' + index + ';',
prepareValues: prepareValues,
type: 'NumberExpression'}
},reduce: function anonymous(index,type,expression,tillExpressions,skipTake
/**/) {
var prepareValues = 'callback' + index + '=blocks.core.reducePrepare(callback' + index + ',memo' + index + ',thisArg' + index + ');';
return {
args: ['callback', 'memo', 'thisArg'],
beforeLoop: 'var hasMemo' + index + '=memo' + index + '!=null;result' + index + '=memo' + index + ';'+(index === ''?'' + prepareValues + '':''),
inLoop: 'if (hasMemo' + index + '){result' + index + '=callback' + index + '(result' + index + ',value,indexOrKey,collection);}else {result' + index + '=collection[indexOrKey];hasMemo' + index + '=true;};',
prepareValues: prepareValues,
everything: true}
},size: function anonymous(index,type,expression,tillExpressions,skipTake
/**/) {
return {
beforeLoop: (index === ''?''+(type == 'array'?'return collection.length;':''):'')+'result' + index + '=0;',
inLoop: 'result' + index + '++;',
type: 'NumberExpression'}
},some: function anonymous(index,type,expression,tillExpressions,skipTake
/**/) {
var prepareValues = 'callback' + index + '=blocks.core.parseCallback(callback' + index + ',thisArg' + index + ');';
return {
boolResult: false,
args: ['callback', 'thisArg'],
beforeLoop: 'result' + index + '=false;'+(index === ''?'' + prepareValues + '':''),
inLoop: 'if (callback' + index + '){if (callback' + index + '(value,indexOrKey,collection)){result' + index + '=true;break ;}}else if (value){result' + index + '=true;break ;};',
prepareValues: prepareValues}
},type: 'collection'
};for (var key in CollectionDescriptors) {CollectionDescriptors[key].identity = key;CollectionDescriptors[key].parent = CollectionDescriptors;}

var ArrayDescriptors = {

/**
 * Creates an array of elements from the specified indexes, or keys, of the collection. Indexes may be specified as individual arguments or as arrays of indexes.
 * @memberof ArrayExpression
 * @param  {number} position - The position from which to start extracting
 * @param  {number} [count]  - The number of items to be extracted
 * @returns {Array}           - Returns a new array of elements corresponding to the provided indexes
 *
 * @example {javascript}
 * blocks.at(['a', 'b', 'c', 'd', 'e'], [0, 2, 4]);
 * // → ['a', 'c', 'e']
 * blocks.at(['fred', 'barney', 'pebbles'], 0, 2);
 * // → ['fred', 'pebbles']
 */
at: function anonymous(index,type,expression,tillExpressions,skipTake
/**/) {
return {
args: ['position', 'count'],
beforeLoop: 'var isArray' + index + '=blocks.isNumber(count' + index + ');var size' + index + '=0;indexOrKey=position' + index + '-1;if (isArray' + index + '){result' + index + '=[];};',
inLoop: 'if (isArray' + index + '){if (size' + index + '++>=count' + index + '){break ;}result' + index + '.push(value);}else {result=value;break ;};'}
},
/**
 * Flattens a nested array (the nesting can be to any depth).
 * If isShallow is truthy, the array will only be flattened a single level.
 * If a callback is provided each element of the array is passed through the callback before flattening.
 * The callback is bound to thisArg and invoked with three arguments; (value, index, array).
 * If a property name is provided for callback the created "_.pluck" style callback will return the property value of the given element.
 *
 * @memberof ArrayExpression
 * @param  {boolean} shallow - A flag to restrict flattening to a single level.
 * @returns {Array} - Returns a new flattened array.
 *
 * @example {javascript}
 * blocks.flatten([1, [2], [3, [[4]]]]);
 * // → [1, 2, 3, 4];
 *
 * blocks.flatten([1, [2], [3, [[4]]]], true);
 * // → [1, 2, 3, [[4]]];
 *
 * var characters = [
 *  { 'name': 'barney', 'age': 30, 'pets': ['hoppy'] },
 *  { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }
 * ];
 *
 * // using "_.pluck" callback shorthand
 * blocks.flatten(characters, 'pets');
 * // → ['hoppy', 'baby puss', 'dino']
 */
flatten: function anonymous(index,type,expression,tillExpressions,skipTake
/**/) {
return {
args: ['shallow'],
beforeLoop: 'var flatten' + index + '=blocks.core.flatten;result' + index + '=[];',
inLoop: 'flatten' + index + '(shallow' + index + ',value,result' + index + ');'}
},
/**
 * Gets the index at which the first occurrence of value is found using strict equality for comparisons, i.e. ===.
 * If the array is already sorted providing true for fromIndex will run a faster binary search
 *
 * @memberof ArrayExpression
 * @param {*} searchValue - The value to search for
 * @param {number|boolean} fromIndex - The index to search from or true to perform a binary search on a sorted array
 * @returns {number} - Returns the index of the matched value or -1
 * 
 * @example {javascript}
 * blocks.indexOf([1, 2, 3, 1, 2, 3], 2);
 * // → 1
 *
 * blocks.indexOf([1, 2, 3, 1, 2, 3], 2, 3);
 * // → 4
 *
 * blocks.indexOf([1, 1, 2, 2, 3, 3], 2, true);
 * // → 2
 */
indexOf: function anonymous(index,type,expression,tillExpressions,skipTake
/**/) {
return {
args: ['searchValue', 'fromIndex'],
beforeLoop: 'result' + index + '=-1;if (blocks.isNumber(fromIndex' + index + ')){indexOrKey=fromIndex' + index + ';};',
inLoop: 'if (value===searchValue' + index + '){result' + index + '=indexOrKey;break ;};',
type: 'NumberExpression'}
},
/**
 * Gets the last element or last n elements of an array. If a callback is provided elements at the end of the array are returned as long as the callback returns truthy.
 * The callback is bound to thisArg and invoked with three arguments; (value, index, array).
 * If a property name is provided for callback the created "_.pluck" style callback will return the property value of the given element.
 * If an object is provided for callback the created "_.where" style callback will return true for elements that have the properties of the given object, else false.
 *
 * @memberof ArrayExpression
 * @param   {(Function|Object|number|string)} callback - The function called per element or the number of elements to return. If a property name or object is provided it will be used to create a ".pluck" or ".where" style callback, respectively.
 * @param   {*}  thisArg - The this binding of callback.
 * @returns {*} - Returns the last element(s) of array.
 *
 * @example {javascript}
 * blocks.last([1, 2, 3]);
 * // → 3
 *
 * blocks.last([1, 2, 3], 2);
 * // → [2, 3]
 *
 * blocks.last([1, 2, 3], function(num) {
 *  return num > 1;
 * })
 * // → [2, 3]
 *
 * var characters = [
 *  { 'name': 'barney',  'blocked': false, 'employer': 'slate' },
 *  { 'name': 'fred',    'blocked': true,  'employer': 'slate' },
 *  { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
 * ];
 *
 * // using "_.pluck" callback shorthand
 * blocks.pluck(_.last(characters, 'blocked'), 'name');
 * // → ['fred', 'pebbles']
 *
 * // using "_.where" callback shorthand
 * blocks.last(characters, { 'employer': 'na' });
 * // → [{ 'name': 'pebbles', 'blocked': true, 'employer': 'na' }]
 */
last: function anonymous(index,type,expression,tillExpressions,skipTake
/**/) {
var prepareValues = 'if (callback' + index + '){callback' + index + '=blocks.core.parseCallback(callback' + index + ',thisArg' + index + ');};';
return {
reverse: true,
args: ['callback', 'thisArg'],
beforeLoop: 'var isNumber' + index + '=blocks.isNumber(callback' + index + ');var size' + index + '=0;var count' + index + '=1;var current' + index + ';if (isNumber' + index + '){result' + index + '=[];count' + index + '=callback' + index + ';callback' + index + '=thisArg' + index + ';};'+(index === ''?'' + prepareValues + '':''),
inLoop: 'if (callback' + index + '){if (callback' + index + '(value,indexOrKey,collection)){current' + index + '=value;}else {continue ;}}else {current' + index + '=value;};if (isNumber' + index + '){if (size' + index + '++>=count' + index + '){break ;}result' + index + '.unshift(current' + index + ');}else {result' + index + '=current' + index + ';break ;};',
prepareValues: prepareValues,
everything: true}
},
/**
 * Gets the index at which the last occurrence of value is found using strict equality for comparisons, i.e. ===. If fromIndex is negative, it is used as the offset from the end of the collection.
 *
 * If a property name is provided for callback the created "_.pluck" style callback will return the property value of the given element.
 *
 * If an object is provided for callback the created "_.where" style callback will return true for elements that have the properties of the given object, else false.
 *
 * @memberof ArrayExpression
 * @param {*} searchValue - The value to search for.
 * @param {number} [fromIndex=array.length - 1] - The index to search from.
 * @returns {number} - Returns the index of the matched value or -1.
 *
 * @example {javascript}
 * blocks.lastIndexOf([1, 2, 3, 1, 2, 3], 2);
 * // → 4
 *
 * blocks.lastIndexOf([1, 2, 3, 1, 2, 3], 2, 3);
 * // → 1
 */
lastIndexOf: function anonymous(index,type,expression,tillExpressions,skipTake
/**/) {
return {
reverse: true,
args: ['searchValue', 'fromIndex'],
beforeLoop: 'result' + index + '=-1;if (blocks.isNumber(fromIndex' + index + ')){indexOrKey=fromIndex' + index + ';};',
inLoop: 'if (value===searchValue' + index + '){result' + index + '=indexOrKey;break ;};',
type: 'NumberExpression'}
},
/**
﻿ * Creates an array of numbers (positive and/or negative) progressing from start up to but not including end.
﻿ * If start is less than stop a zero-length range is created unless a negative step is specified.
﻿ *
﻿ * @memberof ArrayExpression
﻿ * @param   {number} [start=0] - The start of the range
﻿ * @param   {number} end - The end of the range
﻿ * @param   {number} [step=1] - The value to increment or decrement by
﻿ * @returns {Array} - Returns a new range array
﻿ *
﻿ * @example {javascript}
﻿ * blocks.range(4);
﻿ * // → [0, 1, 2, 3]
﻿ *
﻿ * blocks.range(1, 5);
﻿ * // → [1, 2, 3, 4]
﻿ *
﻿ * blocks.range(0, 20, 5);
﻿ * // → [0, 5, 10, 15]
﻿ *
﻿ * blocks.range(0, -4, -1);
﻿ * // → [0, -1, -2, -3]
﻿ *
﻿ * blocks.range(1, 4, 0);
﻿ * // → [1, 1, 1]
﻿ *
﻿ * blocks.range(0);
﻿ * // → []
﻿ */
range: function anonymous(index,type,expression,tillExpressions,skipTake
/**/) {
return {
args: ['start', 'end', 'step'],
beforeLoop: 'length=Math.max(Math.ceil((end' + index + '-start' + index + ')/step' + index + '),0);result' + index + '=Array(length);',
inLoop: 'value=start' + index + ';start' + index + '+=step' + index + ';'+(index === '' || tillExpressions.length === 0?'result' + index + '[indexOrKey]=value;':'')}
},
// TODO: reduceRight and lastIndexOf are equal to code as reduce and indexOf respectivly
reduceRight: function anonymous(index,type,expression,tillExpressions,skipTake
/**/) {
return {
reverse: true,
args: ['callback', 'memo', 'thisArg'],
beforeLoop: 'var hasMemo' + index + '=memo' + index + '!=null;result' + index + '=memo' + index + ';'+(index === ''?'callback' + index + '=blocks.core.reducePrepare(callback' + index + ',memo' + index + ',thisArg' + index + ');':''),
inLoop: 'if (hasMemo' + index + '){result' + index + '=callback' + index + '(result' + index + ',value,indexOrKey,collection);}else {result' + index + '=collection[indexOrKey];hasMemo' + index + '=true;};',
everything: true}
},unique: function anonymous(index,type,expression,tillExpressions,skipTake
/**/) {
var prepareValues = 'callback' + index + '=blocks.core.uniquePrepare(callback' + index + ',thisArg' + index + ');';
return {
args: ['callback', 'thisArg'],
beforeLoop: 'var seen' + index + '=[];var isFirst' + index + '=true;var isSorted' + index + '=blocks.isBoolean(callback' + index + ')&&callback' + index + ';var hasCallback' + index + '=blocks.isFunction(callback' + index + ');var map' + index + ';result' + index + '=[];'+(index === ''?'' + prepareValues + '':''),
inLoop: 'map' + index + '=hasCallback' + index + '?callback' + index + '(value,indexOrKey,collection):value;if (isSorted' + index + '?isFirst' + index + '||seen' + index + '[seen' + index + '.length-1]!==map' + index + ':!blocks.contains(seen' + index + ',map' + index + ')){isFirst' + index + '=false;seen' + index + '.push(map' + index + ');}else {continue ;};'+(index === '' || tillExpressions.length === 0?'result' + index + '.push(value);':''),
prepareValues: prepareValues}
},type: 'array'
};for (var key in ArrayDescriptors) {ArrayDescriptors[key].identity = key;ArrayDescriptors[key].parent = ArrayDescriptors;}

var ObjectDescriptors = {
get: function anonymous(index,type,expression,tillExpressions,skipTake
/**/) {
var prepareValues = (index === ''?'keys' + index + '=blocks.flatten(Array.prototype.slice.call(arguments,1));':'')+(index !== ''?'keys' + index + '=blocks.flatten(Array.prototype.slice.call(arguments,0));':'');
return {
args: ['keys'],
beforeLoop: (index === ''?'' + prepareValues + '':'')+'var singleKey' + index + '=keys' + index + '.length<2;keys' + index + '=blocks.toObject(keys' + index + ');result' + index + '={};',
inLoop: 'if (keys' + index + '.hasOwnProperty(indexOrKey)){if (singleKey' + index + '){result' + index + '=value;}else {result' + index + '[indexOrKey]=value;}};',
prepareValues: prepareValues}
},invert: function anonymous(index,type,expression,tillExpressions,skipTake
/**/) {
return {
beforeLoop: 'var temp' + index + ';result' + index + '={};',
inLoop: 'temp' + index + '=value;value=indexOrKey;indexOrKey=temp' + index + ';'+(index === '' || tillExpressions.length === 0?'result' + index + '[indexOrKey]=value;':'')}
},keys: function anonymous(index,type,expression,tillExpressions,skipTake
/**/) {
return {
beforeLoop: 'result' + index + '=[];',
inLoop: 'value=indexOrKey;'+(index === '' || tillExpressions.length === 0?'result' + index + '.push(value);':'')}
},pairs: function anonymous(index,type,expression,tillExpressions,skipTake
/**/) {
return {
beforeLoop: 'result' + index + '=[];',
inLoop: 'result' + index + '.push({key:indexOrKey,value:value});'}
},values: function anonymous(index,type,expression,tillExpressions,skipTake
/**/) {
return {
beforeLoop: 'result' + index + '=[];',
inLoop: 'result' + index + '.push(value);'}
},type: 'object'
};for (var key in ObjectDescriptors) {ObjectDescriptors[key].identity = key;ObjectDescriptors[key].parent = ObjectDescriptors;}

var LoopDescriptors = {
chainExpression: function anonymous(context
/**/) {
var context2;
var context1;
var result = '';
var last2;
var first2;
var key2;
var index2;
var last1;
var first1;
var key1;
var index1;
result += 'var ' + context.indexOrKey + ' = -1, ' + context.collection + ', ' + context.length + ', ' + context.value + ', ' + (!context.conditions ? ' ' + context.result + context.resultIndex + ',' : '') + ' ' + context.result + (context.conditions ? ' = false' : '') + '; ' + context.conditionsDeclarations + ' ';
index1 = -1;
blocks.each(context.args, function (value, index){
context1 = value;
index1 += 1;
key1 = index;
first1 = index == 0;
last1 = index == context.args.length - 1;
result += ' ';
index2 = -1;
blocks.each(context1, function (value, index){
context2 = value;
index2 += 1;
key2 = index;
first2 = index == 0;
last2 = index == context1.length - 1;
result += ' var ' + context2 + index1 + ' = ' + context.expression + '._' + context2 + '; ';
});
result += ' ' + context.expression + ' = ' + context.expression + '._parent; ';
});
result += ' ';
blocks.eachRight(context.variables, function (value, index){
context1 = value;
index1 = context.variables.length;
index1 += -1;
key1 = index;
first1 = index == 0;
last1 = index == context.variables.length - 1;
result += ' ';
index2 = -1;
blocks.each(context1, function (value, index){
context2 = value;
index2 += 1;
key2 = index;
first2 = index == 0;
last2 = index == context1.length - 1;
result += ' var ' + key2 + index2 + ' = ' + context2 + '; ';
});
result += ' ';
});
result += ' ' + context.collection + ' = ' + context.expression + '._value; ' + context.indexOrKey + ' += ' + context.skip + '; ' + (context.take ? ' ' + context.length + ' = Math.min(' + context.collection + '.length, ' + context.skip + ' + ' + context.take + '); ' : '') + ' ' + (!context.take ? ' ' + context.length + ' = ' + context.collection + '.length; ' : '') + ' ' + (context.reverse ? ' ' + context.indexOrKey + ' = ' + context.collection + '.length - ' + context.skip + '; ' : '') + ' ';
blocks.eachRight(context.arrayBeforeLoops, function (value, index){
context1 = value;
index1 = context.arrayBeforeLoops.length;
index1 += -1;
key1 = index;
first1 = index == 0;
last1 = index == context.arrayBeforeLoops.length - 1;
result += ' ' + context1 + ' ';
});
result += ' ' + (context.isObject ? ' for (' + context.indexOrKey + ' in ' + context.collection + ') { ' : '') + ' ' + (!context.isObject ? ' ' + (context.reverse ? ' while (--' + context.indexOrKey + ' >= ' + (context.take ? context.take : '') + (!context.take ? '0' : '') + ') { ' : '') + ' ' + (!context.reverse ? ' while (++' + context.indexOrKey + ' < ' + context.length + ') { ' : '') + ' ' : '') + ' ' + context.value + ' = ' + context.collection + '[' + context.indexOrKey + ']; ';
blocks.eachRight(context.arrayInLoops, function (value, index){
context1 = value;
index1 = context.arrayInLoops.length;
index1 += -1;
key1 = index;
first1 = index == 0;
last1 = index == context.arrayInLoops.length - 1;
result += ' ' + context1 + ' ';
});
result += ' ' + (context.inLoopConditions ? ' ' + context.inLoopConditions + ' ' : '') + ' } ';
blocks.eachRight(context.arrayAfterLoops, function (value, index){
context1 = value;
index1 = context.arrayAfterLoops.length;
index1 += -1;
key1 = index;
first1 = index == 0;
last1 = index == context.arrayAfterLoops.length - 1;
result += ' ' + context1 + ' ';
});
result += ' ' + (context.afterLoopConditions ? ' ' + context.afterLoopConditions + ' ' : '') + ' ' + (!context.conditions ? ' ' + context.result + ' = ' + context.result + context.resultIndex + '; ' : '') + ' return ' + context.result + '; ';
return result;
},conditions: function anonymous(context
/**/) {
var context1;
var result = '';
var last1;
var first1;
var key1;
var index1;
result += 'if (';
index1 = -1;
blocks.each(context.items, function (value, index){
context1 = value;
index1 += 1;
key1 = index;
first1 = index == 0;
last1 = index == context.items.length - 1;
result += context1;
});
result += ') { ' + context.result + ' = true; ' + (context.inLoop ? ' break; ' : '') + ' } ';
return result;
},expressions: function anonymous(context
/**/) {
var context2;
var context1;
var result = '';
var last2;
var first2;
var key2;
var index2;
var last1;
var first1;
var key1;
var index1;
result += 'function ' + context.name + 'Expression( ';
index1 = -1;
blocks.each(context.args, function (value, index){
context1 = value;
index1 += 1;
key1 = index;
first1 = index == 0;
last1 = index == context.args.length - 1;
result += ' ' + context1 + ', ';
});
result += ' parent ) { this._parent = parent; this._descriptor = descriptors.' + context.descriptorName + '; ';
index1 = -1;
blocks.each(context.args, function (value, index){
context1 = value;
index1 += 1;
key1 = index;
first1 = index == 0;
last1 = index == context.args.length - 1;
result += ' this._' + context1 + ' = ' + context1 + '; ';
});
result += ' } ' + (context.isRoot ? ' function ' + context.name + 'Expression(value) { this._value = value; this._loopDescriptor = LoopDescriptors.chainExpression; } ' : '') + ' blocks.inherit(BaseExpression, ' + context.name + 'Expression, { _type: ' + context.type + ', _name: "' + context.name + '", ';
index1 = -1;
blocks.each(context.methods, function (value, index){
context1 = value;
index1 += 1;
key1 = index;
first1 = index == 0;
last1 = index == context.methods.length - 1;
result += ' ' + context1.name + ': function ( ';
index2 = -1;
blocks.each(context1.args, function (value, index){
context2 = value;
index2 += 1;
key2 = index;
first2 = index == 0;
last2 = index == context1.args.length - 1;
result += ' ' + context2 + ', ';
});
result += ' a ) { var type = expressions.' + context.path + context1.name + '; if (!type) { type = (expressions.' + context.path + context1.name + ' = generateExpression("' + context.name + context1.name + '", "' + context.path + context1.name + '", "' + context1.name + '", ' + context.type + ')); } ' + context1.prepareValues + ' expression = new type(';
index2 = -1;
blocks.each(context1.args, function (value, index){
context2 = value;
index2 += 1;
key2 = index;
first2 = index == 0;
last2 = index == context1.args.length - 1;
result += ' ' + context2 + ', ';
});
result += ' this); ' + (context1.type ? ' if (this._hasConditions()) { this.result(); this._setLastCondition(); return new ' + context1.type + '(expression.value(), this); } return new ' + context1.type + '(expression.value()); ' : '') + ' ' + (context1.everything ? ' if (this._hasConditions()) { this.result(); this._setLastCondition(); } return blocks(expression.value(), this); ' : '') + ' return expression; }, ';
});
result += ' ';
index1 = -1;
blocks.each(context.staticMethods, function (value, index){
context1 = value;
index1 += 1;
key1 = index;
first1 = index == 0;
last1 = index == context.staticMethods.length - 1;
result += ' ' + key1 + ' : ' + context1 + ', ';
});
result += ' reverse: function () { var type = expressions.' + context.path + 'reverse; if (!type) { type = (expressions.' + context.path + 'reverse = generateExpression("' + context.path + 'reverse", "' + context.path + 'reverse", "reverse", ' + context.type + ')); } var expression = new type(this); return expression; }, each: function (callback, thisArg) { var type = expressions.' + context.path + 'each; if (!type) { type = (expressions.' + context.path + 'each = generateExpression("' + context.path + 'each", "' + context.path + 'each", "each", ' + context.type + ')); } callback = PrepareValues.parseCallback(callback, thisArg); var expression = new type(callback, thisArg, this); expression._loop(); return expression; }, value: function () { if (this._parent && this._computedValue === undefined) { this._execute(true); this._computedValue = blocks.isBoolean(this._result) ? this._parent._value : this._result; } return this._computedValue === undefined ? this._value : this._computedValue; }, result: function () { if (this._result === true || this._result === false) { return this._result; } if (this._parent) { this._execute(); } return this._result; }, _loop: function () { var func = cache.' + context.path + ' || (cache.' + context.path + ' = createExpression(this)); func(this); }, _execute: function (skipConditions) { var func = cache.' + context.path + ' || (cache.' + context.path + ' = createExpression(this, skipConditions)); if (func) { this._setResult(func(this)); } else { this._result = this._findValue(); } }, _hasConditions: function () { var name = this._name; return name.indexOf("and") != -1 || name.indexOf("or") != -1; }, _setLastCondition: function () { var name = this._name; var andIndex = name.lastIndexOf("and"); var orIndex = name.lastIndexOf("or"); this._lastCondition = andIndex > orIndex ? "and" : "or"; }, _findValue: function () { var parent = this._parent; while (parent) { if (parent._value) { return parent._value; } parent = parent._parent; } } }); return ' + context.name + 'Expression; ';
return result;
},singleExpression: function anonymous(context
/**/) {
var context1;
var result = '';
var last1;
var first1;
var key1;
var index1;
result += 'var ' + context.length + ' = ' + context.collection + '.length, ' + context.indexOrKey + ' = ' + (!context.reverse ? '-1' : '') + (context.reverse ? context.length : '') + ', ' + context.isCollectionAnArray + ' = ' + context.isArrayCheck + ', ' + context.result + ', ' + context.value + '; ';
index1 = -1;
blocks.each(context.variables, function (value, index){
context1 = value;
index1 += 1;
key1 = index;
first1 = index == 0;
last1 = index == context.variables.length - 1;
result += ' ';
});
result += ' if (' + context.isCollectionAnArray + ') { ';
index1 = -1;
blocks.each(context.arrayBeforeLoops, function (value, index){
context1 = value;
index1 += 1;
key1 = index;
first1 = index == 0;
last1 = index == context.arrayBeforeLoops.length - 1;
result += ' ' + context1 + ' ';
});
result += ' ' + (context.reverse ? ' while (--' + context.indexOrKey + ' >= 0) { ' : '') + ' ' + (!context.reverse ? ' while (++' + context.indexOrKey + ' < ' + context.length + ') { ' : '') + ' ' + context.value + ' = ' + context.collection + '[' + context.indexOrKey + ']; ';
index1 = -1;
blocks.each(context.arrayInLoops, function (value, index){
context1 = value;
index1 += 1;
key1 = index;
first1 = index == 0;
last1 = index == context.arrayInLoops.length - 1;
result += ' ' + context1 + ' ';
});
result += ' } ';
index1 = -1;
blocks.each(context.arrayAfterLoops, function (value, index){
context1 = value;
index1 += 1;
key1 = index;
first1 = index == 0;
last1 = index == context.arrayAfterLoops.length - 1;
result += ' ' + context1 + ' ';
});
result += ' } else { ';
index1 = -1;
blocks.each(context.objectBeforeLoops, function (value, index){
context1 = value;
index1 += 1;
key1 = index;
first1 = index == 0;
last1 = index == context.objectBeforeLoops.length - 1;
result += ' ' + context1 + ' ';
});
result += ' for (' + context.indexOrKey + ' in collection) { ' + context.value + ' = ' + context.collection + '[' + context.indexOrKey + ']; ';
index1 = -1;
blocks.each(context.objectInLoops, function (value, index){
context1 = value;
index1 += 1;
key1 = index;
first1 = index == 0;
last1 = index == context.objectInLoops.length - 1;
result += ' ' + context1 + ' ';
});
result += ' } ';
index1 = -1;
blocks.each(context.objectAfterLoops, function (value, index){
context1 = value;
index1 += 1;
key1 = index;
first1 = index == 0;
last1 = index == context.objectAfterLoops.length - 1;
result += ' ' + context1 + ' ';
});
result += ' } return ' + context.result + '; ';
return result;
},skip: function anonymous(context
/**/) {
var result = '';
result += 'if (skip' + context.index + '-- > 0) { continue; }';
return result;
},take: function anonymous(context
/**/) {
var result = '';
result += 'if (take' + context.index + '-- <= 0) { break; }';
return result;
},type: 'loop'
};

  var cache = {};
  var expressionsCache = {};

  var descriptors2 = blocks.extend({}, CollectionDescriptors, ArrayDescriptors, ObjectDescriptors, HelperDescriptors);

  //function toCode(func) {
  //    var lines = func.toString().split('\n');
  //    return lines.slice(1, lines.length - 1).join('\n');
  //}

  //descriptors2.equals.prepareValues = {
  //    deepEqual: toCode(function (deepEqual) {
  //        deepEqual = deepEqual === false ? false : true;
  //    }),
  //};

  //descriptors2.reduce.prepareValues = [toCode(function (callback, memo, thisArg) {
  //    callback = PrepareValues.parseCallback(callback, thisArg);
  //})];

  //descriptors2.get.prepareValues = [toCode(function (keys) {
  //    keys = blocks.flatten(arguments);
  //})];

  //blocks.each(['filter', 'some', 'every', 'unique', 'first', 'last', 'min', 'max'], function (methodName) {
  //    if (PrepareValues[methodName + 'Prepare']) {
  //        descriptors2[methodName].prepareValues = ['callback = PrepareValues.' + methodName + 'Prepare(callback, thisArg);'];
  //    } else {
  //        descriptors2[methodName].prepareValues = [toCode(function (callback, thisArg) {
  //            callback = PrepareValues.parseCallback(callback, thisArg);
  //        })];
  //    }
  //});

  var descriptor;
  var descriptorData;
  for (var key in descriptors2) {
    descriptor = descriptors2[key];
    if (blocks.isFunction(descriptor)) {
      descriptorData = descriptor(' ', '', '', []);
      methodsData[key] = {
        name: key,
        args: descriptorData.args,
        prepareValues: descriptorData.prepareValues || '',
        type: descriptorData.type,
        everything: descriptorData.everything
      };
    }
  }

  blocks.extend(staticMethods, {
    toObject: function (values) {
      return new expressions.RootObjectExpression(blox.toObject(this.value(), values));
    },

    sortBy: function (callback, thisArg) {
      return new expressions.RootArrayExpression(blox.sortBy(this.value(), callback, thisArg));
    },

    groupBy: function (callback, thisArg) {
      return new expressions.RootObjectExpression(blox.groupBy(this.value(), callback, thisArg));
    },

    countBy: function (callback, thisArg) {
      return new expressions.RootObjectExpression(blox.countBy(this.value(), callback, thisArg));
    },

    shuffle: function () {
      return new expressions.RootArrayExpression(blox.shuffle(this.value()));
    },

    set: function (objectOrKey, value) {
      return new expressions.RootObjectExpression(blox.set.call(undefined, this.value, objectOrKey, value));
    },

    at: function (index, count) {
      return new expressions.RootArrayExpression(blox.at(this._value, index, count));
    },

    // Array.prototype methods
    concat: function () {
      var value = this.value();
      return new expressions.RootArrayExpression(value.concat.apply(value, arguments));
      //return new expressionsCache.RootArrayExpression(this.value().concat(slice.call(arguments)));
    },

    push: function () {
      var value = this.value();
      value.push.apply(value, arguments)
      return new expressions.RootArrayExpression(value);
    },

    pop: function () {
      var value = this.value();
      value.pop();
      return new expressions.RootArrayExpression(value);
    },

    shift: function () {
      var value = this.value();
      value.shift();
      return new expressions.RootArrayExpression(value);
    },

    slice: function (begin, end) {
      return new expressions.RootArrayExpression(this.value().slice(begin, end));
    },

    sort: function (compareFunction) {
      return new expressions.RootArrayExpression(this.value().sort(compareFunction));
    },

    splice: function (index, howMany) {
      var value = this.value();
      if (arguments.length > 2) {
        value.splice.apply(value, [index, howMany].concat(slice.call(arguments, 2)));
      } else {
        value.splice(index, howMany);
      }
      return new expressions.RootArrayExpression(value);
    },

    unshift: function () {
      var value = this.value();
      value.unshift.apply(value, arguments)
      return new expressions.RootArrayExpression(value);
    }
  });

  function generateExpression(name, path, descriptorName, type, isRoot) {
    var body = LoopDescriptors.expressions({
      isRoot: isRoot,
      name: name,
      path: path,
      descriptorName: descriptorName || 'a',
      args: (methodsData[descriptorName] || {}).args,
      methods: methodsData,
      type: type || 0,
      staticMethods: staticMethods
    });

    var Expression = new Function(
          ['blocks', 'blox', 'expressions', 'cache', 'BaseExpression', 'LoopDescriptors', 'generateExpression', 'descriptors', 'createExpression', 'PrepareValues', 'slice', 'add',
          'NumberExpression'],
          body)
          (blocks, blocks, expressionsCache, cache, BaseExpression, LoopDescriptors, generateExpression, descriptors2, createExpression, PrepareValues, slice, add,
          NumberExpression);
    if (isRoot) {
      expressionsCache[name + 'Expression'] = Expression;
    }
    Expression.prototype.forEach = Expression.prototype.each;
    return Expression;
  }


  blocks.extend(staticMethods, {
    add: function () {
      add(this.value(), arguments);
      return this;
    },

    remove: function (position, callback) {
      blocks.remove(this.value(), position, callback);
      return this;
    },

    removeAt: function (position, count) {
      blocks.removeAt(this.value(), position, count);
      return this;
    },

    removeAll: function (callback, thisArg) {
      if (arguments.length === 0) {
        blocks.removeAll(this.value());
      } else {
        blocks.removeAll(this.value(), callback, thisArg);
      }
      return this;
    },

    addMany: function () {
      addMany(this.value(), arguments);
      return this;
    },

    swap: function (index1, index2) {
      blocks.swap(this.value(), index1, index2);
      return this;
    },

    move: function (sourceIndex, targetIndex) {
      blocks.move(this.value(), sourceIndex, targetIndex);
      return this;
    }
  });

  /**
  * @memberof blocks.expressions
  * @class ArrayExpression
  */
  var RootArrayExpression = generateExpression('RootArray', 'arr', '', 1, true);

  blocks.extend(RootArrayExpression.prototype, {
    reverse: function () {
      return new RootArrayExpression(this._value.reverse());
    }
  });

  blocks.extend(blocks, {
    add: function (array) {
      return add(array, slice.call(arguments, 1));
    },

    addMany: function (array) {
      return addMany(array, slice.call(arguments, 1));
    },

    remove: function (array, position, callback) {
      if (positions.isPosition(position)) {
        return blocks.removeAt(array, positions.determineIndex(position, this._value.length), callback);
      } else {
        return blocks.removeAll(array, position, callback, true);
      }
    },

    removeAt: function (array, index, count) {
      if (!blocks.isNumber(count)) {
        count = 1;
      }
      array.splice(index, count);
      return array;
    },

    removeAll: function (array, callback, thisArg, removeOne) {
      var i = 0;
      var isCallbackAFunction = blocks.isFunction(callback);
      var value;

      if (arguments.length == 1) {
        array.splice(0, array.length);
      } else {
        for (; i < array.length; i++) {
          value = array[i];
          if (value === callback || (isCallbackAFunction && callback.call(thisArg, value, i, array))) {
            array.splice(i--, 1);
            if (removeOne) {
              break;
            }
          }
        }
      }

      return array;
    },

    toObject: function (array, values) {
      var result = {},
          useValuesArray = arguments.length > 1 && values,
          i = 0,
          length = array.length,
          value;

      for (; i < length; i++) {
        value = array[i];
        if (blocks.isArray(value)) {
          result[value[0]] = value[1];
        } else if (blocks.isObject(value)) {
          result[value.key] = value.value;
        } else {
          result[value] = useValuesArray ? values[i] : true;
        }
      }
      return result;
    },

    shuffle: function (array) {
      var shuffled = [];
      var i = 0;
      var length = array.length;
      var rand;

      for (; i < length; i++) {
        rand = blocks.random(i);
        shuffled[i] = shuffled[rand];
        shuffled[rand] = array[i];
      }
      return shuffled;
    }
  });

  function add(array, args) {
    if (args.length > 0) {
      var index = positions.determineIndex(args[0], array.length);
      var items = slice.call(args, positions.isPosition(args[0]) ? 1 : 0);
      var i = 0;

      if (index >= array.length) {
        for (; i < items.length; i++) {
          array[index + i] = items[i];
        }
      } else {
        array.splice.apply(array, [index, 0].concat(items));
      }
    }
    return array;
  }

  function addMany(array, args) {
    return add(array, blocks.flatten(args, true));
  }



  var RootObjectExpression = generateExpression('RootObject', 'obj', '', 2, true);

  blocks.set = function (object, objectOrKey, value) {
    var key;
    if (blocks.isString(objectOrKey)) {
      object[objectOrKey] = value;
    } else {
      for (key in objectOrKey) {
        object[key] = objectOrKey;
      }
    }
    return object;
  };

    var trimRegExp = /^\s+|\s+$/gm;


  var stringTrimStartRegex = /^(\s|\u00A0)+/;
  var stringTrimEndRegex = /(\s|\u00A0)+$/;

  function StringExpression(value, parent) {
    this.__Class__(value, parent);
  }

  StringExpression.prototype.constructor = BaseExpression;

  blocks.inherit(BaseExpression, StringExpression, {
    _expression: StringExpression,

    type: function () {
      return 'string';
    },

    substring: function (indexA, indexB) {
      return new StringExpression(this._value.substring(indexA, indexB));
    },

    isEmpty: function () {
      return this._resultExpression(this._value.length == 0);
    },

    size: function () {
      return new NumberExpression(blocks.size(this._value));
    },

    contains: function (value) {
      return this._resultExpression(this._value.indexOf(value) != -1);
    },

    startsWith: function (value) {
      return this._resultExpression(blocks.startsWith(this._value, value));
    },

    endsWith: function (value) {
      return this._resultExpression(blocks.endsWith(this._value, value));
    },

    trim: function (trimValue) {
      return new StringExpression(blocks.trim(this._value, trimValue));
    },

    trimStart: function (trimValue) {
      return new StringExpression(blocks.trimStart(this._value, trimValue));
    },

    trimEnd: function (trimValue) {
      return new StringExpression(blocks.trimEnd(this._value, trimValue));
    },

    repeat: function (count) {
      return new StringExpression(blocks.repeat(this._value, count));
    },

    reverse: function () {
      return new StringExpression(blocks.reverse(this._value));
    },

    wrap: function (wrapValue) {
      return new StringExpression(blocks.wrap(this._value, wrapValue));
    },

    format: function () {
      return new StringExpression(format(this._value, slice.call(arguments, 0)));
    },

    matches: function (regexp, count) {
      return new StringExpression(blocks.matches(this._value, regexp, count));
    },

    toUnit: function (unit) {
      return new StringExpression(blocks.toUnit(this._value, unit));
    },

    clone: function () {
      return new StringExpression(this._value.toString());
    }
  });

  blocks.extend(blocks, {
    startsWith: function (value, startsWith) {
      if (!blocks.isString(value)) {
        value = value.toString();
      }
      startsWith = startsWith.toString();
      return value.indexOf(startsWith) == 0;
    },

    endsWith: function (value, endsWith) {
      if (!blocks.isString(value)) {
        value = value.toString();
      }
      endsWith = endsWith.toString();
      return value.lastIndexOf(endsWith) == value.length - endsWith.length;
    },

    trim: function (string, trimValue) {
      return (string || '').toString().replace(typeof trimValue == 'string' ? new RegExp('^(' + trimValue + ')+|(' + trimValue + ')+$', 'g') : trimRegExp, '');
    },

    trimStart: function (string, trimValue) {
      return (string || '').toString().replace(typeof trimValue == 'string' ? new RegExp('^(' + trimValue + ')+') : stringTrimStartRegex, '');
    },

    trimEnd: function (string, trimValue) {
      return (string || '').toString().replace(typeof trimValue == 'string' ? new RegExp('(' + trimValue + ')+$') : stringTrimEndRegex, '');
    },

    repeat: function (string, count) {
      var result = '';
      var i = 0;

      if (count < 0 || typeof count != 'number') {
        return string;
      }

      count = Math.floor(count);
      for (; i < count; i++) {
        result += string;
      }
      return result;
    },

    reverse: function (value) {
      if (blocks.isArray(value)) {
        return value.reverse();
      }

      if (typeof value != 'string') {
        value = value.toString();
      }
      return value.split('').reverse().join('')
    },

    wrap: function (stringOrFunction, wrapValueOrCallback) {
      if (blocks.isFunction(stringOrFunction)) {
        return function () {
          var args = [stringOrFunction];
          push.apply(args, arguments);
          return wrapValueOrCallback.apply(this, args);
        };
      }
      return wrapValueOrCallback + stringOrFunction + blocks.reverse(wrapValueOrCallback);
    },

    format: function (string) {
      return format(string, slice.call(arguments, 1));
    },

    matches: function (string, reg, count) {
      count = blocks.isNumber(count) ? count : Number.MAX_VALUE;
      if (!blocks.isRegExp(reg)) {
        reg = new RegExp(reg.toString(), 'g');
      }
      var result = [];
      var match;
      var length;

      reg.lastIndex = 0;
      match = reg.exec(string);
      while (count > 0 && match) {
        length = blocks.isArray(match) ? match[0].length : match.length;
        result.push({
          result: match,
          input: match.input,
          startIndex: match.index,
          endIndex: match.index + length,
          length: length
        });
        if (!reg.global) {
          break;
        }
        match = reg.exec(string);
        count--;
      }

      return result;
    }
  });

  function format(string, args) {
    var regEx;
    var i = 0;

    // start with the second argument (i = 1)
    for (; i < args.length; i++) {
      // 'gm' = RegEx options for Global search (more than one instance)
      // and for Multiline search
      regEx = new RegExp('\\{' + i + '\\}', 'gm');
      string = string.replace(regEx, args[i]);
    }

    return string;
  }


  function FunctionExpression(value, parent) {
    this.__Class__(value, parent);
  }

  blocks.inherit(BaseExpression, FunctionExpression, {
    bind: function () {
      return new FunctionExpression(blocks.bind.apply(this, [this._value].concat(slice.call(arguments))));
    },

    partial: function () {
      return new FunctionExpression(partial(this._value, slice.call(arguments, 0)));
    },

    memoize: function (hasher) {
      return new FunctionExpression(blocks.memoize(this._value, hasher));
    },

    delay: function (wait) {
      return new FunctionExpression(delay(this._value, wait, slice.call(arguments, 1)));
    },

    throttle: function (wait, options) {
      return new FunctionExpression(blocks.throttle(this._value, wait, options));
    },

    debounce: function (wait, immediate) {
      return new FunctionExpression(blocks.debound(this._value, wait, immediate));
    },

    once: function () {
      return new FunctionExpression(blocks.once(this._value));
    },

    wrap: function (callback) {
      return new FunctionExpression(blocks.wrap(this._value, callback));
    }
  });

  blocks.extend(blocks, {
    partial: function (func) {
      var args = slice.call(arguments, 1);
      return partial(func, args);
    },

    memoize: function (func, hasher) {
      var memo = {};
      hasher || (hasher = identity);
      return function () {
        var key = hasher.apply(this, arguments);
        return memo.hasOwnProperty(key) ? memo[key] : (memo[key] = func.apply(this, arguments));
      };
    },

    delay: function (func, wait) {
      return delay(func, wait, slice.call(arguments, 2));
    },

    throttle: function (wait, func, options) {
      var context;
      var args;
      var result;
      var timeout = null;
      var previous = 0;

      options || (options = {});
      var later = function () {
        previous = options.leading === false ? 0 : new Date;
        timeout = null;
        result = func.apply(context, args);
      };
      return function () {
        var now = new Date;
        if (!previous && options.leading === false) previous = now;
        var remaining = wait - (now - previous);
        context = this;
        args = arguments;
        if (remaining <= 0) {
          clearTimeout(timeout);
          timeout = null;
          previous = now;
          result = func.apply(context, args);
        } else if (!timeout && options.trailing !== false) {
          timeout = setTimeout(later, remaining);
        }
        return result;
      };
    },

    debounce: function (func, wait, immediate) {
      var timeout,
          args,
          context,
          timestamp,
          result;
      return function () {
        context = this;
        args = arguments;
        timestamp = new Date();
        var later = function () {
          var last = (new Date()) - timestamp;
          if (last < wait) {
            timeout = setTimeout(later, wait - last);
          } else {
            timeout = null;
            if (!immediate) result = func.apply(context, args);
          }
        };
        var callNow = immediate && !timeout;
        if (!timeout) {
          timeout = setTimeout(later, wait);
        }
        if (callNow) result = func.apply(context, args);
        return result;
      };
    },

    once: function (func) {
      var ran = false,
          memo;
      return function () {
        if (ran) return memo;
        ran = true;
        memo = func.apply(this, arguments);
        func = null;
        return memo;
      };
    }
  });

  function partial(func, args) {
    return function () {
      return func.apply(this, args.concat(slice.call(arguments)));
    };
  }

  function delay(func, wait, args) {
    wait = wait || 0;
    return setTimeout(function () {
      return func.apply(null, args);
    }, wait);
  }


  blocks.random = function (min, max) {
    if (arguments.length == 0) {
      return Math.random();
    }
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(0 | Math.random() * (max - min + 1));
  };

  function NumberExpression(value, parent) {
    this.__Class__(value, parent);
  }

  blocks.inherit(BaseExpression, NumberExpression, {
    _expression: NumberExpression,

    type: function () {
      return 'number';
    },

    toUnit: function (unit) {
      unit = unit || 'px';
      return new StringExpression(this._value + unit, this);
    },

    random: function (min, max) {
      return new NumberExpression(blocks.random(min, max), this);
    },

    biggerThan: function (value) {
      var expression = new NumberExpression(this._value, this);
      expression._setResult(this._value > value);
      return expression;
    },

    lessThan: function () {
      var expression = new NumberExpression(this._value, this);
      expression._setResult(this._value < value);
      return expression;
    }
  });

  function DateExpression(value, parent) {
    this.__Class__(value, parent);
  }

  blocks.inherit(BaseExpression, DateExpression, {
    _expression: DateExpression,

    type: function () {
      return 'date';
    },

    addWeeks: function (weeks) {
      blocks.addWeeks(this._value, weeks);
      return this;
    },

    compare: function (date) {
      return new DateExpression(blocks.compare(this._value, date));
    },

    equalsDate: function (date) {
      this._setResult(blocks.equalsDate(this._value, date));
      return this;
    },

    equalsTime: function (date) {
      this._setResult(blocks.equalsTime(this._value, date));
      return this;
    },

    clearTime: function () {
      return new DateExpression(blocks.clearTime(this._value));
    }
  });

  blocks.extend(blocks, {
    addWeeks: function (date, weeks) {
      date.setDate(date.getDate() + weeks * 7);
      return date;
    },

    compare: function (dateA, dateB) {
      var result = dateA - dateB;
      result = result === 0 ? result : result < 0 ? -1 : 1;
      return result;
    },

    equalsDate: function (dateA, dateB) {
      return dateA.getFullYear() === dateB.getFullYear() &&
             dateA.getMonth() === dateB.getMonth() &&
             dateA.getDate() === dateB.getDate();
    },

    equalsTime: function (dateA, dateB) {
      return dateA.getHours() === dateB.getHours() &&
             dateA.getMinutes() === dateB.getMinutes() &&
             dateA.getSeconds() === dateB.getSeconds() &&
             dateA.getMilliseconds() === dateB.getMilliseconds();
    },

    clearTime: function (date) {
      date.setHours(0, 0, 0, 0);
      return date;
    }
  });

  blocks.each([['Years', 'FullYear'], ['Months', 'Month'], ['Days', 'Date'], 'Hours', 'Minutes', 'Seconds', 'Milliseconds'], function (value) {
    var methodName = value;
    var propertyName = value;
    if (blocks.isArray(value)) {
      methodName = value[0];
      propertyName = value[1];
    }
    methodName = 'add' + methodName;
    blocks[methodName] = function (date, value) {
      date['set' + propertyName](date['get' + propertyName]() + value);
      return date;
    }
    DateExpression.prototype[methodName] = function (value) {
      return new DateExpression(blocks[methodName](this._value, value));
    }
  });


  function RegExpExpression(value, parent) {
    this.__Class__(value, parent);
  }

  blocks.inherit(BaseExpression, RegExpExpression, {
    equals: function () {

    },

    matches: function (string, count) {
      return new RegExpExpression(blocks.matches(this._value, string, count));
    },

    reset: function () {

    },

    clone: function () {
      return new RegExpExpression(blocks.clone(this._value));
    }
  });



  var core = blocks.core;

  core.expressionsCreated = true;

  if (core.trigger) {
    core.trigger('expressionsCreated');
  }

  core.createExpression = function (value) {
    var type;

    if (value instanceof Array || (value && value.jquery)) {
      return new RootArrayExpression(value);
    }
    if (typeof value == 'string' || value instanceof String) {
      return new StringExpression(value);
    }
    if (typeof value == 'number' || value instanceof Number) {
      return new NumberExpression(value);
    }
    if (value instanceof Date) {
      return new DateExpression(value);
    }
    if ((type = toString.call(value)) === '[object RegExp]') {
      return new RegExpExpression(value);
    }
    if (value == null) {
      return new BaseExpression(value);
    }
    if (value._prototypeIndentification == '__blocks.expression__') {
      return value;
    }
    if (type == '[object Function]') {
      return new FunctionExpression(value);
    }

    return new RootObjectExpression(value);
  };

  core.isExpression = function (value) {
    return value && value._prototypeIndentification == '__blocks.expression__';
  };

  core.staticExpression = {
    range: function (start, end, step) {
      step = step || 1;
      if (arguments.length == 1) {
        end = start;
        start = 0;
      }

      var root = new RootArrayExpression([]);
      return root.range(start, end, step);
    },

    repeat: function () {

    }
  };

  core.isArrayExpression = function (value) {
    return ChildArrayExpression.prototype.isPrototypeOf(value);
  };

  core.isObjectExpression = function (value) {
    return ChildObjectExpression.prototype.isPrototypeOf(value);
  };


  var expressionsByName = {
    'array': RootArrayExpression,
    'object': RootObjectExpression
  };

  var skipMethods = blocks.toObject(['value', 'not', 'and', 'or', 'type', 'is', 'result'])

  blocks.core.applyExpressions = function (expressionName, object, methods) {
    // TODO: Removed when all expresions are implemented
    if (!expressionsByName[expressionName]) {
      return;
    }
    var prototype = expressionsByName[expressionName].prototype;
    var key;

    for (key in prototype) {
      if (!object[key] && !skipMethods[key] && blocks.isFunction(prototype[key]) && (!methods || methods[key])) {
        object[key] = applyExpression(key);
      }
    }
  };

  function applyExpression(key) {
    return function () {
      var value = blocks.unwrap(this._value || this.data || this);
      if (blocks[key]) {
        return blocks.unwrap(blocks[key].apply(value, [value].concat(blocks.toArray(arguments))));
      } else {
        value = blocks(value);
        value = value[key].apply(value, blocks.toArray(arguments));
        return value.result() || value.value();
      }
    };
  }



  function createContext() {
    return {
      indexOrKey: 'indexOrKey',
      length: 'length',
      result: 'result',
      isCollectionAnArray: 'isCollectionAnArray',
      collection: 'collection',
      expression: 'expression',
      value: 'value',
      resultIndex: 0,
      isArrayCheck: 'typeof length == "number"',
      skip: 0,
      take: null,

      //reverse: false,
      args: [],
      variables: [],
      objectBeforeLoops: [],
      arrayBeforeLoops: [],
      objectInLoops: [],
      arrayInLoops: [],
      objectAfterLoops: [],
      arrayAfterLoops: [],
      conditionsEnd: ''
    };
  }

  function createConditionsCreator() {
    var context = {
      result: 'result',
      inLoop: true,
      items: []
    };
    var index = 0;
    var items = context.items;
    var declarations = [];
    var boolResultsCount = 0;
    var lastBoolResult;

    return {
      callback: function (descriptorData) {
        var handled = true;

        switch (descriptorData.name) {
          case 'and':
            items.push(' && ');
            break;
          case 'or':
            items.push(' || ');
            break;
          case 'not':
            if (lastBoolResult === false) {
              context.inLoop = false;
            }
            lastBoolResult = undefined;
            items.splice(items.length - 1, 0, '!');
            boolResultsCount++;
            break;
          default:
            handled = false;
            if (descriptorData.boolResult !== undefined) {
              if (lastBoolResult !== undefined && lastBoolResult === true) {
                context.inLoop = false;
              }
              lastBoolResult = descriptorData.boolResult;
              boolResultsCount++;
              items.push(context.result + index);
              descriptorData.inLoop = (descriptorData.inLoop || '').replace(/(\s|;)(break\s?;)/g, function (match) {
                var result = '';
                if (match[0] == ';') {
                  result = ';';
                }
                return result;
              });
            }
            declarations.push(blocks.format('var {0}{1};', context.result, index));
            break;
        }
        index++;
        return handled;
      },

      end: function (parentContext) {
        if (lastBoolResult !== undefined && lastBoolResult === true) {
          context.inLoop = false;
        }

        parentContext.conditionsDeclarations = declarations.join('');
        if (boolResultsCount > 1) {
          //for (var i = 0; i < items.length; i++) {
          //    if (items[i] == '!' && items[i + 1].indexOf(parentContext.result) == -1) {
          //        items.splice(i, 1);
          //    }
          //}
          //while (items[0] == ' && ' || items[0] == ' || ') {
          //    items.splice(0, 1);
          //}
          //while (items[items.length - 1] == ' && ' || items[items.length - 1] == ' || ') {
          //    items.pop();
          //}

          parentContext.conditions = true;
          //parentContext.conditionsEnd = LoopDescriptors.conditionsEnd(context).replace(/\|\|/g, '&&');//.replace(/&&\s?/g, '&& !');
          parentContext[(context.inLoop ? 'inLoop' : 'afterLoop') + 'Conditions'] = LoopDescriptors.conditions(context);
          if (context.inLoop) {
            context.inLoop = false;
            parentContext.afterLoopConditions = LoopDescriptors.conditions(context);
          }
        }
      }
    };
  }

  function createExpression(expression) {
    var context = createContext();
    var isSingleExpression = expression._isSingle;
    var type = expression._type;
    var types = isSingleExpression ? ['array', 'object'] : [expression._type == 1 ? 'array' : 'object'];
    var index = isSingleExpression ? '' : 0;
    var tillExpressions = [];
    var conditionsCreator = isSingleExpression ? undefined : createConditionsCreator();
    var skipIndex = 0;
    var takeIndex = 0;
    var disregardResultIndex = false;
    var skipTake = '';
    var onlySkipTake = true;
    var descriptorData;
    var func;

    while (expression._parent) {
      blocks.each(types, function (type, typesIndex) {
        if (expression._descriptor.identity == 'filter') {
          if (context.skip) {
            skipTake += LoopDescriptors.skip({ index: skipIndex });
          }
          if (context.take !== null) {
            skipTake += LoopDescriptors.take({ index: takeIndex });
          }
          context.skip = 0;
          context.take = null;
        }

        descriptorData = expression._descriptor(index, type, expression, tillExpressions, skipTake);
        skipTake = '';

        if (typesIndex === 0) {
          context.args.push(descriptorData.args || []);
        }

        switch (descriptorData.name) {
          case 'skip':
            if (!context.skip) {
              context.skip = 'skip' + index;
            }
            return;
          case 'take':
            if (context.take === null) {
              context.take = 'take' + index;
            }
            return;
          case 'reverse':
            context.reverse = !context.reverse;
            return;
        }
        onlySkipTake = false;

        if (isSingleExpression || !conditionsCreator.callback(descriptorData)) {
          if (typesIndex === 0) {
            if (descriptorData.reverse) {
              context.reverse = !context.reverse;
            }
          }

          if (!isSingleExpression) {
            type = 'array';
          }

          if (descriptorData.boolResult !== undefined) {
            context.resultIndex = index || 0;
          } else if (!index) {
            disregardResultIndex = true;
          }

          if (descriptorData.beforeLoop) {
            context[type + 'BeforeLoops'].push(descriptorData.beforeLoop);
          }
          if (descriptorData.inLoop) {
            context[type + 'InLoops'].push(descriptorData.inLoop);
          }
          if (descriptorData.afterLoop) {
            context[type + 'AfterLoops'].push(descriptorData.afterLoop);
          }
        }
      });

      if (descriptorData.name != 'skip' && descriptorData.name != 'take' && descriptorData.name != 'reverse') {
        tillExpressions.push(expression);
      } else if (tillExpressions.length == 0) {
        context.resultIndex += 1;
        if (descriptorData.name == 'skip') {
          skipIndex = skipIndex || index;
        } else {
          takeIndex = takeIndex || index;
        }
      }
      index = +index + 1;
      expression = expression._parent;
    }

    context.isObject = RootObjectExpression.prototype.isPrototypeOf(expression);

    if (isSingleExpression) {
      switch (type) {
        case 'array':
          context.isArrayCheck = true;
          break;
        case 'object':
          context.isArrayCheck = false;
          break;
      }

      if (typeof module === 'object' && typeof module.exports === 'object') {
        func = new Function(['blocks', 'collection'].concat(context.args[0]), expression._loopDescriptor(context));
        return function () {
          return func.apply(this, [blocks].concat(blocks.toArray(arguments)));
        };
      }
      return new Function(['collection'].concat(context.args[0]), expression._loopDescriptor(context));
    } else {
      conditionsCreator.end(context);

      if (onlySkipTake) {
        context['arrayBeforeLoops'].push(context.result + context.resultIndex + ' = [];');
        context['arrayInLoops'].push(context.result + context.resultIndex + '.push(' + context.value + ');');
      }
      if (disregardResultIndex) {
        context.resultIndex = 0;
      }
      if (typeof module === 'object' && typeof module.exports === 'object') {
        func = new Function(['blocks', context.expression], expression._loopDescriptor(context));
        return function (collection) {
          return func(blocks, collection);
        };
      }
      return new Function(context.expression, expression._loopDescriptor(context));
    }
  }

    var descriptors = blocks.extend({}, CollectionDescriptors, ArrayDescriptors, ObjectDescriptors);

    function mock(descriptor) {
        var root = {
            _loopDescriptor: LoopDescriptors[descriptor.identity] || LoopDescriptors.singleExpression
        };
        var expression = {
            _parent: root,
            _descriptor: descriptor,
            _isSingle: true,
            _type: descriptor.parent.type
        };
        return expression;
    }
    

    function create(name) {
        var descriptor = descriptors[name];
        if (blocks.isFunction(descriptor)) {
            var expression = mock(descriptor);
            if (!blocks[name]) {
                blocks[name] = createExpression(expression);
            } else {
                return createExpression(expression);
            }
        }
    }
    
    for (var key in descriptors) {
        create(key);
    }

    blocks.forEach = blocks.each;

    var blocksAtOriginal = blocks.at;
    var blocksAt = create('at');
    blocks.at = function (array, position, count) {
        if (blocks.isNumber(array)) {
            return blocksAtOriginal(array);
        }
        return blocksAt(array, position, count);
    };

    var blocksFirstOriginal = blocks.first;
    var blocksFirst = create('first');
    blocks.first = function (array, callback, thisArg) {
        if (arguments.length == 0) {
            return blocksFirstOriginal;
        }
        return blocksFirst(array, callback, thisArg);
    };

    var blocksLastOriginal = blocks.last;
    var blocksLast = create('last');
    blocks.last = function (array, callback, thisArg) {
        if (arguments.length == 0) {
            return blocksLastOriginal;
        }
        return blocksLast(array, callback, thisArg);
    };

    var blocksContains = blocks.contains;
    blocks.contains = function (value, searchValue) {
        if (blocks.isString(value)) {
            return value.indexOf(searchValue) != -1;
        }
        return blocksContains(value, searchValue);
    };





})();
(function () {


  function parseCallback(callback, thisArg) {
    //callback = parseExpression(callback);
    if (thisArg != null) {
      var orgCallback = callback;
      callback = function (value, index, collection) {
        return orgCallback.call(thisArg, value, index, collection);
      };
    }
    return callback;
  }

  var Events = (function () {
    function createEventMethod(eventName) {
      return function (callback, context) {
        if (arguments.length > 1) {
          Events.on(this, eventName, callback, context);
        } else {
          Events.on(this, eventName, callback);
        }
        return this;
      };
    }

    var methods = {
      on: function (eventName, callback, context) {
        if (arguments.length > 2) {
          Events.on(this, eventName, callback, context);
        } else {
          Events.on(this, eventName, callback);
        }
        return this;
      },

      once: function (eventNames, callback, thisArg) {
        Events.once(this, eventNames, callback, thisArg);
      },

      off: function (eventName, callback) {
        Events.off(this, eventName, callback);
      },

      trigger: function (eventName) {
        Events.trigger(this, eventName, blocks.toArray(arguments).slice(1, 100));
      }
    };
    methods._trigger = methods.trigger;

    return {
      register: function (object, eventNames) {
        eventNames = blocks.isArray(eventNames) ? eventNames : [eventNames];
        for (var i = 0; i < eventNames.length; i++) {
          var methodName = eventNames[i];
          if (methods[methodName]) {
            object[methodName] = methods[methodName];
          } else {
            object[methodName] = createEventMethod(methodName);
          }
        }
      },

      on: function (object, eventNames, callback, thisArg) {
        eventNames = blocks.toArray(eventNames).join(' ').split(' ');

        var i = 0;
        var length = eventNames.length;
        var eventName;

        if (!callback) {
          return;
        }

        if (!object._events) {
          object._events = {};
        }
        for (; i < length; i++) {
          eventName = eventNames[i];
          if (!object._events[eventName]) {
            object._events[eventName] = [];
          }
          object._events[eventName].push({
            callback: callback,
            thisArg: thisArg
          });
        }
      },

      once: function (object, eventNames, callback, thisArg) {
        Events.on(object, eventNames, callback, thisArg);
        Events.on(object, eventNames, function () {
          Events.off(object, eventNames, callback);
        });
      },

      off: function (object, eventName, callback) {
        if (blocks.isFunction(eventName)) {
          callback = eventName;
          eventName = undefined;
        }

        if (eventName !== undefined || callback !== undefined) {
          blocks.each(object._events, function (events, currentEventName) {
            if (eventName !== undefined && callback === undefined) {
              object._events[eventName] = [];
            } else {
              blocks.each(events, function (eventData, index) {
                if (eventData.callback == callback) {
                  object._events[currentEventName].splice(index, 1);
                  return false;
                }
              });
            }
          });
        } else {
          object._events = undefined;
        }
      },

      trigger: function (object, eventName) {
        var result = true;
        var eventsData;
        var thisArg;
        var args;

        if (object && object._events) {
          eventsData = object._events[eventName];

          if (eventsData && eventsData.length > 0) {
            args = Array.prototype.slice.call(arguments, 2);

            blocks.each(eventsData, function iterateEventsData(eventData) {
              if (eventData) {
                thisArg = object;
                if (eventData.thisArg !== undefined) {
                  thisArg = eventData.thisArg;
                }
                if (eventData.callback.apply(thisArg, args) === false) {
                  result = false;
                }
              }
            });
          }
        }

        return result;
      },

      has: function (object, eventName) {
        return !!blocks.access(object, '_events.' + eventName + '.length');
      }
    };
  })();

  // Implementation of blocks.domReady event
  (function () {
    blocks.isDomReady = false;

    //blocks.elementReady = function (element, callback, thisArg) {
    //  callback = parseCallback(callback, thisArg);
    //  if (element) {
    //    callback();
    //  } else {
    //    blocks.domReady(callback);
    //  }
    //};

    blocks.domReady = function (callback, thisArg) {
      if (typeof document == 'undefined' || typeof window == 'undefined' ||
        (window.__mock__ && document.__mock__)) {
        return;
      }

      callback = parseCallback(callback, thisArg);
      if (blocks.isDomReady || document.readyState == 'complete' ||
        (window.jQuery && window.jQuery.isReady)) {
        blocks.isDomReady = true;
        callback();
      } else {
        Events.on(blocks.core, 'domReady', callback);
        handleReady();
      }
    };

    function handleReady() {
      if (document.readyState === 'complete') {
        setTimeout(ready);
      } else if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', completed, false);
        window.addEventListener('load', completed, false);
      } else {
        document.attachEvent('onreadystatechange', completed);
        window.attachEvent('onload', completed);

        var top = false;
        try {
          top = window.frameElement == null && document.documentElement;
        } catch (e) { }

        if (top && top.doScroll) {
          (function doScrollCheck() {
            if (!blocks.isDomReady) {
              try {
                top.doScroll('left');
              } catch (e) {
                return setTimeout(doScrollCheck, 50);
              }

              ready();
            }
          })();
        }
      }
    }

    function completed() {
      if (document.addEventListener || event.type == 'load' || document.readyState == 'complete') {
        ready();
      }
    }

    function ready() {
      if (!blocks.isDomReady) {
        blocks.isDomReady = true;
        Events.trigger(blocks.core, 'domReady');
        Events.off(blocks.core, 'domReady');
      }
    }
  })();

    var slice = Array.prototype.slice;

    var trimRegExp = /^\s+|\s+$/gm;


  function keys(array) {
    var result = {};
    blocks.each(array, function (value) {
      result[value] = true;
    });
    return result;
  }
    var classAttr = 'class';

    var queries = (blocks.queries = {});


  var isMouseEventRegEx = /^(?:mouse|pointer|contextmenu)|click/;
  var isKeyEventRegEx = /^key/;

  function returnFalse() {
    return false;
  }

  function returnTrue() {
    return true;
  }

  function Event(e) {
    this.originalEvent = e;
    this.type = e.type;

    this.isDefaultPrevented = e.defaultPrevented ||
        (e.defaultPrevented === undefined &&
        // Support: IE < 9, Android < 4.0
        e.returnValue === false) ?
        returnTrue :
        returnFalse;

    this.timeStamp = e.timeStamp || +new Date();
  }

  Event.PropertiesToCopy = {
    all: 'altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which'.split(' '),
    mouse: 'button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement'.split(' '),
    keyboard: 'char charCode key keyCode'.split(' ')
  };

  Event.CopyProperties = function (originalEvent, event, propertiesName) {
    blocks.each(Event.PropertiesToCopy[propertiesName], function (propertyName) {
      event[propertyName] = originalEvent[propertyName];
    });
  };

  Event.prototype = {
    preventDefault: function () {
        var e = this.originalEvent;

        this.isDefaultPrevented = returnTrue;

        if (e.preventDefault) {
            // If preventDefault exists, run it on the original event
            e.preventDefault();
        } else {
            // Support: IE
            // Otherwise set the returnValue property of the original event to false
            e.returnValue = false;
        }
    },

    stopPropagation: function () {
        var e = this.originalEvent;

        this.isPropagationStopped = returnTrue;

        // If stopPropagation exists, run it on the original event
        if (e.stopPropagation) {
            e.stopPropagation();
        }

        // Support: IE
        // Set the cancelBubble property of the original event to true
        e.cancelBubble = true;
    },

    stopImmediatePropagation: function () {
        var e = this.originalEvent;

        this.isImmediatePropagationStopped = returnTrue;

        if (e.stopImmediatePropagation) {
            e.stopImmediatePropagation();
        }

        this.stopPropagation();
    }
  };

  Event.fix = function (originalEvent) {
    var type = originalEvent.type;
    var event = new Event(originalEvent);

    Event.CopyProperties(originalEvent, event, 'all');

    // Support: IE<9
    // Fix target property (#1925)
    if (!event.target) {
        event.target = originalEvent.srcElement || document;
    }

    // Support: Chrome 23+, Safari?
    // Target should not be a text node (#504, #13143)
    if (event.target.nodeType === 3) {
        event.target = event.target.parentNode;
    }

    // Support: IE<9
    // For mouse/key events, metaKey==false if it's undefined (#3368, #11328)
    event.metaKey = !!event.metaKey;

    if (isMouseEventRegEx.test(type)) {
        Event.fixMouse(originalEvent, event);
    } else if (isKeyEventRegEx.test(type) && event.which == null) {
        Event.CopyProperties(originalEvent, event, 'keyboard');
        // Add which for key events
        event.which = originalEvent.charCode != null ? originalEvent.charCode : originalEvent.keyCode;
    }

    return event;
  };

  Event.fixMouse = function (originalEvent, event) {
    var button = originalEvent.button;
    var fromElement = originalEvent.fromElement;
    var body;
    var eventDoc;
    var doc;

    Event.CopyProperties(originalEvent, event, 'mouse');

    // Calculate pageX/Y if missing and clientX/Y available
    if (event.pageX == null && originalEvent.clientX != null) {
        eventDoc = event.target.ownerDocument || document;
        doc = eventDoc.documentElement;
        body = eventDoc.body;

        event.pageX = originalEvent.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
        event.pageY = originalEvent.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc && doc.clientTop || body && body.clientTop || 0);
    }

    // Add relatedTarget, if necessary
    if (!event.relatedTarget && fromElement) {
        event.relatedTarget = fromElement === event.target ? originalEvent.toElement : fromElement;
    }

    // Add which for click: 1 === left; 2 === middle; 3 === right
    // Note: button is not normalized, so don't use it
    if (!event.which && button !== undefined) {
        /* jshint bitwise: false */
        event.which = (button & 1 ? 1 : (button & 2 ? 3 : (button & 4 ? 2 : 0)));
    }
  };

  //var event = blocks.Event();
  //event.currentTarget = 1; // the current element from which is the event is fired
  //event.namespace = ''; // the namespace for the event

  function addListener(element, eventName, callback) {
    if (element.addEventListener && eventName != 'propertychange') {
      element.addEventListener(eventName, function (event) {
        callback.call(this, Event.fix(event));
      }, false);
    } else if (element.attachEvent) {
      element.attachEvent('on' + eventName, function (event) {
        callback.call(this, Event.fix(event));
      });
    }
  }

  function getClassIndex(classAttribute, className) {
    if (!classAttribute || typeof classAttribute !== 'string' || className == null) {
      return -1;
    }

    classAttribute = ' ' + classAttribute + ' ';
    return classAttribute.indexOf(' ' + className + ' ');
  }

  var ampRegEx = /&/g;
  var lessThanRegEx = /</g;

  function escapeValue(value) {
    return String(value)
      .replace(ampRegEx, '&amp;')
      .replace(lessThanRegEx, '&lt;');
  }
    var hasOwn = Object.prototype.hasOwnProperty;

    var virtualElementIdentity = '__blocks.VirtualElement__';

    var dataIdAttr = 'data-id';

    var dataQueryAttr = 'data-query';


  function createFragment(html) {
    var fragment = document.createDocumentFragment();
    var temp = document.createElement('div');
    var count = 1;
    var table = '<table>';
    var tableEnd = '</table>';
    var tbody = '<tbody>';
    var tbodyEnd = '</tbody>';
    var tr = '<tr>';
    var trEnd = '</tr>';

    html = html.toString();

    if ((html.indexOf('<option') != -1) && html.indexOf('<select') == -1) {
      html = '<select>' + html + '</select>';
      count = 2;
    } else if (html.indexOf('<table') == -1) {
      if (html.match(/<(tbody|thead|tfoot)/)) {
        count = 2;
        html = table + html + tableEnd;
      } else if (html.indexOf('<tr') != -1) {
        count = 3;
        html = table + tbody + html + tbodyEnd + tableEnd;
      } else if (html.match(/<(td|th)/)) {
        count = 4;
        html = table + tbody + tr + html + trEnd + tbodyEnd + tableEnd;
      }
    }


    temp.innerHTML = 'A<div>' + html + '</div>';

    while (count--) {
      temp = temp.lastChild;
    }

    while (temp.firstChild) {
      fragment.appendChild(temp.firstChild);
    }

    return fragment;
  }

  var browser = {};

  function parseVersion(matches) {
    if (matches) {
      return parseFloat(matches[1]);
    }
    return undefined;
  }

  if (typeof document !== 'undefined') {
    blocks.extend(browser, {
      IE: document && (function () {
        var version = 3;
        var div = document.createElement('div');
        var iElems = div.getElementsByTagName('i');

        /* jshint noempty: false */
        // Disable JSHint error: Empty block
        // Keep constructing conditional HTML blocks until we hit one that resolves to an empty fragment
        while (
          div.innerHTML = '<!--[if gt IE ' + (++version) + ']><i></i><![endif]-->',
          iElems[0]
          ) { }
        return version > 4 ? version : undefined;
      }()),

      Opera: (window && window.navigator && window.opera && window.opera.version && parseInt(window.opera.version(), 10)) || undefined,

      Safari: window && window.navigator && parseVersion(window.navigator.userAgent.match(/^(?:(?!chrome).)*version\/([^ ]*) safari/i)),

      Firefox: window && window.navigator && parseVersion(window.navigator.userAgent.match(/Firefox\/([^ ]*)/))
    });
  }

  var ElementsData = (function () {
    var data = {};
    var globalId = 1;
    
    function getDataId(element) {
      var result = element ? VirtualElement.Is(element) ? element._state ? element._state.attributes[dataIdAttr] : element._attributes[dataIdAttr] :
        element.nodeType == 1 ? element.getAttribute(dataIdAttr) :
          element.nodeType == 8 ? /\s+(\d+):[^\/]/.exec(element.nodeValue) :
            null :
        null;

      return blocks.isArray(result) ? result[1] : result;
    }

    function setDataId(element, id) {
      if (VirtualElement.Is(element)) {
        element.attr(dataIdAttr, id);
      } else if (element.nodeType == 1) {
        element.setAttribute(dataIdAttr, id);
      }
    }

    return {
      id: function (element) {
        return getDataId(element);
      },

      /* @if SERVER */
      reset: function () {
        data = {};
        globalId = 1;
      },
      /* @endif */

      collectGarbage: function () {
        blocks.each(data, function (value) {
          if (value && value.dom && !document.body.contains(value.dom)) {
            ElementsData.clear(value.id, true);
          }
        });
      },

      createIfNotExists: function (element) {
        var isVirtual = element && element.__identity__ == virtualElementIdentity;
        var currentData;
        var id;
        
        if (isVirtual) {
          currentData = data[element._getAttr(dataIdAttr)];
        } else {
          currentData = data[element && getDataId(element)];
        }

        if (!currentData) {
          id = globalId++;
          if (element) {
            if (isVirtual && element._each) {
              element._haveAttributes = true;
              if (element._state) {
                element._state.attributes[dataIdAttr] = id;
              } else {
                element._attributes[dataIdAttr] = id;
              }
            } else {
              setDataId(element, id);
            }
          }

          // if element is not defined then treat it as expression
          if (!element) {
            currentData = data[id] = {
              id: id
            };
          } else {
            currentData = data[id] = {
              id: id,
              virtual: isVirtual ? element : null,
              animating: 0,
              observables: {},
              preprocess: isVirtual
            };
          }
        }

        return currentData;
      },

      byId: function (id) {
        return data[id];
      },

      data: function (element, name, value) {
        var result = data[getDataId(element) || element];
        if (!result) {
          return;
        }
        if (arguments.length == 1) {
          return result;
        } else if (arguments.length > 2) {
          result[name] = value;
        }
        return result[name];
      },

      clear: function (element, force) {
        var id = getDataId(element) || element;
        var currentData = data[id];

        if (currentData && (!currentData.haveData || force)) {
          blocks.each(currentData.observables, function (value) {
            for (var i = 0; i < value._elements.length; i++) {
              if (value._elements[i].elementId == data.id) {
                value._elements.splice(i, 1);
                i--;
              }
            }
          });
          data[id] = undefined;
          if (VirtualElement.Is(element)) {
            element.attr(dataIdAttr, null);
          } else if (element.nodeType == 1) {
            element.removeAttribute(dataIdAttr);
          }
        }
      }
    };
  })();

  function on(element, eventName, handler) {
    if (Workarounds[eventName]) {
      Workarounds[eventName](element, handler, function (eventName, callback) {
        addListener(element, eventName, callback);
      });
    } else {
      addListener(element, eventName, handler);
    }
  }

  var Workarounds = {
    input: function (element, handler, subscribe) {
      var timeout;

      function call(e) {
        clearTimeout(timeout);
        handler(e);
      }

      function deferCall() {
        if (!timeout) {
          timeout = setTimeout(call, 4);
        }
      }

      if (browser.IE < 10) {
        subscribe('propertychange', function (e) {
          if (e.originalEvent.propertyName === 'value') {
            call(e);
          }
        });

        if (browser.IE == 8) {
          subscribe('keyup', call);
          subscribe('keydown', call);
        }
        if (browser.IE >= 8) {
          globalSelectionChangeHandler(element, call);
          subscribe('dragend', deferCall);
        }
      } else {
        subscribe('input', call);

        if (browser.Safari < 7 && element.tagName.toLowerCase() == 'textarea') {
          subscribe('keydown', deferCall);
          subscribe('paste', deferCall);
          subscribe('cut', deferCall);
        } else if (browser.Opera < 11) {
          subscribe('keydown', deferCall);
        } else if (browser.Firefox < 4.0) {
          subscribe('DOMAutoComplete', call);
          subscribe('dragdrop', call);
          subscribe('drop', call);
        }
      }
    }
  };

  var globalSelectionChangeHandler = (function () {
    var isRegistered = false;

    function selectionChangeHandler(e) {
      var element = this.activeElement;
      var handler = element && ElementsData.data(element, 'selectionchange');
      if (handler) {
        handler(e);
      }
    }

    return function (element, handler) {
      if (!isRegistered) {
        addListener(element.ownerDocument, 'selectionchange', selectionChangeHandler);
        isRegistered = true;
      }
      ElementsData.createIfNotExists(element).selectionChange = handler;
    };
  })();

  
  var dom = blocks.dom = {
    valueTagNames: {
      input: true,
      textarea: true,
      select: true
    },

    valueTypes: {
      file: true,
      hidden: true,
      password: true,
      text: true,

      // New HTML5 Types
      color: true,
      date: true,
      datetime: true,
      'datetime-local': true,
      email: true,
      month: true,
      number: true,
      range: true,
      search: true,
      tel: true,
      time: true,
      url: true,
      week: true
    },

    props: {
      'for': true,
      'class': true,
      value: true,
      checked: true,
      tabindex: true,
      className: true,
      htmlFor: true
    },

    propFix: {
      'for': 'htmlFor',
      'class': 'className',
      tabindex: 'tabIndex'
    },

    attrFix: {
      className: 'class',
      htmlFor: 'for'
    },

    addClass: function (element, className) {
      if (element) {
        setClass('add', element, className);  
      }
    },

    removeClass: function (element, className) {
      if (element) {
        setClass('remove', element, className);  
      }
    },

    html: function (element, html) {
      if (element) {
        html = html.toString();
        if (element.nodeType == 8) {
          dom.comment.html(element, html);
        } else if (browser.IE < 10) {
          while (element.firstChild) {
            element.removeChild(this._element.firstChild);
          }
          element.appendChild(createFragment(html));
        } else {
          element.innerHTML = html;
        }
      }
    },

    css: function (element, name, value) {
      // IE7 will thrown an error if you try to set element.style[''] (with empty string)
      if (!element || !name) {
        return;
      }

      if (name == 'display') {
        animation.setVisibility(element, value == 'none' ? false : true);
      } else {
        element.style[name] = value;
      }
    },

    on: function (element, eventName, handler) {
      if (element) {
        on(element, eventName, handler);
      }
    },

    off: function () {

    },

    removeAttr: function (element, attributeName) {
      if (element && attributeName) {
        dom.attr(element, attributeName, null);  
      }
    },

    attr: function (element, attributeName, attributeValue) {
      var isProperty = dom.props[attributeName];
      attributeName = dom.propFix[attributeName.toLowerCase()] || attributeName;

      if ((blocks.core.skipExecution &&
        blocks.core.skipExecution.element === element &&
        blocks.core.skipExecution.attributeName == attributeName) ||
        !element) {
        return;
      }
      
      if (element.nodeType == 8) {
        dom.comment.attr(element, attributeName, attributeValue);
        return;
      }

      if (attributeName == 'checked') {
        if (attributeValue != 'checked' &&
          typeof attributeValue == 'string' &&
          element.getAttribute('type') == 'radio' &&
          attributeValue != element.value && element.defaultValue != null && element.defaultValue !== '') {

          attributeValue = false;
        } else {
          attributeValue = !!attributeValue;
        }
      }

      if (arguments.length === 1) {
        return isProperty ? element[attributeName] : element.getAttribute(attributeName);
      } else if (attributeValue != null) {
        if (attributeName == 'value' && element.tagName.toLowerCase() == 'select') {
          attributeValue = keys(blocks.toArray(attributeValue));
          blocks.each(element.children, function (child) {
            child.selected = !!attributeValue[child.value];
          });
        } else {
          if (isProperty) {
            element[attributeName] = attributeValue;
          } else {
            element.setAttribute(attributeName, attributeValue);
          }
        }
      } else {
        if (isProperty) {
          if (attributeName == 'value' && element.tagName.toLowerCase() == 'select') {
            element.selectedIndex = -1;
          } else if (element[attributeName]) {
            element[attributeName] = '';
          }
        } else {
          element.removeAttribute(attributeName);
        }
      }
    },

    comment: {
      html: function (element, html) {
        // var commentElement = this._element.nextSibling;
        // var parentNode = commentElement.parentNode;
        // parentNode.insertBefore(DomQuery.CreateFragment(html), commentElement);
        // parentNode.removeChild(commentElement);
        var commentElement = element;
        var parentNode = commentElement.parentNode;
        var currentElement = commentElement.nextSibling;
        var temp;
        var count = 0;

        while (currentElement && (currentElement.nodeType != 8 || currentElement.nodeValue.indexOf('/blocks') == -1)) {
          count++;
          temp = currentElement.nextSibling;
          parentNode.removeChild(currentElement);
          currentElement = temp;
        }

        parentNode.insertBefore(createFragment(html), commentElement.nextSibling);
        //parentNode.removeChild(currentElement);
        return count;
      },

      attr: function (element, attributeName, attributeValue) {
        if (element && attributeName == dataIdAttr && attributeValue) {
          var commentElement = element;
          // TODO: This should be refactored
          var endComment = element._endElement;
          commentElement.nodeValue = ' ' + attributeValue + ':' + commentElement.nodeValue.replace(trimRegExp, '') + ' ';
          endComment.nodeValue = ' ' + attributeValue + ':' + endComment.nodeValue.replace(trimRegExp, '') + ' ';
          return this;
        }
        return this;
      }
    }
  };
    var parameterQueryCache = {};


  var Observer = (function () {
    var stack = [];

    return {
      startObserving: function () {
        stack.push([]);
      },

      stopObserving: function () {
        return stack.pop();
      },

      currentObservables: function () {
        return stack[stack.length - 1];
      },

      registerObservable: function (newObservable) {
        var observables = stack[stack.length - 1];
        var alreadyExists = false;

        if (observables) {
          blocks.each(observables, function (observable) {
            if (observable === newObservable) {
              alreadyExists = true;
              return false;
            }
          });
          if (!alreadyExists) {
            observables.push(newObservable);
          }
        }
      }
    };
  })();

  var Expression = {
    Html: 0,
    ValueOnly: 2,
    
    Create: function (text, attributeName, element) {
      var index = -1;
      var endIndex = 0;
      var result = [];
      var character;
      var startIndex;
      var match;

      while (text.length > ++index) {
        character = text.charAt(index);

        if (character == '{' && text.charAt(index + 1) == '{') {
          startIndex = index + 2;
        } else if (character == '}' && text.charAt(index + 1) == '}') {
          if (startIndex) {
            match = text.substring(startIndex, index);
            if (!attributeName) {
              match = match
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, '\'')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>');
            }

            character = text.substring(endIndex, startIndex - 2);
            if (character) {
              result.push(character);
            }

            result.push({
              expression: match,
              attributeName: attributeName
            });

            endIndex = index + 2;
          }
          startIndex = 0;
        }
      }

      character = text.substring(endIndex);
      if (character) {
        result.push(character);
      }

      result.text = text;
      result.attributeName = attributeName;
      result.element = element;
      result.isExpression = true;
      return match ? result : null;
    },

    GetValue: function (context, elementData, expression, type) {
      var value = '';
      var length = expression.length;
      var index = -1;
      var chunk;

      if (!context) {
        return expression.text;
      }
      
      if (length == 1) {
        value = Expression.Execute(context, elementData, expression[0], expression, type);
      } else {
        while (++index < length) {
          chunk = expression[index];
          if (typeof chunk == 'string') {
            value += chunk;
          } else {
            value += Expression.Execute(context, elementData, chunk, expression, type);
          }
        }  
      }

      expression.lastResult = value;

      return value;
    },

    Execute: function (context, elementData, expressionData, entireExpression, type) {
      var expression = expressionData.expression;
      var attributeName = expressionData.attributeName;
      var isObservable;
      var expressionObj;
      var observables;
      var result;
      var value;
      var func;

      // jshint -W054
      // Disable JSHint error: The Function constructor is a form of eval
      func = parameterQueryCache[expression] = parameterQueryCache[expression] ||
        new Function('c', 'with(c){with($this){ return ' + expression + '}}');

      Observer.startObserving();

      /* @if DEBUG */ {
        try {
          value = func(context);
        } catch (ex) {
          blocks.debug.expressionFail(expression, entireExpression.element);
        }
      } /* @endif */

      value = func(context);

      isObservable = blocks.isObservable(value);
      result = isObservable ? value() : value;
      result = result == null ? '' : result.toString();
      result = escapeValue(result);

      observables = Observer.stopObserving();

      if (type != Expression.ValueOnly && (isObservable || observables.length)) {
        if (!attributeName) {
          elementData = ElementsData.createIfNotExists();
        }
        if (elementData) {
          elementData.haveData = true;

          expressionObj = {
            length: result.length,
            attr: attributeName,
            context: context,
            elementId: elementData.id,
            expression: expression,
            entire: entireExpression
          };

          blocks.each(observables, function (observable) {
            if (!observable._expressionKeys[elementData.id]) {
              observable._expressionKeys[elementData.id] = true;
              observable._expressions.push(expressionObj);
            }
          });
        }
        if (!attributeName) {
          result = '<!-- ' + elementData.id + ':blocks -->' + result;
        }
      }
      
      return result;
    }
  };


  function VirtualElement(tagName) {
    if (!VirtualElement.prototype.isPrototypeOf(this)) {
      return new VirtualElement(tagName);
    }

    this.__identity__ = virtualElementIdentity;
    this._tagName = tagName ? tagName.toString().toLowerCase() : null;
    this._attributes = {};
    this._attributeExpressions = [];
    this._parent = null;
    this._children = [];
    this._isSelfClosing = false;
    this._haveAttributes = true;
    this._innerHTML = null;
    this._renderMode = VirtualElement.RenderMode.All;
    this._haveStyle = false;
    this._style = {};
    this._states = null;
    this._state = null;

    if (blocks.isElement(tagName)) {
      this._el = tagName;
    }
  }

  blocks.VirtualElement = blocks.inherit(VirtualElement, {
    tagName: function (tagName) {
      if (tagName) {
        this._tagName = tagName;
        return this;
      }
      return this._tagName;
    },

    /**
     * Gets or sets the inner HTML of the element.
     *
     * @param {String} [html] - The new html that will be set. Provide the parameter only if you want to set new html.
     * @returns {String|VirtualElement} - returns itself if it is used as a setter(no parameters specified)
     * and returns the inner HTML of the element if it used as a getter .
     */
    html: function (html) {
      if (arguments.length > 0) {
        html = html == null ? '' : html;
        if (this._state) {
          if (this._state.html !== html) {
            this._state.html = html;
            dom.html(this._el, html);
          }
        } else {
          this._innerHTML = html;
          dom.html(this._el, html);
        }
        this._children = [];
        return this;
      }
      return this._innerHTML || '';
    },

    /**
     * Gets or sets the inner text of the element.
     *
     * @param {String} [html] - The new text that will be set. Provide the parameter only if you want to set new text.
     * @returns {String|VirtualElement} - returns itself if it is used as a setter(no parameters specified)
     * and returns the inner text of the element if it used as a getter.
     */
    text: function (text) {
      if (arguments.length > 0) {
        if (text != null) {
          text = escapeValue(text);
          this.html(text);
        }
        return this;
      }
      return this.html();
    },

    /**
     * Gets the parent VirtualElement
     *
     * @returns {VirtualElement} - The parent VirtualElement
     */
    parent: function () {
      return this._parent;
    },

    children: function (value) {
      if (typeof value === 'number') {
        return this._children[value];
      }
      return this._children;
    },

    /**
     * Gets or sets an attribute value
     *
     * @param {String} attributeName - The attribute name to be set or retrieved.
     * @param {String} [attributeValue] - The value to be set to the attribute.
     * @returns {VirtualElement|String} - Returns the VirtualElement itself if you set an attribute.
     * Returns the attribute name value if only the first parameter is specified.
     */
    attr: function (attributeName, attributeValue) {
      var _this = this;
      var returnValue;

      if (typeof attributeName == 'string') {
        var tagName = this._tagName;
        var type = this._attributes.type;
        var rawAttributeValue = attributeValue;
        var elementData = ElementsData.data(this);
        var value = this._getAttr('value');

        attributeName = blocks.unwrapObservable(attributeName);
        attributeName = dom.attrFix[attributeName] || attributeName;
        attributeValue = blocks.unwrapObservable(attributeValue);

        if (blocks.isObservable(rawAttributeValue) && attributeName == 'value' && dom.valueTagNames[tagName] && (!type || dom.valueTypes[type])) {
          elementData.subscribe = tagName == 'select' ? 'change' : 'input';
          elementData.valueObservable = rawAttributeValue;
        } else if (blocks.isObservable(rawAttributeValue) &&
          attributeName == 'checked' && (type == 'checkbox' || type == 'radio')) {

          elementData.subscribe = 'click';
          elementData.valueObservable = rawAttributeValue;
        }

        if (arguments.length == 1) {
          returnValue = this._getAttr(attributeName);
          return returnValue === undefined ? null : returnValue;
        }

        if (attributeName == 'checked' && attributeValue != null && !this._fake) {
          if (this._attributes.type == 'radio' &&
            typeof attributeValue == 'string' &&
            value != attributeValue && value != null) {

            attributeValue = null;
          } else {
            attributeValue = attributeValue ? 'checked' : null;
          }
        } else if (attributeName == 'disabled') {
          attributeValue = attributeValue ? 'disabled' : null;
        }

        if (tagName == 'textarea' && attributeName == 'value' && !this._el) {
          this.html(attributeValue);
        } else if (attributeName == 'value' && tagName == 'select') {
          this._values = keys(blocks.toArray(attributeValue));
          dom.attr(this._el, attributeName, attributeValue);
        } else {
          this._haveAttributes = true;
          if (this._state) {
            if (this._state.attributes[attributeName] !== attributeValue) {
              this._state.attributes[attributeName] = attributeValue;
              dom.attr(this._el, attributeName, attributeValue);
            }
          } else {
            this._attributes[attributeName] = attributeValue;
            dom.attr(this._el, attributeName, attributeValue);
          }
        }
      } else if (blocks.isPlainObject(attributeName)) {
        blocks.each(attributeName, function (val, key) {
          _this.attr(key, val);
        });
      }

      return this;
    },

    /**
     * Removes a particular attribute from the VirtualElement
     *
     * @param {String} attributeName - The attributeName which will be removed
     * @returns {VirtualElement} - The VirtualElement itself
     */
    removeAttr: function (attributeName) {
      this._attributes[attributeName] = null;
      dom.removeAttr(this._el, attributeName);
      return this;
    },

    /**
     * Gets or sets a CSS property
     *
     * @param {String} name - The CSS property name to be set or retrieved
     * @param {String} [value] - The value to be set to the CSS property
     * @returns {VirtualElement|String} - Returns the VirtualElement itself if you use the method as a setter.
     * Returns the CSS property value if only the first parameter is specified.
     */
    css: function (propertyName, value) {
      var _this = this;

      if (typeof propertyName == 'string') {
        propertyName = blocks.unwrap(propertyName);
        value = blocks.unwrap(value);

        if (!propertyName) {
          return;
        }

        propertyName = propertyName.toString().replace(/-\w/g, function (match) {
          return match.charAt(1).toUpperCase();
        });

        if (arguments.length === 1) {
          value = this._getCss(propertyName);
          return value === undefined ? null : value;
        }

        if (propertyName == 'display') {
          value = value == 'none' || (!value && value !== '') ? 'none' : '';
        }

        this._haveStyle = true;
        if (!VirtualElement.CssNumbers[propertyName]) {
          value = blocks.toUnit(value);
        }
        if (this._state) {
          if (this._state.style[propertyName] !== value) {
            this._state.style[propertyName] = value;
            dom.css(this._el, propertyName, value);
          }
        } else {
          this._style[propertyName] = value;
          dom.css(this._el, propertyName, value);
        }
      } else if (blocks.isPlainObject(propertyName)) {
        blocks.each(propertyName, function (val, key) {
          _this.css(key, val);
        });
      }

      return this;
    },

    addChild: function (element, index) {
      var children = this._template || this._children;
      var fragment;

      if (element) {
        element._parent = this;
        if (this._childrenEach || this._each) {
          element._each = true;
        } else if (this._el) {
          fragment = createFragment(element.render(blocks.domQuery(this)));
          element._el = fragment.childNodes[0];
          if (typeof index === 'number') {
            this._el.insertBefore(fragment, this._el.childNodes[index]);
          } else {
            this._el.appendChild(fragment);
          }
        }
        if (typeof index === 'number') {
          children.splice(index, 0, element);
        } else {
          children.push(element);
        }
      }
      return this;
    },

    /**
     * Adds a class to the element
     * @param {string|Array} classNames - A single className,
     * multiples separated by space or array of class names.
     * @returns {VirtualElement} - Returns the VirtualElement itself to allow chaining.
     */
    addClass: function (classNames) {
      setClass('add', this, classNames);
      dom.addClass(this._el, classNames);
      return this;
    },

    /**
     * Removes a class from the element
     * @param {string|Array} classNames - A single className,
     * multiples separated by space or array of class names.
     * @returns {VirtualElement} - Returns the VirtualElement itself to allow chaining.
     */
    removeClass: function (classNames) {
      setClass('remove', this, classNames);
      dom.removeClass(this._el, classNames);
      return this;
    },

    toggleClass: function (className, condition) {
      if (condition === false) {
        this.removeClass(className);
      } else {
        this.addClass(className);
      }
    },

    /** Checks whether the element has the specified class name
     * @param {string} className - The class name to check for
     * @returns {boolean} - Returns a boolean determining if element has
     * the specified class name
     */
    hasClass: function (className) {
      return getClassIndex(this._attributes[classAttr], className) != -1;
    },

    renderBeginTag: function () {
      var html;

      html = '<' + this._tagName;
      if (this._haveAttributes) {
        html += this._renderAttributes();
      }
      if (this._haveStyle) {
        html += generateStyleAttribute(this._style, this._state);
      }
      html += this._isSelfClosing ? ' />' : '>';

      return html;
    },

    renderEndTag: function () {
      if (this._isSelfClosing) {
        return '';
      }
      return '</' + this._tagName + '>';
    },

    render: function (domQuery, syncIndex) {
      var html = '';
      var childHtml = '';
      var htmlElement = this._el;

      if (syncIndex !== undefined) {
        this._state = {
          attributes: {},
          style: {},
          html: null,
          expressions: {}
        };
        if (!this._states) {
          this._states = {};
        }
        this._states[syncIndex] = this._state;
      }

      this._el = undefined;

      this._execute(domQuery);

      this._el = htmlElement;

      if (this._renderMode != VirtualElement.RenderMode.None) {
        if (this._renderMode != VirtualElement.RenderMode.ElementOnly) {
          if (this._state && this._state.html !== null) {
            childHtml = this._state.html;
          } else if (this._innerHTML != null) {
            childHtml = this._innerHTML;
          } else {
            childHtml = this.renderChildren(domQuery, syncIndex);
          }
        }

        html += this.renderBeginTag();

        html += childHtml;

        html += this.renderEndTag();
      }

      this._state = null;

      return html;
    },

    renderChildren: function (domQuery, syncIndex) {
      var html = '';
      var children = this._template || this._children;
      var length = children.length;
      var index = -1;
      var child;
      var value;

      while (++index < length) {
        child = children[index];
        if (typeof child == 'string') {
          html += child;
        } else if (VirtualElement.Is(child)) {
          child._each = child._each || this._each;
          html += child.render(domQuery, syncIndex);
        } else if (domQuery) {
          value = Expression.GetValue(domQuery._context, null, child);
          if (this._state) {
            this._state.expressions[index] = value;
          }
          html += value;
        } else {
          if (!this._each && child.lastResult) {
            html += child.lastResult;
          } else {
            html += Expression.GetValue(null, null, child);
          }
        }
      }

      return html;
    },

    sync: function (domQuery, syncIndex, element) {
      if (syncIndex) {
        this._state = this._states[syncIndex];
        this._el = element;
        this._each = false;
        this._sync = true;
      }

      this._execute(domQuery);

      this.renderBeginTag();

      if (!this._innerHTML && !this._childrenEach && this._renderMode != VirtualElement.RenderMode.None) {
        this.syncChildren(domQuery, syncIndex);
      }

      this.renderEndTag();

      if (syncIndex) {
        this._state = null;
        this._el = undefined;
        this._each = true;
        this._sync = false;
      }
    },

    syncChildren: function (domQuery, syncIndex, offset) {
      var children = this._template || this._children;
      var length = children.length;
      var state = this._state;
      var element = this._el.nodeType == 8 ? this._el.nextSibling : this._el.childNodes[offset || 0];
      var index = -1;
      var elementForDeletion;
      var expression;
      var child;

      while (++index < length) {
        child = children[index];
        if (child.isExpression) {
          if (domQuery) {
            expression = Expression.GetValue(domQuery._context, null, child, state ? Expression.ValueOnly : Expression.Html);

            if (!state || (state && state.expressions[index] !== expression)) {
              if (state) {
                state.expressions[index] = expression;
                if (element) {
                  if (element.nodeType == 8) {
                    element = element.nextSibling;
                  }
                  element.nodeValue = expression;
                  element = element.nextSibling;
                } else {
                  this._el.textContent = expression;
                }
              } else {
                this._el.insertBefore(createFragment(expression), element);
                elementForDeletion = element;
                element = element.nextSibling;
                this._el.removeChild(elementForDeletion);
              }
            }
          }
        } else if (typeof child != 'string' && child._renderMode != VirtualElement.RenderMode.None) {
          child._each = child._each || this._each;

          child.sync(domQuery, syncIndex, element);

          element = element.nextSibling;
        } else {
          element = element.nextSibling;
        }
      }
    },

    updateChildren: function (collection, updateCount, domQuery, domElement) {
      var template = this._template;
      var child = template[0];
      var isOneChild = template.length === 1 && VirtualElement.Is(child);
      var childNodes = domElement.childNodes;
      var syncIndex = domQuery.getSyncIndex();
      var childContexts = domQuery._context.childs;
      var chunkLength = this._length();
      var offset = this._headers ? this._headers.length : 0;
      var index = -1;
      var context;

      while (++index < updateCount) {
        domQuery._context = context = childContexts[index];
        context.$this = collection[index];
        context.$parent = context.$parentContext.$this;
        if (isOneChild) {
          child.sync(domQuery, syncIndex + index, childNodes[index + offset]);
        } else {
          this.syncChildren(domQuery, syncIndex + index, (index * chunkLength) + offset);
        }
      }

      domQuery.popContext();
    },

    _length: function () {
      var template = this._template;
      var index = -1;
      var length = 0;

      while (++index < template.length) {
        if (template[index]._renderMode !== VirtualElement.RenderMode.None) {
          length += 1;
        }
      }

      return length;
    },

    _getAttr: function (name) {
      var state = this._state;
      return state && state.attributes[name] !== undefined ? state.attributes[name] : this._attributes[name];
    },

    _getCss: function (name) {
      var state = this._state;
      return state && state.style[name] !== undefined ? state.style[name] : this._style[name];
    },

    _execute: function (domQuery) {
      if (!domQuery) {
        return;
      }

      if (this._each) {
        this._el = undefined;
      }

      if (this._renderMode != VirtualElement.RenderMode.None) {
        var id = this._attributes[dataIdAttr];
        var data;

        if (!id || domQuery._serverData) {
          ElementsData.createIfNotExists(this);
          domQuery.applyContextToElement(this);
          id = this._attributes[dataIdAttr];
          data = ElementsData.byId(id);
        }

        if (this._attributeExpressions.length) {
          this._executeAttributeExpressions(domQuery._context);
        }

        domQuery.executeQuery(this, this._attributes[dataQueryAttr]);

        if (data && !data.haveData) {
          ElementsData.clear(this);
        }
      }
    },

    _renderAttributes: function () {
      var attributes = this._attributes;
      var state = this._state;
      var html = '';
      var key;
      var value;

      if (this._tagName == 'option' && this._parent._values) {
        if (state) {
          state.attributes.selected = this._parent._values[state.attributes.value] ? 'selected' : null;
        } else {
          attributes.selected = this._parent._values[attributes.value] ? 'selected' : null;
        }
      }

      for (key in attributes) {
        value = attributes[key];
        if (state && hasOwn.call(state.attributes, key)) {
          continue;
        }
        if (value === '') {
          html += ' ' + key;
        } else if (value != null) {
          html += ' ' + key + '="' + value + '"';
        }
      }

      if (state) {
        for (key in state.attributes) {
          value = state.attributes[key];
          if (value === '') {
            html += ' ' + key;
          } else if (value != null) {
            html += ' ' + key + '="' + value + '"';
          }
        }
      }

      return html;
    },

    _createAttributeExpressions: function (serverData) {
      var attributeExpressions = this._attributeExpressions;
      var dataId = this._attributes[dataIdAttr];
      var each = this._each;
      var expression;

      blocks.each(this._attributes, function (attributeValue, attributeName) {
        if (!each && serverData && serverData[dataId + attributeName]) {
          expression = Expression.Create(serverData[dataId + attributeName], attributeName);
        } else {
          expression = Expression.Create(attributeValue, attributeName);
        }
        if (expression) {
          attributeExpressions.push(expression);
        }
      });
    },

    _executeAttributeExpressions: function (context) {
      var isVirtual = this._el ? false : true;
      var attributes = this._state && this._state.attributes;
      var elementData = ElementsData.byId(attributes ? attributes[dataIdAttr] : this._attributes[dataIdAttr]);
      var expressions = this._attributeExpressions;
      var attributeName;
      var expression;
      var value;

      for (var i = 0; i < expressions.length; i++) {
        expression = expressions[i];
        value = Expression.GetValue(context, elementData, expression);
        attributeName = expression.attributeName;
        if ((attributes && attributes[attributeName] !== value) || !attributes) {
          if (isVirtual) {
            if (this._state) {
              this._state.attributes[attributeName] = value;
            } else {
              this._attributes[attributeName] = value;
            }
          } else {
            dom.attr(this._el, attributeName, value);
          }
        }
      }
    }
  });

  VirtualElement.Is = function (value) {
    return value && value.__identity__ == virtualElementIdentity;
  };

  VirtualElement.RenderMode = {
    All: 0,
    ElementOnly: 2,
    None: 4
  };

  VirtualElement.CssNumbers = {
    columnCount: true,
    fillOpacity: true,
    flexGrow: true,
    flexShrink: true,
    fontWeight: true,
    lineHeight: true,
    opacity: true,
    order: true,
    orphans: true,
    widows: true,
    zIndex: true,
    zoom: true
  };

  function generateStyleAttribute(style, state) {
    var html = ' style="';
    var haveStyle = false;
    var key;
    var value;

    for (key in style) {
      value = style[key];
      if (state && hasOwn.call(state.style, key)) {
        continue;
      }
      if (value || value === 0) {
        haveStyle = true;
        key = key.replace(/[A-Z]/g, replaceStyleAttribute);
        html += key;
        html += ':';
        html += value;
        html += ';';
      }
    }

    if (state) {
      for (key in state.style) {
        value = state.style[key];
        if (value || value === 0) {
          haveStyle = true;
          key = key.replace(/[A-Z]/g, replaceStyleAttribute);
          html += key;
          html += ':';
          html += value;
          html += ';';
        }
      }
    }

    html += '"';
    return haveStyle ? html : '';
  }

  function replaceStyleAttribute(match) {
    return '-' + match.toLowerCase();
  }


  var classListMultiArguments = true;
  if (typeof document !== 'undefined') {
    var element = document.createElement('div');
    if (element.classList) {
      element.classList.add('a', 'b');
      classListMultiArguments = element.className == 'a b';
    }
  }

  function setClass(type, element, classNames) {
    if (classNames != null) {
      classNames = blocks.isArray(classNames) ? classNames : classNames.toString().split(' ');
      var i = 0;
      var classAttribute;
      var className;
      var index;

      if (VirtualElement.Is(element)) {
        classAttribute = element._getAttr(classAttr);
      } else if (element.classList) {
        if (classListMultiArguments) {
          element.classList[type].apply(element.classList, classNames);
        } else {
          blocks.each(classNames, function (value) {
            element.classList[type](value);
          });
        }
        return;
      } else {
        classAttribute = element.className;
      }
      classAttribute = classAttribute || '';

      for (; i < classNames.length; i++) {
        className = classNames[i];
        index = getClassIndex(classAttribute, className);
        if (type == 'add') {
          if (index < 0) {
            if (classAttribute !== '') {
              className = ' ' + className;
            }
            classAttribute += className;
          }
        } else if (index != -1) {
          classAttribute = (classAttribute.substring(0, index) + ' ' +
          classAttribute.substring(index + className.length + 1, classAttribute.length)).replace(trimRegExp, '');
        }
      }

      if (VirtualElement.Is(element)) {
        if (element._state) {
          element._state.attributes[classAttr] = classAttribute;
        } else {
         element._attributes[classAttr] = classAttribute; 
        }
      } else {
        element.className = classAttribute;
      }
    }
  }

  var animation = {
    insert: function (parentElement, index, chunk) {
      index = getIndexOffset(parentElement, index);
      var insertPositionNode = parentElement.childNodes[index];
      var childNodesCount;
      var firstChild;

      blocks.each(chunk, function (node) {
        childNodesCount = node.nodeType == 11 ? node.childNodes.length : 0;
        firstChild = node.childNodes ? node.childNodes[0] : undefined;

        if (insertPositionNode) {
          //checkItemExistance(insertPositionNode);
          parentElement.insertBefore(node, insertPositionNode);
        } else {
          //checkItemExistance(parentElement.childNodes[parentElement.childNodes.length - 1]);
          parentElement.appendChild(node);
        }

        if (childNodesCount) {
          while (childNodesCount) {
            animateDomAction('add', firstChild);
            firstChild = firstChild.nextSibling;
            childNodesCount--;
          }
        } else {
          animateDomAction('add', node);
        }
      });
    },

    remove: function (parentElement, index, count) {
      var i = 0;
      var node;

      index = getIndexOffset(parentElement, index);

      for (; i < count; i++) {
        node = parentElement.childNodes[index];
        if (node) {
          if (animateDomAction('remove', node)) {
            index++;
          }
        }
      }
    },

    setVisibility: function (element, visible) {
      if (visible) {
        animation.show(element);
      } else {
        animation.hide(element);
      }
    },

    show: function (element) {
      animateDomAction('show', element);
    },

    hide: function (element) {
      animateDomAction('hide', element);
    }
  };

  function getIndexOffset(parentElement, index) {
    var elementData = ElementsData.data(parentElement);
    if (elementData && elementData.animating > 0) {
      var childNodes = parentElement.childNodes;
      var childIndex = 0;
      var currentIndex = 0;
      var className;

      while (index != currentIndex) {
        if (!childNodes[childIndex]) {
          return Number.POSITIVE_INFINITY;
        }
        className = childNodes[childIndex].className;
        childIndex++;

        if (getClassIndex(className, 'b-hide') == -1) {
          currentIndex++;
        }
      }

      if (!childNodes[childIndex]) {
        return Number.POSITIVE_INFINITY;
      }

      className = childNodes[childIndex].className;

      while (getClassIndex(className, 'b-hide') != -1) {
        childIndex++;
        if (!childNodes[childIndex]) {
          return Number.POSITIVE_INFINITY;
        }
        className = childNodes[childIndex].className;
      }

      return childIndex;
    }

    return index;
  }

  function animateDomAction(type, element) {
    var animating = false;
    var elementData = ElementsData.createIfNotExists(element);
    var parentElementData = ElementsData.createIfNotExists(element.parentNode);
    var animateCallback = elementData.animateCallback;
    var cssType = type == 'remove' ? 'hide' : type == 'add' ? 'show' : type;
    var disposeCallback = type == 'remove' ? function disposeElement() {
      ElementsData.clear(element, true);
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    } : type == 'hide' ? function hideElement() {
      element.style.display = 'none';
    } : blocks.noop;
    var readyCallback = function () {
      elementData.animating -= 1;
      parentElementData.animating -= 1;
      if (!elementData.animating) {
        disposeCallback();
      }
    };

    if (element.nodeType != 1) {
      disposeCallback();
      return;
    }
    
    if (type == 'show') {
      element.style.display = '';
    }

    if (elementData.preprocess) {
      disposeCallback();
      return;
    }

    if (animateCallback) {
      animating = true;
      elementData.animating += 1;
      parentElementData.animating += 1;
      var context = blocks.context(element);
      var thisArg = context.$view || context.$root;
      animateCallback.call(thisArg, element, readyCallback, cssType);
    }
    return animating || cssAnimate(cssType, element, disposeCallback, readyCallback);
  }

  function cssAnimate(type, element, disposeCallback, readyCallback) {
    if (typeof window == 'undefined' || window.ontransitionend === undefined) {
      disposeCallback();
      return;
    }
    setClass('add', element, 'b-' + type);

    var computedStyle = window.getComputedStyle(element);
    var prefix = '';
    var eventName;
    if (window.onanimationend === undefined && window.onwebkitanimationend !== undefined) {
      prefix = '-webkit-';
      eventName = 'webkitAnimationEnd';
    } else {
      eventName = 'animationend';
    }

    var transitionDuration = parseFloat(computedStyle['transition-duration']) || 0;
    var transitionDelay = parseFloat(computedStyle['transition-delay']) || 0;
    var animationDuration = parseFloat(computedStyle[prefix + 'animation-duration']) || 0;
    var animationDelay = parseFloat(computedStyle[prefix + 'animation-delay']) || 0;

    if (transitionDuration <= 0 && transitionDelay <= 0 &&
      animationDuration <= 0 && animationDelay <= 0) {

      setClass('remove', element, 'b-' + type);
      disposeCallback();
      return;
    }

    ElementsData.createIfNotExists(element).animating += 1;
    ElementsData.createIfNotExists(element.parentNode).animating += 1;

    setTimeout(function () {
      setClass('add', element, 'b-' + type + '-end');
      element.addEventListener('transitionend', end, false);
      element.addEventListener(eventName, end, false);
    }, 1);

    function end() {
      setClass('remove', element, 'b-' + type);
      setClass('remove', element, 'b-' + type + '-end');
      readyCallback();
      element.removeEventListener('transitionend', end, false);
      element.removeEventListener(eventName, end, false);
    }

    return true;
  }

  function VirtualComment(commentText) {
    if (!VirtualComment.prototype.isPrototypeOf(this)) {
      return new VirtualComment(commentText);
    }

    this.__Class__();

    if (commentText.nodeType == 8) {
      this._commentText = commentText.nodeValue;
      this._el = commentText;
    } else {
      this._commentText = commentText;
    }
  }

  blocks.VirtualComment = blocks.inherit(VirtualElement, VirtualComment, {
    renderBeginTag: function () {
      var dataId = this._getAttr(dataIdAttr);
      var html = '<!-- ';

      if (dataId) {
        html += dataId + ':';
      }
      html += this._commentText.replace(trimRegExp, '') + ' -->';

      return html;
    },

    renderEndTag: function () {
      var dataId = this._getAttr(dataIdAttr);
      var html = '<!-- ';

      if (dataId) {
        html += dataId + ':';
      }
      html += '/blocks -->';
      return html;
    },

    _executeAttributeExpressions: blocks.noop
  });

  VirtualComment.Is = function (value) {
    return VirtualComment.prototype.isPrototypeOf(value);
  };

  function createVirtual(htmlElement, parentElement) {
    var serverData = window.__blocksServerData__;
    var elements = [];
    var element;
    var tagName;
    var elementAttributes;
    var htmlAttributes;
    var htmlAttribute;
    var nodeType;
    var commentText;
    var commentTextTrimmed;
    var data;

    while (htmlElement) {
      nodeType = htmlElement.nodeType;
      if (nodeType == 1) {
        // HtmlDomElement
        tagName = htmlElement.tagName.toLowerCase();
        element = new VirtualElement(htmlElement);
        element._tagName = tagName;
        element._parent = parentElement;
        if (parentElement) {
          element._each = parentElement._each || parentElement._childrenEach;
        }
        element._haveAttributes = false;
        htmlAttributes = htmlElement.attributes;
        elementAttributes = {};
        for (var i = 0; i < htmlAttributes.length; i++) {
          htmlAttribute = htmlAttributes[i];
          // the style should not be part of the attributes. The style is handled individually.
          if (htmlAttribute.nodeName !== 'style' &&
            (htmlAttribute.specified ||
              //IE7 wil return false for .specified for the "value" attribute - WTF!
            (browser.IE < 8 && htmlAttribute.nodeName == 'value' && htmlAttribute.nodeValue))) {
            elementAttributes[htmlAttribute.nodeName.toLowerCase()] = browser.IE < 11 ? htmlAttribute.nodeValue : htmlAttribute.value;
            element._haveAttributes = true;
          }
        }
        element._attributes = elementAttributes;
        element._createAttributeExpressions(serverData);

        if (htmlElement.style.cssText) {
          element._haveStyle = true;
          element._style = generateStyleObject(htmlElement.style.cssText);
        }

        setIsSelfClosing(element);
        if (tagName == 'script' || tagName == 'style' || tagName == 'code' || element.hasClass('bl-skip')) {
          element._innerHTML = htmlElement.innerHTML;
        } else {
          element._children = createVirtual(htmlElement.childNodes[0], element);
        }

        elements.push(element);
      } else if (nodeType == 3) {
        // TextNode
        //if (htmlElement.data.replace(trimRegExp, '').replace(/(\r\n|\n|\r)/gm, '') !== '') {
        //
        //}
        data = escapeValue(htmlElement.data);
        elements.push(Expression.Create(data, null, htmlElement) || data);
      } else if (nodeType == 8) {
        // Comment
        commentText = htmlElement.nodeValue;
        commentTextTrimmed = commentText.replace(trimRegExp, '');
        if (commentTextTrimmed.indexOf('blocks') === 0) {
          element = new VirtualComment(htmlElement);
          element._parent = parentElement;
          element._attributes[dataQueryAttr] = commentTextTrimmed.substring(6);
          data = createVirtual(htmlElement.nextSibling, element);
          element._children = data.elements;
          element._el._endElement = data.htmlElement;
          htmlElement = data.htmlElement || htmlElement;
          elements.push(element);
        } else if (VirtualComment.Is(parentElement) && commentTextTrimmed.indexOf('/blocks') === 0) {
          return {
            elements: elements,
            htmlElement: htmlElement
          };
        } else if (VirtualComment.Is(parentElement)) {
          elements.push('<!--' + commentText + '-->');
        } else if (serverData) {
          var number = parseInt(/[0-9]+/.exec(commentTextTrimmed), 10);
          if (!blocks.isNaN(number) && serverData[number]) {
            elements.push(Expression.Create(serverData[number]));
          }
        } else if (commentTextTrimmed.indexOf('/blocks') !== 0) {
          elements.push('<!--' + commentText + '-->');
        }
      }
      htmlElement = htmlElement.nextSibling;
    }
    return elements;
  }

  function generateStyleObject(styleString) {
    var styles = styleString.split(';');
    var styleObject = {};
    var index;
    var style;
    var values;

    for (var i = 0; i < styles.length; i++) {
      style = styles[i];
      if (style) {
        index = style.indexOf(':');
        if (index != -1) {
          values = [style.substring(0, index), style.substring(index + 1)];
          styleObject[values[0].toLowerCase().replace(trimRegExp, '')] = values[1].replace(trimRegExp, '');
        }
      }
    }

    return styleObject;
  }

  var isSelfClosingCache = {};
  function setIsSelfClosing(element) {
    var tagName = element._tagName;
    var domElement;

    if (isSelfClosingCache[tagName] !== undefined) {
      element._isSelfClosing = isSelfClosingCache[tagName];
      return;
    }
    domElement = document.createElement('div');
    domElement.appendChild(document.createElement(tagName));
    isSelfClosingCache[tagName] = element._isSelfClosing = domElement.innerHTML.indexOf('</') === -1;
  }

  function createProperty(propertyName) {
    return function (value) {
      if (arguments.length === 0) {
        return this[propertyName];
      }
      this[propertyName] = value;
      return this;
    };
  }


  function parseQuery(query, callback) {
    var character = 0;
    var bracketsCount = 0;
    var curlyBracketsCount = 0;
    var squareBracketsCount = 0;
    var isInSingleQuotes = false;
    var isInDoubleQuotes = false;
    var startIndex = 0;
    var parameters = [];
    var currentParameter;
    var methodName;

    query = query || '';

    for (var i = 0; i < query.length; i++) {
      character = query.charAt(i);

      if (!isInSingleQuotes && !isInDoubleQuotes) {
        if (character == '[') {
          squareBracketsCount++;
        } else if (character == ']') {
          squareBracketsCount--;
        } else if (character == '{') {
          curlyBracketsCount++;
        } else if (character == '}') {
          curlyBracketsCount--;
        }
      }

      if (curlyBracketsCount !== 0 || squareBracketsCount !== 0) {
        continue;
      }

      if (character == '\'') {
        isInSingleQuotes = !isInSingleQuotes;
      } else if (character == '"') {
        isInDoubleQuotes = !isInDoubleQuotes;
      }

      if (isInSingleQuotes || isInDoubleQuotes) {
        continue;
      }

      if (character == '(') {
        if (bracketsCount === 0) {
          methodName = query.substring(startIndex, i).replace(trimRegExp, '');
          startIndex = i + 1;
        }
        bracketsCount++;
      } else if (character == ')') {
        bracketsCount--;
        if (bracketsCount === 0) {
          currentParameter = query.substring(startIndex, i).replace(trimRegExp, '');
          if (currentParameter.length) {
            parameters.push(currentParameter);
          }

          if (methodName) {
            methodName = methodName.replace(/^("|')+|("|')+$/g, ''); // trim single and double quotes
            callback(methodName, parameters);
          }
          parameters = [];
          methodName = undefined;
        }
      } else if (character == ',' && bracketsCount == 1) {
        currentParameter = query.substring(startIndex, i).replace(trimRegExp, '');
        if (currentParameter.length) {
          parameters.push(currentParameter);
        }
        startIndex = i + 1;
      } else if (character == '.' && bracketsCount === 0) {
        startIndex = i + 1;
      }
    }
  }

  function DomQuery(options) {
    this._options = options || {};
    this._contextProperties = {};
  }

  DomQuery.QueryCache = {};

  DomQuery.prototype = {
    options: function () {
      return this._options;
    },

    dataIndex: createProperty('_dataIndex'),

    context: createProperty('_context'),

    popContext: function () {
      if (this._context) {
        this._context = this._context.$parentContext;
      }
    },

    applyContextToElement: function (element) {
      var data = ElementsData.createIfNotExists(element);
      data.domQuery = this;
      data.context = this._context;

      if (this._hasChanged || (element._each && !element._parent._each)) {
        if (element._parent && !element._each) {
          data = ElementsData.createIfNotExists(element._parent);
          data.childrenContext = this._context;
        }

        this._hasChanged = false;
        data.haveData = true;
      }
    },

    pushContext: function (newModel) {
      var context = this._context;
      var models = context ? context.$parents.slice(0) : [];
      var newContext;

      this._hasChanged = true;

      if (context) {
        models.unshift(context.$this);
      }

      newContext = {
        $this: newModel,
        $root: context ? context.$root : newModel,
        $parent: context ? context.$this : null,
        $parents: context ? models : [],
        $index: this._dataIndex || null,
        $parentContext: context || null
      };
      newContext.$context = newContext;
      this._context = newContext;
      this.applyDefinedContextProperties();

      return newContext;
    },
    
    getSyncIndex: function () {
      var context = this._context;
      var index = '';
      
      while (context && context.$index) {
        index = context.$index.__value__ + '_' + index;
        context = context.$parentContext;
      }
      
      return index;
    },

    contextBubble: function (context, callback) {
      var currentContext = this._context;
      this._context = context;
      callback();
      this._context = currentContext;
    },

    addProperty: function (name, value) {
      this._contextProperties[name] = value;
      this.applyDefinedContextProperties();
    },

    removeProperty: function (name) {
      delete this._contextProperties[name];
    },

    applyDefinedContextProperties: function () {
      var context = this._context;
      var contextProperties = this._contextProperties;
      var key;

      for (key in contextProperties) {
        context[key] = contextProperties[key];
      }
    },

    executeElementQuery: function (element) {
      var query = VirtualElement.Is(element) ? element._attributes[dataQueryAttr] :
          element.nodeType == 1 ? element.getAttribute(dataQueryAttr) : element.nodeValue.substring(element.nodeValue.indexOf('blocks') + 6).replace(trimRegExp, '');

      if (query) {
        this.executeQuery(element, query);
      }
    },

    executeQuery: function (element, query) {
      var cache = DomQuery.QueryCache[query] || createCache(query, element);
      
      this.executeMethods(element, cache);
    },

    executeMethods: function (element, methods) {
      var elementData = ElementsData.data(element);
      var lastObservablesLength = 0;
      var i = 0;
      var method;
      var executedParameters;
      var currentParameter;
      var parameters;
      var parameter;
      var context;
      var func;

      for (; i < methods.length; i++) {
        context = this._context;
        method = blocks.queries[methods[i].name];
        parameters = methods[i].params;
        executedParameters = method.passDomQuery ? [this] : [];
        if (VirtualElement.Is(element) && !method.call && !method.preprocess && (method.update || method.ready)) {
          elementData.haveData = true;
          if (!elementData.execute) {
            elementData.execute = [];
            elementData.executeHash = {};
          }
          if (!elementData.executeHash[methods[i].query]) {
             elementData.execute.push(methods[i]);
             elementData.executeHash[methods[i].query] = true;
          }
          continue;
        }
        Observer.startObserving();
        for (var j = 0; j < parameters.length; j++) {
          parameter = parameters[j];
          // jshint -W054
          // Disable JSHint error: The Function constructor is a form of eval
          func = parameterQueryCache[parameter] = parameterQueryCache[parameter] ||
              new Function('c', 'with(c){with($this){ return ' + parameter + '}}');

          currentParameter = {};

          /* @if DEBUG */ {
            try {
              currentParameter.rawValue = func(context);
            } catch (e) {
              blocks.debug.queryParameterFail(methods[i], parameter, element);
            }
          } /* @endif */
          currentParameter.rawValue = func(context);

          currentParameter.value = blocks.unwrapObservable(currentParameter.rawValue);

          if (method.passDetailValues) {
            currentParameter.isObservable = blocks.isObservable(currentParameter.rawValue);
            currentParameter.containsObservable = Observer.currentObservables().length > lastObservablesLength;
            lastObservablesLength = Observer.currentObservables().length;
            executedParameters.push(currentParameter);
          } else if (method.passRawValues) {
            executedParameters.push(currentParameter.rawValue);
          } else {
            executedParameters.push(currentParameter.value);
          }

          // Handling 'if' queries
          // Example: data-query='if(options.templates && options.templates.item, options.templates.item)'
          if (method === blocks.queries['if'] || method === blocks.queries.ifnot) {
            if ((!currentParameter.value && method === blocks.queries['if']) ||
                (currentParameter.value && method === blocks.queries.ifnot)) {
              if (!parameters[2]) {
                break;
              }
              this.executeQuery(element, parameters[2]);
              break;
            }
            this.executeQuery(element, parameters[1]);
            break;
          }
        }

        /* @if DEBUG */ {
          var params = executedParameters;
          if (method.passDomQuery) {
            params = blocks.clone(executedParameters).slice(1);
          }
          blocks.debug.checkQuery(methods[i].name, params, methods[i], element);
        }/* @endif */

        if (VirtualElement.Is(element)) {
          if (VirtualComment.Is(element) && !method.supportsComments) {
            // TODO: Should throw debug message
            continue;
          }

          if (method.call) {
            if (method.call === true) {
              element[methods[i].name].apply(element, executedParameters);
            } else {
              executedParameters.unshift(method.prefix || methods[i].name);
              element[method.call].apply(element, executedParameters);
            }
          } else if (method.preprocess) {
            if (method.preprocess.apply(element, executedParameters) === false) {
              this.subscribeObservables(methods[i], elementData, context);
              break;
            }
          }
        } else if (method.call) {
          var virtual = ElementsData.data(element).virtual;
          if (virtual._each) {
            virtual = VirtualElement('div');
            virtual._el = element;
            virtual._fake = true;
          }
          if (method.call === true) {
            virtual[methods[i].name].apply(virtual, executedParameters);
          } else {
            executedParameters.unshift(method.prefix || methods[i].name);
            virtual[method.call].apply(virtual, executedParameters);
          }
        } else if (elementData && elementData.preprocess && method.ready) {
          method.ready.apply(element, executedParameters);
        } else if (method.update) {
          method.update.apply(element, executedParameters);
        }

        this.subscribeObservables(methods[i], elementData, context);
      }
    },

    subscribeObservables: function (method, elementData, context) {
      var observables = Observer.stopObserving();

      if (elementData) {
        elementData.haveData = true;
        blocks.each(observables, function (observable) {
          if (!elementData.observables[observable.__id__ + method.query]) {
            elementData.observables[observable.__id__ + method.query] = observable;
            observable._elements.push({
              elementId: elementData.id,
              cache: [method],
              context: context
            });
          }
        });
      }
    },

    createElementObservableDependencies: function (elements) {
      var currentElement;
      var elementData;
      var tagName;

      for (var i = 0; i < elements.length; i++) {
        currentElement = elements[i];
        tagName = (currentElement.tagName || '').toLowerCase();
        if (currentElement.nodeType === 1 || currentElement.nodeType == 8) {
          elementData = ElementsData.data(currentElement);
          if (elementData) {
            this._context = elementData.context || this._context;
            elementData.dom = currentElement;
            if (elementData.execute) {
              this.executeMethods(currentElement, elementData.execute);
            }
            if (elementData.subscribe) {
              var eventName = elementData.updateOn || elementData.subscribe;
              on(currentElement, eventName, UpdateHandlers[eventName]);
            }
            elementData.preprocess = false;
            this._context = elementData.childrenContext || this._context;
          }
          if (tagName != 'script' && tagName != 'code' &&
            (' ' + currentElement.className + ' ').indexOf('bl-skip') == -1) {

            this.createElementObservableDependencies(currentElement.childNodes);
          }
        }
      }
      
      this._context = null;
    },

    createFragment: function (html) {
      var fragment = createFragment(html);
      this.createElementObservableDependencies(fragment.childNodes);

      return fragment;
    },

    cloneContext: function (context) {
      var newContext = blocks.clone(context);
      newContext.$context = newContext;
      return newContext;
    }
  };

  var UpdateHandlers = {
    change: function (e) {
      var target = e.target || e.srcElement;
      UpdateHandlers.getSetValue(target, ElementsData.data(target).valueObservable);
    },

    click: function (e) {
      UpdateHandlers.change(e);
    },

    //keyup: function (e) {

    //},

    input: function (e) {
      var target = e.target || e.srcElement;
      UpdateHandlers.getSetValue(target, ElementsData.data(target).valueObservable);
    },

    keydown: function (e) {
      var target = e.target || e.srcElement;
      var oldValue = target.value;
      var elementData = ElementsData.data(target);

      if (elementData) {
        setTimeout(function () {
          if (oldValue != target.value) {
            UpdateHandlers.getSetValue(target, ElementsData.data(target).valueObservable);
          }
        });
      }
    },

    getSetValue: function (element, value) {
      var tagName = element.tagName.toLowerCase();
      var type = element.getAttribute('type');

      if (type == 'checkbox') {
        value(element.checked);
      } else if (tagName == 'select' && element.getAttribute('multiple')) {
        var values = [];
        var selectedOptions = element.selectedOptions;
        if (selectedOptions) {
          blocks.each(selectedOptions, function (option) {
            values.push(option.getAttribute('value'));
          });
        } else {
          blocks.each(element.options, function (option) {
            if (option.selected) {
              values.push(option.getAttribute('value'));
            }
          });
        }

        value(values);
      } else {
        blocks.core.skipExecution = {
          element: element,
          attributeName: 'value'
        };
        value(element.value);
        blocks.core.skipExecution = undefined;
      }
    }
  };
  
  function createCache(query, element) {
    var cache = DomQuery.QueryCache[query] = [];

    parseQuery(query, function (methodName, parameters) {
      var method = blocks.queries[methodName];
      var methodObj = {
        name: methodName,
        params: parameters,
        query: methodName + '(' + parameters.join(',') + ')'
      };

      if (method) {
        // TODO: Think of a way to remove this approach
        if (methodName == 'attr' || methodName == 'val') {
          cache.unshift(methodObj);
        } else {
          cache.push(methodObj);
        }
      }
      /* @if DEBUG */
      else {
        blocks.debug.queryNotExists(methodObj, element);
      }
      /* @endif */
    });
    
    return cache;
  }


  /**
  * @namespace blocks.queries
  */
  blocks.extend(queries, {
    /**
     * Executes particular query depending on the condition specified
     *
     * @memberof blocks.queries
     * @param {boolean} condition - The result will determine if the consequent or the alternate query will be executed
     * @param {data-query} consequent - The query that will be executed if the specified condition returns a truthy value
     * @param {data-query} [alternate] - The query that will be executed if the specified condition returns a falsy value
     *
     * @example {html}
     * <div data-query="if(true, setClass('success'), setClass('fail'))"></div>
     * <div data-query="if(false, setClass('success'), setClass('fail'))"></div>
     *
     * <!-- will result in -->
     * <div data-query="if(true, setClass('success'), setClass('fail'))" class="success"></div>
     * <div data-query="if(false, setClass('success'), setClass('fail'))" class="fail"></div>
     */
    'if': {},

    /**
     * Executes particular query depending on the condition specified.
     * The opposite query of the 'if'
     *
     * @memberof blocks.queries
     * @param {boolean} condition - The result will determine if the consequent or the alternate query will be executed
     * @param {data-query} consequent - The query that will be executed if the specified condition returns a falsy value
     * @param {data-query} [alternate] - The query that will be executed if the specified condition returns a truthy value
     *
     * @example {html}
     * <div data-query="ifnot(true, setClass('success'), setClass('fail'))"></div>
     * <div data-query="ifnot(false, setClass('success'), setClass('fail'))"></div>
     *
     * <!-- will result in -->
     * <div data-query="ifnot(true, setClass('success'), setClass('fail'))" class="fail"></div>
     * <div data-query="ifnot(false, setClass('success'), setClass('fail'))" class="success"></div>
     */
    ifnot: {},

    /**
     * Queries and sets the inner html of the element from the template specified
     *
     * @memberof blocks.queries
     * @param {(HTMLElement|string)} template - The template that will be rendered
     * The value could be an element id (the element innerHTML property will be taken), string (the template) or
     * an element (again the element innerHTML property will be taken)
     * @param {*} [value] - Optional context for the template
     *
     * @example {html}
     * <script>
     *   blocks.query({
     *     name: 'John Doe',
     *     age: 22
     *   });
     * </script>
     * <script id="user" type="blocks-template">
     *   <h3>{{name}}</h3>
     *   <p>I am {{age}} years old.</p>
     * </script>
     * <div data-query="template('user')">
     * </div>
     *
     * <!-- will result in -->
     * <div data-query="template('user')">
     *   <h3>John Doe</h3>
     *   <p>I am 22 years old.</p>
     * </div>
     */
    template: {
      passDomQuery: true,
      passRawValues: true,

      preprocess: function (domQuery, template, value) {
        var serverData = domQuery._serverData;
        var html;

        template = blocks.$unwrap(template);
        if (blocks.isElement(template)) {
          html = template.innerHTML;
        } else {
          html = document.getElementById(template);
          if (html) {
            html = html.innerHTML;
          } else {
            html = template;
          }
        }
        if (html) {
          if (value) {
            blocks.queries['with'].preprocess.call(this, domQuery, value, '$template');
          }
          if (!serverData || !serverData.templates || !serverData.templates[ElementsData.id(this)]) {
            this.html(html);
            if (!this._each && this._el) {
              this._children = createVirtual(this._el.childNodes[0], this);
              this._innerHTML = null;
            }
          }
        }
      }
    },

    /**
     * Creates a variable name that could be used in child elements
     *
     * @memberof blocks.queries
     * @param {string} propertyName - The name of the value that will be
     * created and you could access its value later using that name
     * @param {*} propertyValue - The value that the property will have
     *
     * @example {html}
     * <script>
     *   blocks.query({
     *     strings: {
     *       title: {
     *         text: 'Hello World!'
     *       }
     *     }
     *   });
     * </script>
     * <div data-query="define('$title', strings.title.text)">
     *   The title is {{$title}}.
     * </div>
     *
     * <!-- will result in -->
     * <div data-query="define('$title', strings.title.text)">
     *   The title is Hello World!.
     * </div>
     */
    define: {
      passDomQuery: true,

      preprocess: function (domQuery, propertyName, propertyValue) {
        if (this._renderMode != VirtualElement.RenderMode.None) {
          var currentContext = domQuery.context();
          var newContext = domQuery.cloneContext(currentContext);
          var renderEndTag = this.renderEndTag;

          domQuery.context(newContext);
          domQuery.addProperty(propertyName, propertyValue);

          this.renderEndTag = function () {
            domQuery.removeProperty(propertyName);
            domQuery.context(currentContext);
            return renderEndTag.call(this);
          };
        }
      }
    },

    /**
     * Changes the current context for the child elements.
     * Useful when you will work a lot with a particular value
     *
     * @memberof blocks.queries
     * @param {*} value - The new context
     * @param {string} [name] - Optional name of the new context
     * This way the context will also available under the name not only under the $this context property
     *
     * @example {html}
     * <script>
     *   blocks.query({
     *     ProfilePage: {
     *       user: {
     *         name: 'John Doe',
     *         age: 22
     *       }
     *     }
     *   });
     * </script>
     * <div data-query="with(ProfilePage.user, '$user')">
     *  My name is {{$user.name}} and I am {{$this.age}} years old.
     * </div>
     *
     * <!-- will result in -->
     * <div data-query="with(ProfilePage.user, '$user')">
     *  My name is John Doe and I am 22 years old.
     * </div>
     */
    'with': {
      passDomQuery: true,
      passRawValues: true,

      preprocess: function (domQuery, value, name) {
        if (this._renderMode != VirtualElement.RenderMode.None) {
          var renderEndTag = this.renderEndTag;

          if (name) {
            domQuery.addProperty(name, value);
          }
          domQuery.pushContext(value);

          this.renderEndTag = function () {
            if (name) {
              domQuery.removeProperty(name);
            }
            domQuery.popContext();
            return renderEndTag.call(this);
          };
        }
      }
    },

    /**
     * The each method iterates through an array items or object values
     * and repeats the child elements by using them as a template
     *
     * @memberof blocks.queries
     * @param {Array|Object} collection - The collection to iterate over
     *
     * @example {html}
     * <script>
     *   blocks.query({
     *     items: ['John', 'Doe']
     *   });
     * </script>
     * <ul data-query="each(items)">
     *   <li>{{$this}}</li>
     * </ul>
     *
     * <!-- will result in -->
     * <ul data-query="each(items)">
     *   <li>John</li>
     *   <li>Doe</li>
     * </ul>
     */
    each: {
      passDomQuery: true,

      passRawValues: true,

      supportsComments: true,

      _getStaticHtml: function (domQuery, element) {
        var children = element._children;
        var headers = element._headers;
        var footers = element._footers;
        var index = -1;
        var headerHtml = '';
        var footerHtml = '';
        var length;
        var dataRole;
        var child;

        if (headers) {
          length = Math.max(headers.length, footers.length);

          while (++index < length) {
            if (headers[index]) {
              headerHtml += headers[index].render(domQuery);
            }
            if (footers[index]) {
              footerHtml += footers[index].render(domQuery);
            }
          }
        } else {
          headers = element._headers = [];
          footers = element._footers = [];

          while (++index < children.length) {
            child = children[index];
            if (child.isExpression) {
              continue;
            }
            if (typeof child == 'string') {
              if (child.replace(trimRegExp, '').replace(/(\r\n|\n|\r)/gm, '') === '') {
                children.splice(index--, 1);
              }
              continue;
            }
            child._each = true;
            dataRole = child._attributes['data-role'];
            if (dataRole == 'header') {
              headerHtml += child.render(domQuery);
              headers.push(child);
              children.splice(index--, 1);
            } else if (dataRole == 'footer') {
              footerHtml += child.render(domQuery);
              footers.push(child);
              children.splice(index--, 1);
            }
          }
        }

        return {
          header: headerHtml,
          headersCount: headers.length,
          footer: footerHtml,
          footersCount: footers.length
        };
      },

      preprocess: function (domQuery, collection) {
        var syncIndex = domQuery.getSyncIndex();
        var element = this;
        var index = 0;
        var rawCollection;
        var elementData;
        var staticHtml;
        var childs;
        var html;
        
        if (this._sync) {
          element.updateChildren(domQuery, collection, this._el);
          return;
        }

        this._template = this._template || this._children;

        this._childrenEach = true;

        if (domQuery._serverData) {
          elementData = domQuery._serverData[ElementsData.id(this)];
          domQuery._serverData[ElementsData.id(this)] = undefined;
          if (elementData) {
            var div = document.createElement('div');
            div.innerHTML = elementData;
            element._template = element._children = createVirtual(div.childNodes[0], element);
          }
        }

        staticHtml = queries.each._getStaticHtml(domQuery, element);
        html = staticHtml.header;

        if (blocks.isObservable(collection)) {
          elementData = ElementsData.data(element);
          elementData.eachData = {
            id: collection.__id__,
            element: element,
            startOffset: staticHtml.headersCount,
            endOffset: staticHtml.footersCount
          };
        }

        rawCollection = blocks.unwrapObservable(collection);

        childs = domQuery._context.childs = [];
        
        if (blocks.isArray(rawCollection)) {
          for (index = 0; index < rawCollection.length; index++) {
            domQuery.dataIndex(blocks.observable.getIndex(collection, index));
            childs.push(domQuery.pushContext(rawCollection[index])); 
            html += this.renderChildren(domQuery, syncIndex + index);
            domQuery.popContext(); 
            domQuery.dataIndex(undefined);
          }
        } else if (blocks.isObject(rawCollection)) {
          for (var key in rawCollection) {
            domQuery.dataIndex(blocks.observable.getIndex(collection, index));
            domQuery.pushContext(rawCollection[key]);
            html += element.renderChildren(domQuery);
            domQuery.popContext();
            domQuery.dataIndex(undefined);
            index++;
          }
        }

        this.html(html + staticHtml.footer);
      }

      // update: function () {
      //
      // }
    },

    /**
     * Render options for a <select> element by providing an collection.
     *
     * @memberof blocks.queries
     * @param {(Array|Object)} collection - The collection to iterate over
     * @param {Object} [options] - Options to customize the behavior for creating each option.
     * options.value - determines the field in the collection to server for the option value
     * options.text - determines the field in the collection to server for the option text
     * options.caption - creates a option with the specified text at the first option
     *
     * @example {html}
     * <script>
     * blocks.query({
     *   caption: 'Select user'
     *   data: [
     *     { name: 'John', id: 1 },
     *     { name: 'Doe', id: 2 }
     *   ]
     * });
     * </script>
     * <select data-query="options(data, { text: 'name', value: 'id', caption: caption })">
     * </select>
     *
     * <!-- will result in -->
     * <select data-query="options(data, { text: 'name', value: 'id', caption: caption })">
     *   <option>Select user</option>
     *   <option value="1">John</option>
     *   <option value="2">Doe</option>
     * </select>
     */
    options: {
      passDomQuery: true,

      passRawValues: true,

      preprocess: function (domQuery, collection, options) {
        options = options || {};
        var $thisStr = '$this';
        var text = Expression.Create('{{' + (options.text || $thisStr) + '}}');
        var value = Expression.Create('{{' + (options.value || $thisStr) + '}}', 'value');
        var caption = blocks.isString(options.caption) && new VirtualElement('option');
        var option = new VirtualElement('option');
        var children = this._children;
        var i = 0;
        var child;

        for (; i < children.length; i++) {
          child = children[i];
          if (!child._attributes || (child._attributes && !child._attributes['data-role'])) {
            children.splice(i--, 1);
          }
        }

        option._attributeExpressions.push(value);
        option._children.push(text);
        option._parent = this;
        this._children.push(option);

        if (caption) {
          caption._attributes['data-role'] = 'header';
          caption._innerHTML = options.caption;
          this.addChild(caption);
        }

        blocks.queries.each.preprocess.call(this, domQuery, collection);
      }
    },

    /**
    * The render query allows elements to be skipped from rendering and not to exist in the HTML result
    *
    * @memberof blocks.queries
    * @param {boolean} condition The value determines if the element will be rendered or not
    * @param {boolean} [renderChildren=false] The value indicates if the children will be rendered
    *
    * @example {html}
    * <div data-query="render(true)">Visible</div>
    * <div data-query="render(false)">Invisible</div>
    *
    * <!-- html result will be -->
    * <div data-query="render(true)">Visible</div>
    */
    render: {
      passDetailValues: true,

      preprocess: function (condition) {
        if (!this._each && !this._sync) {
          throw new Error('render() is supported only() in each context');
        }

        this._renderMode = condition.value ? VirtualElement.RenderMode.All : VirtualElement.RenderMode.None;

        if (condition.containsObservable && this._renderMode == VirtualElement.RenderMode.None) {
          this._renderMode = VirtualElement.RenderMode.ElementOnly;
          this.css('display', 'none');
          ElementsData.data(this, 'renderCache', this);
        }
      },

      update: function (condition) {
        var elementData = ElementsData.data(this);
        if (elementData.renderCache && condition.value) {
          // TODO: Should use the logic from dom.html method
          this.innerHTML = elementData.renderCache.renderChildren(blocks.domQuery(this));
          blocks.domQuery(this).createElementObservableDependencies(this.childNodes);
          elementData.renderCache = null;
        }

        this.style.display = condition.value ? '' : 'none';
      }
    },

    /**
     * Determines when an observable value will be synced from the DOM.
     * Only applicable when using the 'val' data-query.
     *
     * @param {string} eventName - the name of the event. Possible values are:
     * 'input'(default)
     * 'keydown' -
     * 'change' -
     * 'keyup' -
     * 'keypress' -
     */
    updateOn: {
      preprocess: function (eventName) {
        ElementsData.data(this).updateOn = eventName;
      }
    },

    /**
     * Could be used for custom JavaScript animation by providing a callback function
     * that will be called the an animation needs to be performed
     *
     * @memberof blocks.queries
     * @param {Function} callback - The function that will be called when animation needs
     * to be performed.
     *
     * @example {html}
     * <script>
     * blocks.query({
     *   visible: blocks.observable(true),
     *   toggleVisibility: function () {
     *     // this points to the model object passed to blocks.query() method
     *     this.visible(!this.visible());
     *   },
     *
     *   fade: function (element, ready) {
     *     Velocity(element, {
     *       // this points to the model object passed to blocks.query() method
     *       opacity: this.visible() ? 1 : 0
     *     }, {
     *       duration: 1000,
     *       queue: false,
     *
     *       // setting the ready callback to the complete callback
     *       complete: ready
     *     });
     *   }
     * });
     * </script>
     * <button data-query="click(toggleVisibility)">Toggle visibility</button>
     * <div data-query="visible(visible).animate(fade)" style="background: red;width: 300px;height: 240px;">
     * </div>
     */
    animate: {
      preprocess: function (callback) {
        ElementsData.data(this).animateCallback = callback;
      }
    },

    /**
    * Adds or removes a class from an element
    *
    * @memberof blocks.queries
    * @param {string|Array} className - The class string (or array of strings) that will be added or removed from the element.
    * @param {boolean|undefined} [condition=true] - Optional value indicating if the class name will be added or removed. true - add, false - remove.
    *
    * @example {html}
    * <div data-query="setClass('header')"></div>
    *
    * <!-- will result in -->
    * <div data-query="setClass('header')" class="header"></div>
    */
    setClass: {
      preprocess: function (className, condition) {
        if (arguments.length > 1) {
          this.toggleClass(className, !!condition);
        } else {
          this.addClass(className);
        }
      },

      update: function (className, condition) {
        var virtual = ElementsData.data(this).virtual;
        if (virtual._each) {
          virtual = VirtualElement();
          virtual._el = this;
        }
        if (arguments.length > 1) {
          virtual.toggleClass(className, condition);
        } else {
          virtual.addClass(className);
        }
      }
    },

    /**
    * Sets the inner html to the element
    *
    * @memberof blocks.queries
    * @param {string} html - The html that will be places inside element replacing any other content.
    * @param {boolean} [condition=true] - Condition indicating if the html will be set.
    *
    * @example {html}
    * <div data-query="html('<b>some content</b>')"></div>
    *
    * <!-- will result in -->
    * <div data-query="html('<b>some content</b>')"><b>some content</b></div>
    */
    html: {
      call: true
    },

    /**
    * Adds or removes the inner text from an element. Escapes any HTML provided
    *
    * @memberof blocks.queries
    * @param {string} text - The text that will be places inside element replacing any other content.
    * @param {boolean} [condition=true] - Value indicating if the text will be added or cleared. true - add, false - clear.
    *
    * @example {html}
    * <div data-query="html('some content')"></div>
    *
    * <!-- will result in -->
    * <div data-query="html('some content')">some content</div>
    */
    text: {
      call: true
    },

    /**
    * Determines if an html element will be visible. Sets the CSS display property.
    *
    * @memberof blocks.queries
    * @param {boolean} [condition=true] Value indicating if element will be visible or not.
    *
    * @example {html}
    * <div data-query="visible(true)">Visible</div>
    * <div data-query="visible(false)">Invisible</div>
    *
    * <!-- html result will be -->
    * <div data-query="visible(true)">Visible</div>
    * <div data-query="visible(false)" style="display: none;">Invisible</div>
    */
    visible: {
      call: 'css',

      prefix: 'display'
    },

    /**
    * Gets, sets or removes an element attribute.
    * Passing only the first parameter will return the attributeName value
    *
    * @memberof blocks.queries
    * @param {string} attributeName - The attribute name that will be get, set or removed.
    * @param {string} attributeValue - The value of the attribute. It will be set if condition is true.
    *
    * @example {html}
    * <div data-query="attr('data-content', 'some content')"></div>
    *
    * <!-- will result in -->
    * <div data-query="attr('data-content', 'some content')" data-content="some content"></div>
    */
    attr: {
      passRawValues: true,

      call: true
    },

    /**
    * Sets the value attribute on an element.
    *
    * @memberof blocks.queries
    * @param {(string|number|Array|undefined)} value - The new value for the element.
    *
    * @example {html}
    * <script>
    * blocks.query({
    *   name: blocks.observable('John Doe')
    * });
    * </script>
    * <input data-query="val(name)" />
    *
    * <!-- will result in -->
    * <input data-query="val(name)" value="John Doe" />
    */
    val: {
      passRawValues: true,

      call: 'attr',

      prefix: 'value'
    },

    /**
    * Sets the checked attribute on an element
    *
    * @memberof blocks.queries
    * @param {boolean|undefined} [condition=true] - Determines if the element will be checked or not
    *
    * @example {html}
    * <input type="checkbox" data-query="checked(true)" />
    * <input type="checkbox" data-query="checked(false)" />
    *
    * <!-- will result in -->
    * <input type="checkbox" data-query="checked(true)" checked="checked" />
    * <input type="checkbox" data-query="checked(false)" />
    */
    checked: {
      passRawValues: true,

      call: 'attr'
    },

    /**
    * Sets the disabled attribute on an element
    *
    * @memberof blocks.queries
    * @param {boolean|undefined} [condition=true] - Determines if the element will be disabled or not
    */
    disabled: {
      passRawValues: true,

      call: 'attr'
    },

    /**
      * Gets, sets or removes a CSS style from an element.
      * Passing only the first parameter will return the CSS propertyName value.
      *
      * @memberof blocks.queries
      * @param {string} name - The name of the CSS property that will be get, set or removed
      * @param {string} value - The value of the of the attribute. It will be set if condition is true
      *
      * @example {html}
      * <script>
      *   blocks.query({
      *     h1FontSize: 12
      *   });
      * </script>
      * <h1 data-query="css('font-size', h1FontSize)"></h1>
      * <h1 data-query="css('fontSize', h1FontSize)"></h1>
      *
      * <!-- will result in -->
      * <h1 data-query="css('font-size', h1FontSize)" style="font-size: 12px;"></h1>
      * <h1 data-query="css('fontSize', h1FontSize)" style="font-size: 12px;"></h1>
      */
    css: {
      call: true
    },

    /**
      * Sets the width of the element
      *
      * @memberof blocks.queries
      * @param {(number|string)} value - The new width of the element
      */
    width: {
      call: 'css'
    },

    /**
      * Sets the height of the element
      *
      * @memberof blocks.queries
      * @param {number|string} value - The new height of the element
      */
    height: {
      call: 'css'
    },

    focused: {
      preprocess: blocks.noop,

      update: function (value) {
        if (value) {
          this.focus();
        }
      }
    },

    /**
     * Subscribes to an event
     *
     * @memberof blocks.queries
     * @param {(String|Array)} events - The event or events to subscribe to
     * @param {Function} callback - The callback that will be executed when the event is fired
     * @param {*} [args] - Optional arguments that will be passed as second parameter to
     * the callback function after the event arguments
     */
    on: {
      ready: function (events, callbacks, args) {
        if (!events || !callbacks) {
          return;
        }

        callbacks = blocks.toArray(callbacks);

        var element = this;
        var handler = function (e) {
          var context = blocks.context(this);
          var thisArg = context.$template || context.$view || context.$root;
          blocks.each(callbacks, function (callback) {
            callback.call(thisArg, e, args);
          });
        };

        events = blocks.isArray(events) ? events : events.toString().split(' ');

        blocks.each(events, function (event) {
          addListener(element, event, handler);
        });
      }
    }
  });

  blocks.each([
    // Mouse
    'click', 'dblclick', 'mousedown', 'mouseup', 'mouseover', 'mousemove', 'mouseout',
    // HTML form
    'select', 'change', 'submit', 'reset', 'focus', 'blur',
    // Keyboard
    'keydown', 'keypress', 'keyup'
  ], function (eventName) {
    blocks.queries[eventName] = {
      passRawValues: true,

      ready: function (callback, data) {
        blocks.queries.on.ready.call(this, eventName, callback, data);
      }
    };
  });

    var OBSERVABLE = '__blocks.observable__';


  function ChunkManager(observable) {
    this.observable = observable;
    this.chunkLengths = {};
    this.dispose();
  }

  ChunkManager.prototype = {
    dispose: function () {
      this.childNodesCount = undefined;
      this.startIndex = 0;
      this.observableLength = undefined;
      this.startOffset = 0;
      this.endOffset = 0;
    },

    setStartIndex: function (index) {
      this.startIndex = index + this.startOffset;
    },

    setChildNodesCount: function (count) {
      if (this.childNodesCount === undefined) {
        this.observableLength = this.observable.__value__.length;
      }
      this.childNodesCount = count - (this.startOffset + this.endOffset);
    },

    chunkLength: function (wrapper) {
      var chunkLengths = this.chunkLengths;
      var id = ElementsData.id(wrapper);
      var length = chunkLengths[id] || (this.childNodesCount || wrapper.childNodes.length) / (this.observableLength || this.observable.__value__.length);
      var result;

      if (blocks.isNaN(length) || length === Infinity) {
        result = 0;
      } else {
        result = Math.round(length);
      }

      chunkLengths[id] = result;

      return result;
    },

    getAt: function (wrapper, index) {
      var chunkLength = this.chunkLength(wrapper);
      var childNodes = wrapper.childNodes;
      var result = [];

      for (var i = 0; i < chunkLength; i++) {
        result[i] = childNodes[index * chunkLength + i + this.startIndex];
      }
      return result;
    },

    insertAt: function (wrapper, index, chunk) {
      animation.insert(
        wrapper,
        this.chunkLength(wrapper) * index + this.startIndex,
        blocks.isArray(chunk) ? chunk : [chunk]);
    },

    removeAt: function (wrapper, index) {
      var chunkLength = this.chunkLength(wrapper);

      animation.remove(
        wrapper,
        chunkLength * index + this.startIndex,
        chunkLength);
    },
    
    remove: function (index, howMany) {
      var _this = this;
      
      this.each(function (domElement) {
        for (var j = 0; j < howMany; j++) {
          _this.removeAt(domElement, index);
        }
      });

      ElementsData.collectGarbage();
      
      this.dispose();
  
      this.observable._indexes.splice(index, howMany);
    },

    removeAll: function () {
      var _this = this;
      var array = this.observable.__value__;

      this.each(function (parent) {
        blocks.each(array, function () {
          _this.removeAt(parent, 0);
        });
      });
    },
    
    add: function (addItems, index) {
      var _this = this;
      var observable = this.observable;
      
      blocks.each(addItems, function (item, i) {
        observable._indexes.splice(index + i, 0, blocks.observable(index + i));
      });

      this.each(function (domElement, virtualElement) {
        var domQuery = blocks.domQuery(domElement);
        var context = blocks.context(domElement);
        var html = '';
        var syncIndex;
        
        domQuery.contextBubble(context, function () {
          syncIndex = domQuery.getSyncIndex();
          for (var i = 0; i < addItems.length; i++) {
            domQuery.dataIndex(blocks.observable.getIndex(observable, i + index, true));
            context.childs.splice(i + index, 0, domQuery.pushContext(addItems[i]));
            html += virtualElement.renderChildren(domQuery, syncIndex + (i + index));
            domQuery.popContext();
            domQuery.dataIndex(undefined);
          }
        });

        if (domElement.childNodes.length === 0) {
          dom.html(domElement, html);
          domQuery.createElementObservableDependencies(domElement.childNodes);
        } else {
          var fragment = domQuery.createFragment(html);
          _this.insertAt(domElement, index, fragment);
        }
      });
      
      this.dispose();
    },

    each: function (callback) {
      var i = 0;
      var domElements = this.observable._elements;

      for (; i < domElements.length; i++) {
        var data = domElements[i];
        if (!data.element) {
          data.element = ElementsData.data(data.elementId).dom;
        }
        this.setup(data.element, callback);
      }
    },

    setup: function (domElement, callback) {
      if (!domElement) {
        return;
      }

      var eachData = ElementsData.data(domElement).eachData;
      var element;
      var commentId;
      var commentIndex;
      var commentElement;

      if (!eachData || eachData.id != this.observable.__id__) {
        return;
      }

      element = eachData.element;
      this.startOffset = eachData.startOffset;
      this.endOffset = eachData.endOffset;

      if (domElement.nodeType == 1) {
        // HTMLElement
        this.setStartIndex(0);
        this.setChildNodesCount(domElement.childNodes.length);
        callback(domElement, element, domElement);
      } else {
        // Comment
        commentId = ElementsData.id(domElement);
        commentElement = domElement.parentNode.firstChild;
        commentIndex = 0;
        while (commentElement != domElement) {
          commentElement = commentElement.nextSibling;
          commentIndex++;
        }
        this.setStartIndex(commentIndex + 1);
        while (commentElement && (commentElement.nodeType != 8 || commentElement.nodeValue.indexOf(commentId + ':/blocks') != 1)) {
          commentElement = commentElement.nextSibling;
          commentIndex++;
        }
        this.setChildNodesCount(commentIndex - this.startIndex);
        callback(domElement.parentNode, element, domElement);
      }
    }
  };



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
          if (blocks.isArray(currentValue) && blocks.isArray(value) && observable.reset) {
            observable.reset(value);
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

  var observableIndexes = {};

  blocks.extend(blocks.observable, {
    getIndex: function (observable, index, forceGet) {
      if (!blocks.isObservable(observable)) {
        if (!observableIndexes[index]) {
          observableIndexes[index] = blocks.observable(index);
        }
        return observableIndexes[index];
      }
      var indexes = observable._indexes;
      var $index;

      if (indexes) {
        if (indexes.length == observable.__value__.length || forceGet) {
          $index = indexes[index];
        } else {
          $index = blocks.observable(index);
          indexes.splice(index, 0, $index);
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
          var elementData;
          var domQuery;
          var context;
          var element;
          var offset;
          var value;

          blocks.eachRight(this._expressions, function updateExpression(expression) {
            element = expression.element;
            context = expression.context;

            if (!element) {
              elementData = ElementsData.data(expression.elementId);
              element = expression.element = elementData.dom;
            }

            try {
              value = blocks.unwrap(parameterQueryCache[expression.expression](context));
            } catch (ex) {
              value = '';
            }

            value = value == null ? '' : value.toString();

            offset = expression.length - value.length;
            expression.length = value.length;

            if (element) {
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
            } else {
             element = elementData.virtual;
             if (expression.attr) {
               element.attr(expression.attr, Expression.GetValue(context, null, expression.entire));
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
            if (VirtualElement.Is(element) || document.body.contains(element)) {
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
        reset: function (array) {
          if (arguments.length === 0) {
            this.removeAll();
            return this;
          }

          array = blocks.unwrap(array);

          var current = this.__value__;
          var chunkManager = this._chunkManager;
          var addCount = Math.max(array.length - current.length, 0);
          var removeCount = Math.max(current.length - array.length, 0);
          var updateCount = array.length - addCount;

          Events.trigger(this, 'removing', {
            type: 'removing',
            items: current,
            index: 0
          });

          Events.trigger(this, 'adding', {
            type: 'adding',
            items: array,
            index: 0
          });

          chunkManager.each(function (domElement, virtualElement) {
            var domQuery = blocks.domQuery(domElement);

            domQuery.contextBubble(blocks.context(domElement), function () {
                virtualElement.updateChildren(array, updateCount, domQuery, domElement);
            });
          });

          if (addCount > 0) {
            chunkManager.add(array.slice(current.length), current.length);
          } else if (removeCount > 0) {
            chunkManager.remove(array.length, removeCount);
          }

          this.__value__ = array;

          Events.trigger(this, 'remove', {
            type: 'remove',
            items: current,
            index: 0
          });

          Events.trigger(this, 'add', {
            type: 'add',
            items: array,
            index: 0
          });

          return this;
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
         * @param {(Function|*)} value - the value that will be removed or a callback function
         * which returns true or false to determine if the value should be removed
         * @param {Function} [thisArg] - Optional this context for the callback
         * @returns {blocks.observable} - Returns the observable itself - return this;
         *
         * @example {javascript}
         *
         */
        remove: function (value, thisArg) {
          return this.removeAll(value, thisArg, true);
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
         * @param {*} [thisArg] - Optional this context for the callback function
         * @returns {blocks.observable} - Returns the observable itself - return this;
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
         * @param {...Array} arrays - The arrays to be joined
         * @returns {Array} - The joined array
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
          var array = this.__value__;
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

            chunkManager.remove(index, howMany);

            returnValue = array.splice(index, howMany);
            Events.trigger(this, 'remove', {
              type: 'remove',
              items: returnValue,
              index: index
            });
          }

          if (args.length > 2) {
            addItems = blocks.toArray(args);
            addItems.splice(0, 2);
            Events.trigger(this, 'adding', {
              type: 'adding',
              index: index,
              items: addItems
            });

            chunkManager.add(addItems, index);

            array.splice.apply(array, [index, 0].concat(addItems));
            Events.trigger(this, 'add', {
              type: 'add',
              index: index,
              items: addItems
            });
          }

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
      
      newObservable.on('add', function () {
        if (newObservable.view._initialized) {
          newObservable.view._connections = {};
          newObservable.view.reset();
          ExtenderHelper.executeOperations(newObservable);
        }
      });
  
      newObservable.on('remove', function () {
        if (newObservable.view._initialized) {
          newObservable.view._connections = {};
          newObservable.view.reset();
          ExtenderHelper.executeOperations(newObservable);
        }
      });

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
    var observable = ExtenderHelper.initExpressionExtender(this);
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

    return observable;
  };

  blocks.observable.step = function (options) {
    var observable = ExtenderHelper.initExpressionExtender(this);

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
    var observable = ExtenderHelper.initExpressionExtender(this);

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
    var observable = ExtenderHelper.initExpressionExtender(this);

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
    var observable = ExtenderHelper.initExpressionExtender(this);

    observable._operations.push({
      type: 'sort',
      sort: options
    });

    return observable;
  };


  /**
   * Performs a query operation on the DOM. Executes all data-query attributes
   * and renders the html result to the specified HTMLElement if not specified
   * uses document.body by default.
   *
   * @memberof blocks
   * @param {*} model - The model that will be used to query the DOM.
   * @param {HTMLElement} [element=document.body] - Optional element on which to execute the query.
   *
   * @example {html}
   * <script>
   *   blocks.query({
   *     message: 'Hello World!'
   *   });
   * </script>
   * <h1>Hey, {{message}}</h1>
   *
   * <!-- will result in -->
   * <h1>Hey, Hello World!</h1>
   */
  blocks.query = function query(model, element) {
    blocks.domReady(function () {
      blocks.$unwrap(element, function (element) {
        if (!blocks.isElement(element)) {
          element = document.body;
        }

        var domQuery = new DomQuery();
        var rootElement = createVirtual(element)[0];
        var serverData = window.__blocksServerData__;

        domQuery.pushContext(model);
        domQuery._serverData = serverData;

        if (serverData) {
          rootElement.render(domQuery);
        } else {
          rootElement.sync(domQuery);
        }
        domQuery.createElementObservableDependencies([element]);
      });
    });
  };

  blocks.executeQuery = function executeQuery(element, queryName /*, ...args */) {
    var methodName = VirtualElement.Is(element) ? 'preprocess' : 'update';
    var args = Array.prototype.slice.call(arguments, 2);
    var query = blocks.queries[queryName];
    if (query.passDomQuery) {
      args.unshift(blocks.domQuery(element));
    }
    query[methodName].apply(element, args);
  };

  /**
   * Gets the context for a particular element. Searches all parents until it finds the context.
   *
   * @memberof blocks
   * @param {(HTMLElement|blocks.VirtualElement)} element - The element from which to search for a context
   * @returns {Object} - The context object containing all context properties for the specified element
   *
   * @example {html}
   * <script>
   *   blocks.query({
   *     items: ['John', 'Alf', 'Mega'],
   *     alertIndex: function (e) {
   *       alert('Clicked an item with index:' + blocks.context(e.target).$index);
   *     }
   *   });
   * </script>
   * <ul data-query="each(items)">
   *   <li data-query="click(alertIndex)">{{$this}}</li>
   * </ul>
   */
  blocks.context = function context(element, isRecursive) {
    element = blocks.$unwrap(element);

    if (element) {
      var elementData = ElementsData.data(element);
      if (elementData) {
        if (isRecursive && elementData.childrenContext) {
          return elementData.childrenContext;
        }
        if (elementData.context) {
          return elementData.context;
        }
      }

      return blocks.context(VirtualElement.Is(element) ? element._parent : element.parentNode, true);
    }
    return null;
  };

  /**
   * Gets the associated dataItem for a particlar element. Searches all parents until it finds the context
   *
   * @memberof blocks
   * @param {(HTMLElement|blocks.VirtualElement)} element - The element from which to search for a dataItem
   * @returns {*}
   *
   * @example {html}
   * <script>
   *   blocks.query({
   *     items: [1, 2, 3],
   *     alertValue: function (e) {
   *       alert('Clicked the value: ' + blocks.dataItem(e.target));
   *     }
   *   });
   * </script>
   * <ul data-query="each(items)">
   *   <li data-query="click(alertValue)">{{$this}}</li>
   * </ul>
   */
  blocks.dataItem = function dataItem(element) {
    var context = blocks.context(element);
    return context ? context.$this : null;
  };

  /**
   * Determines if particular value is an blocks.observable
   *
   * @memberof blocks
   * @param {*} value - The value to check if the value is observable
   * @returns {boolean} - Returns if the value is observable
   *
   * @example {javascript}
   * blocks.isObservable(blocks.observable(3));
   * // -> true
   *
   * blocks.isObservable(3);
   * // -> false
   */
  blocks.isObservable = function isObservable(value) {
    return !!value && value.__identity__ === OBSERVABLE;
  };

  /**
   * Gets the raw value of an observable or returns the value if the specified object is not an observable
   *
   * @memberof blocks
   * @param {*} value - The value that could be any object observable or not
   * @returns {*} - Returns the unwrapped value
   *
   * @example {javascript}
   * blocks.unwrapObservable(blocks.observable(304));
   * // -> 304
   *
   * blocks.unwrapObservable(305);
   * // -> 305
   */
  blocks.unwrapObservable = function unwrapObservable(value) {
    if (value && value.__identity__ === OBSERVABLE) {
      return value();
    }
    return value;
  };

  blocks.domQuery = function domQuery(element) {
    element = blocks.$unwrap(element);
    if (element) {
      var data = ElementsData.data(element, 'domQuery');
      if (data) {
        return data;
      }
      return blocks.domQuery(VirtualElement.Is(element) ? element._parent : element.parentNode);
    }
    return null;
  };



})();// @source-code
  })();

  /* @if DEBUG */
  (function() {
    var toString = blocks.toString;
    blocks.toString = function(value) {
      if (arguments.length === 0) {
        return 'jsblocks - Better MV-ish Framework';
      }
      return toString(value);
    };
  })();
  /* @endif */

  var _blocks = global.blocks;

  blocks.noConflict = function (deep) {
    if (global.blocks === blocks) {
      global.blocks = _blocks;
    }

    if (deep && global.blocks === blocks) {
      global.blocks = _blocks;
    }

    return blocks;
  };

  if (typeof define === 'function' && define.amd) {
    define('blocks', [], function () {
      return blocks;
    });
  }

  if (noGlobal !== true) {
    global.blocks = blocks;
  }

  return blocks;

}));
