

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
contains: function anonymous(index,type,expression,tillExpressions,skipTake) {
return {
boolResult: false,
args: ['searchValue'],
beforeLoop: 'result' + index + '=false;',
inLoop: 'if (value===searchValue' + index + '){result' + index + '=true;break ;};'}
},each: function anonymous(index,type,expression,tillExpressions,skipTake) {
var prepareValues = 'callback' + index + '=blocks.core.parseCallback(callback' + index + ',thisArg' + index + ');';
return {
args: ['callback', 'thisArg'],
beforeLoop: (index === ''?'' + prepareValues + '':''),
inLoop: 'callback' + index + '(value,indexOrKey,collection);',
prepareValues: prepareValues}
},
// Objects with different constructors are not equivalent, but `Object`s
equals: function anonymous(index,type,expression,tillExpressions,skipTake) {
var prepareValues = 'deepEqual' + index + '=deepEqual' + index + '===false?false:true;';
return {
boolResult: true,
args: ['compareValue', 'deepEqual'],
beforeLoop: (index === ''?'' + prepareValues + '':'')+'var index' + index + '=0;var resultResolved' + index + '=false;var size' + index + '=0;var key' + index + ';result' + index + '=true;if (Object.prototype.toString.call(collection)!==Object.prototype.toString.call(compareValue' + index + ')){result' + index + '=false;resultResolved' + index + '=true;};if (!resultResolved' + index + '){var aCtor=collection.constructor;var bCtor=compareValue' + index + '.constructor;if (aCtor!==bCtor&&!(blocks.isFunction(aCtor)&&aCtor instanceof aCtor&&blocks.isFunction(bCtor)&&bCtor instanceof bCtor)&&("constructor" in collection&&"constructor" in compareValue' + index + ')){result' + index + '=false;resultResolved' + index + '=true;}};',
inLoop: (type == 'array'?'if (!resultResolved' + index + '){if (deepEqual' + index + '?!blocks.equals(value,compareValue' + index + '[size' + index + '],true):value!==compareValue' + index + '[size' + index + ']){result' + index + '=false;break;}size' + index + '+=1;};':'')+(type == 'object'?'if (!resultResolved' + index + '){if (blocks.has(collection,indexOrKey)){if (!blocks.has(compareValue' + index + ',indexOrKey)||(deepEqual' + index + '?!blocks.equals(value,compareValue' + index + '[indexOrKey],true):value!==compareValue' + index + '[indexOrKey])){result' + index + '=false;break;}size' + index + '+=1;}};':''),
afterLoop: (type == 'array'?'if (!compareValue' + index + '||size' + index + '!==compareValue' + index + '.length){result' + index + '=false;resultResolved' + index + '=true;};':'')+(type == 'object'?'if (!resultResolved' + index + '&&result' + index + '){for (key' + index + ' in compareValue' + index + '){if (blocks.has(compareValue' + index + ',key' + index + ')&&!size' + index + '--){break ;}}result' + index + '=!size' + index + ';};':''),
prepareValues: prepareValues}
},every: function anonymous(index,type,expression,tillExpressions,skipTake) {
var prepareValues = 'callback' + index + '=blocks.core.parseCallback(callback' + index + ',thisArg' + index + ');';
return {
boolResult: true,
args: ['callback', 'thisArg'],
beforeLoop: 'result' + index + '=true;'+(index === ''?'' + prepareValues + '':''),
inLoop: 'if (callback' + index + '){if (!callback' + index + '(value,indexOrKey,collection)){result' + index + '=false;break ;}}else if (!value){result' + index + '=false;break ;};',
prepareValues: prepareValues}
},filter: function anonymous(index,type,expression,tillExpressions,skipTake) {
var prepareValues = 'callback' + index + '=blocks.core.filterPrepare(callback' + index + ',thisArg' + index + ');';
return {
args: ['callback', 'thisArg'],
beforeLoop: (index === ''?'' + prepareValues + '':'')+(index === '' || tillExpressions.length === 0?''+(type == 'array'?'result' + index + '=[];':'')+(type == 'object'?'result' + index + '={};':''):''),
inLoop: 'if (!callback' + index + '(value,indexOrKey,collection)){continue ;};' + skipTake + ';'+(index === '' || tillExpressions.length === 0?''+(type == 'array'?'result' + index + '.push(value);':'')+(type == 'object'?'result' + index + '[indexOrKey]=value;':''):''),
prepareValues: prepareValues}
},first: function anonymous(index,type,expression,tillExpressions,skipTake) {
var prepareValues = 'if (callback' + index + '){callback' + index + '=blocks.core.parseCallback(callback' + index + ',thisArg' + index + ');};';
return {
args: ['callback', 'thisArg'],
beforeLoop: 'var isNumber' + index + '=blocks.isNumber(callback' + index + ');var size' + index + '=0;var count' + index + '=1;var current' + index + ';if (isNumber' + index + '){result' + index + '=[];count' + index + '=callback' + index + ';callback' + index + '=thisArg' + index + ';};'+(index === ''?'' + prepareValues + '':''),
inLoop: 'if (callback' + index + '){if (callback' + index + '(value,indexOrKey,collection)){current' + index + '=value;}else {continue ;}}else {current' + index + '=value;};if (isNumber' + index + '){if (size' + index + '++>=count' + index + '){break ;}result' + index + '.push(current' + index + ');}else {result' + index + '=current' + index + ';break ;};',
prepareValues: prepareValues,
everything: true}
},has: function anonymous(index,type,expression,tillExpressions,skipTake) {
return {
boolResult: false,
args: ['key'],
beforeLoop: 'result' + index + '=false;',
afterLoop: 'result' + index + '=blocks.has(collection,key' + index + ');'}
},
// TODO: ifNeedsResult could be removed and automatically detect if you need to include the this.result in the descriptor string
invoke: function anonymous(index,type,expression,tillExpressions,skipTake) {
return {
args: ['method', 'args'],
beforeLoop: 'var isFunc' + index + '=blocks.isFunction(method' + index + ');'+(index === '' || tillExpressions.length === 0?''+(type == 'array'?'result' + index + '=[];':'')+(type == 'object'?'result' + index + '={};':''):'')+(index === ''?'args' + index + '=Array.prototype.slice.call(arguments,2);':''),
inLoop: 'value=(isFunc' + index + '?method' + index + ':value[method' + index + ']).apply(value,args' + index + '||[]);'+(index === '' || tillExpressions.length === 0?''+(type == 'array'?'result' + index + '.push(value);':'')+(type == 'object'?'result' + index + '[indexOrKey]=value;':''):'')}
},isEmpty: function anonymous(index,type,expression,tillExpressions,skipTake) {
return {
boolResult: true,
beforeLoop: 'result' + index + '=true;',
inLoop: 'result' + index + '=false;'}
},join: function anonymous(index,type,expression,tillExpressions,skipTake) {
return {
args: ['separator'],
beforeLoop: 'separator' + index + '=typeof separator' + index + '=="undefined"?",":separator' + index + ';result' + index + '="";',
inLoop: 'result' + index + '+=value+separator' + index + ';',
afterLoop: 'result' + index + '=result' + index + '.substring(0,result' + index + '.length-separator' + index + '.length);'}
},
// NOTE: The code could be minified using UglifyJS.
map: function anonymous(index,type,expression,tillExpressions,skipTake) {
var prepareValues = 'callback' + index + '=blocks.core.parseCallback(callback' + index + ',thisArg' + index + ');';
return {
args: ['callback', 'thisArg'],
beforeLoop: (index === ''?'' + prepareValues + '':'')+(index === ''?''+(type == 'array'?'result' + index + '=Array(collection.length);':'')+(type == 'object'?'result' + index + '=[];':''):'')+(index !== '' && tillExpressions.length === 0?'result' + index + '=[];':''),
inLoop: 'value=callback' + index + '(value,indexOrKey,collection);'+(index === ''?''+(type == 'array'?'result' + index + '[indexOrKey]=value;':'')+(type == 'object'?'result' + index + '.push(value);':''):'')+(index !== '' && tillExpressions.length === 0?'result' + index + '.push(value);':''),
prepareValues: prepareValues}
},max: function anonymous(index,type,expression,tillExpressions,skipTake) {
var prepareValues = 'callback' + index + '=blocks.core.parseCallback(callback' + index + ',thisArg' + index + ');';
return {
args: ['callback', 'thisArg'],
beforeLoop: 'var max' + index + '=-Infinity;result' + index + '=max' + index + ';'+(index === ''?'' + prepareValues + '':''),
inLoop: 'max' + index + '=callback' + index + '?callback' + index + '(value,indexOrKey,collection):value;result' + index + '=max' + index + '>result' + index + '?max' + index + ':result' + index + ';',
prepareValues: prepareValues,
type: 'NumberExpression'}
},min: function anonymous(index,type,expression,tillExpressions,skipTake) {
var prepareValues = 'callback' + index + '=blocks.core.parseCallback(callback' + index + ',thisArg' + index + ');';
return {
args: ['callback', 'thisArg'],
beforeLoop: 'var min' + index + '=Infinity;result' + index + '=min' + index + ';'+(index === ''?'' + prepareValues + '':''),
inLoop: 'min' + index + '=callback' + index + '?callback' + index + '(value,indexOrKey,collection):value;result' + index + '=min' + index + '<result' + index + '?min' + index + ':result' + index + ';',
prepareValues: prepareValues,
type: 'NumberExpression'}
},reduce: function anonymous(index,type,expression,tillExpressions,skipTake) {
var prepareValues = 'callback' + index + '=blocks.core.reducePrepare(callback' + index + ',memo' + index + ',thisArg' + index + ');';
return {
args: ['callback', 'memo', 'thisArg'],
beforeLoop: 'var hasMemo' + index + '=memo' + index + '!=null;result' + index + '=memo' + index + ';'+(index === ''?'' + prepareValues + '':''),
inLoop: 'if (hasMemo' + index + '){result' + index + '=callback' + index + '(result' + index + ',value,indexOrKey,collection);}else {result' + index + '=collection[indexOrKey];hasMemo' + index + '=true;};',
prepareValues: prepareValues,
everything: true}
},size: function anonymous(index,type,expression,tillExpressions,skipTake) {
return {
beforeLoop: (index === ''?''+(type == 'array'?'return collection.length;':''):'')+'result' + index + '=0;',
inLoop: 'result' + index + '++;',
type: 'NumberExpression'}
},some: function anonymous(index,type,expression,tillExpressions,skipTake) {
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
at: function anonymous(index,type,expression,tillExpressions,skipTake) {
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
flatten: function anonymous(index,type,expression,tillExpressions,skipTake) {
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
indexOf: function anonymous(index,type,expression,tillExpressions,skipTake) {
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
last: function anonymous(index,type,expression,tillExpressions,skipTake) {
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
lastIndexOf: function anonymous(index,type,expression,tillExpressions,skipTake) {
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
range: function anonymous(index,type,expression,tillExpressions,skipTake) {
return {
args: ['start', 'end', 'step'],
beforeLoop: 'length=Math.max(Math.ceil((end' + index + '-start' + index + ')/step' + index + '),0);result' + index + '=Array(length);',
inLoop: 'value=start' + index + ';start' + index + '+=step' + index + ';'+(index === '' || tillExpressions.length === 0?'result' + index + '[indexOrKey]=value;':'')}
},
// TODO: reduceRight and lastIndexOf are equal to code as reduce and indexOf respectivly
reduceRight: function anonymous(index,type,expression,tillExpressions,skipTake) {
return {
reverse: true,
args: ['callback', 'memo', 'thisArg'],
beforeLoop: 'var hasMemo' + index + '=memo' + index + '!=null;result' + index + '=memo' + index + ';'+(index === ''?'callback' + index + '=blocks.core.reducePrepare(callback' + index + ',memo' + index + ',thisArg' + index + ');':''),
inLoop: 'if (hasMemo' + index + '){result' + index + '=callback' + index + '(result' + index + ',value,indexOrKey,collection);}else {result' + index + '=collection[indexOrKey];hasMemo' + index + '=true;};',
everything: true}
},unique: function anonymous(index,type,expression,tillExpressions,skipTake) {
var prepareValues = 'callback' + index + '=blocks.core.uniquePrepare(callback' + index + ',thisArg' + index + ');';
return {
args: ['callback', 'thisArg'],
beforeLoop: 'var seen' + index + '=[];var isFirst' + index + '=true;var isSorted' + index + '=blocks.isBoolean(callback' + index + ')&&callback' + index + ';var hasCallback' + index + '=blocks.isFunction(callback' + index + ');var map' + index + ';result' + index + '=[];'+(index === ''?'' + prepareValues + '':''),
inLoop: 'map' + index + '=hasCallback' + index + '?callback' + index + '(value,indexOrKey,collection):value;if (isSorted' + index + '?isFirst' + index + '||seen' + index + '[seen' + index + '.length-1]!==map' + index + ':!blocks.contains(seen' + index + ',map' + index + ')){isFirst' + index + '=false;seen' + index + '.push(map' + index + ');}else {continue ;};'+(index === '' || tillExpressions.length === 0?'result' + index + '.push(value);':''),
prepareValues: prepareValues}
},type: 'array'
};for (var key in ArrayDescriptors) {ArrayDescriptors[key].identity = key;ArrayDescriptors[key].parent = ArrayDescriptors;}

var ObjectDescriptors = {
get: function anonymous(index,type,expression,tillExpressions,skipTake) {
var prepareValues = (index === ''?'keys' + index + '=blocks.flatten(Array.prototype.slice.call(arguments,1));':'')+(index !== ''?'keys' + index + '=blocks.flatten(Array.prototype.slice.call(arguments,0));':'');
return {
args: ['keys'],
beforeLoop: (index === ''?'' + prepareValues + '':'')+'var singleKey' + index + '=keys' + index + '.length<2;keys' + index + '=blocks.toObject(keys' + index + ');result' + index + '={};',
inLoop: 'if (keys' + index + '.hasOwnProperty(indexOrKey)){if (singleKey' + index + '){result' + index + '=value;}else {result' + index + '[indexOrKey]=value;}};',
prepareValues: prepareValues}
},invert: function anonymous(index,type,expression,tillExpressions,skipTake) {
return {
beforeLoop: 'var temp' + index + ';result' + index + '={};',
inLoop: 'temp' + index + '=value;value=indexOrKey;indexOrKey=temp' + index + ';'+(index === '' || tillExpressions.length === 0?'result' + index + '[indexOrKey]=value;':'')}
},keys: function anonymous(index,type,expression,tillExpressions,skipTake) {
return {
beforeLoop: 'result' + index + '=[];',
inLoop: 'value=indexOrKey;'+(index === '' || tillExpressions.length === 0?'result' + index + '.push(value);':'')}
},pairs: function anonymous(index,type,expression,tillExpressions,skipTake) {
return {
beforeLoop: 'result' + index + '=[];',
inLoop: 'result' + index + '.push({key:indexOrKey,value:value});'}
},values: function anonymous(index,type,expression,tillExpressions,skipTake) {
return {
beforeLoop: 'result' + index + '=[];',
inLoop: 'result' + index + '.push(value);'}
},type: 'object'
};for (var key in ObjectDescriptors) {ObjectDescriptors[key].identity = key;ObjectDescriptors[key].parent = ObjectDescriptors;}

var LoopDescriptors = {
chainExpression: function anonymous(context) {
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
},conditions: function anonymous(context) {
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
},expressions: function anonymous(context) {
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
},singleExpression: function anonymous(context) {
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
},skip: function anonymous(context) {
var result = '';
result += 'if (skip' + context.index + '-- > 0) { continue; }';
return result;
},take: function anonymous(context) {
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




