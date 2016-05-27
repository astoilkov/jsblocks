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
  var blocks;
  // handle jsblocks serverside rendering overrides
  if (global.__mock__ && global._blocks) {
    blocks = global._blocks;
  } else {
    blocks = factory(global);
  }

  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = blocks;
  } else {
    global.blocks = blocks;
  }

  if (typeof define === 'function' && define.amd) {
    define('blocks', [], function () {
      return blocks;
    });
  }


  // Pass this if window is not defined yet
}(typeof window !== 'undefined' ? window : this, function(global) {
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

  blocks.version = '@version';
  blocks.core = core;

  /**
   * Copies properties from all provided objects into the first object parameter
   *
   * @memberof blocks
   * @param {boolean} [deepCopy] - If true, the merge becomes recursive (aka. deep copy)
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

      if (blocks.isFunction(value.clone)) {
        return value.clone(deepClone);
      }

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
    // @source-code
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

  return blocks;

}));
