define([
  '../core',
  './escapeRegEx'
], function (blocks, escapeRegEx) {
  blocks.route = function (route) {
    return Route(route);
  };

  function Route(route) {
    if (Route.Is(route)) {
      return route;
    }
    if (!Route.Is(this)) {
      return new Route(route);
    }

    this._routeString = route;
    this._wildcard = {};
    this._optional = {};
    this._validate = {};
    this._transform = {};
  }

  Route.Is = function (route) {
    return Route.prototype.isPrototypeOf(route);
  };

  Route.Has = function (route) {
    return route._routeString != null;
  };

  Route.Combine = function (routeA, routeB) {
    if (!Route.Has(routeB)) {
      return routeA;
    }
    if (!Route.Has(routeA)) {
      return routeB;
    }

    var route = Route(routeA + routeB);
    blocks.extend(route._wildcard, routeA._wildcard, routeB._wildcard);
    blocks.extend(route._optional, routeA._optional, routeB._optional);
    blocks.extend(route._validate, routeA._validate, routeB._validate);
    return route;
  };

  Route.prototype = {
    wildcard: function () {
      var wildcard = this._wildcard;
      var wildcards = blocks.flatten(blocks.toArray(arguments));
      blocks.each(wildcards, function (value) {
        wildcard[value] = true;
      });

      return this;
    },

    optional: function (nameOrObject, value) {
      this._addMetadata('optional', nameOrObject, value);

      return this;
    },

    validate: function (nameOrObject, value) {
      this._addMetadata('validate', nameOrObject, value);

      return this;
    },

    transform: function (nameOrObject, value) {
      this._addMetadata('_transform', nameOrObject, value);

      return this;
    },

    toString: function () {
      return this._routeString ? this._routeString.toString() : '';
    },

    trailingSlash: function () {
      return this;
    },

    _transfromParam: function (paramName, value) {
      var transform = this._transform[paramName];
      if (value === '' && blocks.has(this._optional, paramName)) {
        value = this._optional[paramName];
      }
      if (transform) {
        return transform(value);
      }
      return value;
    },

    _validateParam: function (paramName, value) {
      var validator = this._validate[paramName];
      if (validator) {
        return validator(value);
      }
      return true;
    },

    _addMetadata: function (type, nameOrObject, value) {
      var metadata = this['_' + type];

      if (blocks.isPlainObject(nameOrObject)) {
        blocks.each(nameOrObject, function (val, key) {
          metadata[key] = val;
        });
      } else if (blocks.isString(nameOrObject)) {
        metadata[nameOrObject] = value;
      }
    }
  };

  function Router() {
    this._currentRoute = {};
    this._routes = {};
    this._baseUrl = '';
  }

  blocks.core.Router = Router;

  Router.GenerateRoute = function (routeString, params) {
    var router = new Router();
    var routeId = router.registerRoute(routeString);
    var route = router.routeTo(routeId, params);

    if (routeString.indexOf('/') === 0 && route.indexOf('/') !== 0) {
      return '/' + route;
    }

    return route;
  };

  Router.prototype = {
    registerRoute: function (route, parentRoute) {
      route = Route(route);
      parentRoute = parentRoute ? Route(this._routes[Route(parentRoute).toString()].route) : Route(undefined);

      var finalRoute = Route.Combine(parentRoute, route);
      var routeId = finalRoute._routeString = finalRoute._routeString.replace(/^\//, '');
      var routeData = this._generateRouteStringData(routeId);

      this._routes[routeId] = {
        route: finalRoute,
        data: routeData,
        regExCollection: this._generateRouteRegEx(finalRoute, routeData),
        parent: Route.Has(parentRoute) ? this._routes[parentRoute.toString()] : undefined
      };

      return routeId;
    },

    routeTo: function (routeId, params) {
      var routeMetadata = this._routes[routeId];
      var route = routeMetadata.route;
      var result = '';
      var param;

      params = params || {};

      blocks.each(routeMetadata.data, function (split) {
        param = split.param;
        if (param) {
          if (route._validateParam(params[param])) {
            result += blocks.has(params, param) ? params[param] : route._optional[param];
          }
        } else {
          result += split.string;
        }
      });

      if (this._baseUrl) {
        result = this._baseUrl + result;
      }

      return result;
    },

    routeFrom: function (url) {
      var getUrlParams = this._getUrlParams;
      var result = [];
      var matches;

      url = decodeURI(url);

      if (this._baseUrl && url.startsWith(this._baseUrl)) {
        url = url.substr(this._baseUrl.length, url.length);
      }

      blocks.each(this._routes, function (routeMetadata) {
        blocks.each(routeMetadata.regExCollection, function (regEx) {
          if (regEx.regEx.test(url)) {
            matches = regEx.regEx.exec(url);
            while (routeMetadata) {
              result.unshift({
                id: routeMetadata.route._routeString,
                params: getUrlParams(routeMetadata, regEx.params, matches)
              });
              routeMetadata = routeMetadata.parent;
            }
            return false;
          }
        });
      });

      return result.length ? result : null;
    },

    _getUrlParams: function (routeMetadata, params, matches) {
      var route = routeMetadata.route;
      var result = {};
      var value;
      var param;

      blocks.each(params, function (param, index) {
        value = matches[index + 1];
        if (route._validateParam(param, value)) {
          result[param] = route._transfromParam(param, value);
        }
      });

      blocks.each(routeMetadata.data, function (split) {
        param = split.param;
        if (param && !result[param] &&
          blocks.has(route._optional, param) && route._optional[param] !== undefined) {

          result[param] = route._optional[param];
        }
      });

      return result;
    },

    _generateRouteRegEx: function (route, routeData) {
      var result = [];
      var sliceLastFromRegExString = this._sliceLastFromRegExString;
      var combinations = this._getOptionalParametersCombinations(route, routeData);
      var allOptionalBetweenForwardSlash;
      var containsParameter;
      var regExString;
      var params;
      var param;

      blocks.each(combinations, function (skipParameters) {
        regExString = '^';
        params = [];

        blocks.each(routeData, function (split) {
          param = split.param;
          if (param) {
            containsParameter = true;
            if (!blocks.has(route._optional, param) || !skipParameters[param]) {
              allOptionalBetweenForwardSlash = false;
            }
            if (skipParameters[param]) {
              return;
            } else {
              params.push(param);
            }
            if (route._wildcard[param]) {
              regExString += blocks.has(route._optional, param) ? '(.*?)' : '(.+?)';
            } else {
              regExString += blocks.has(route._optional, param) ? '([^\/]*?)' : '([^\/]+?)';
            }
          } else {
            if (split.string == '/') {
              if (containsParameter && allOptionalBetweenForwardSlash) {
                regExString = sliceLastFromRegExString(regExString);
              }
              containsParameter = false;
              allOptionalBetweenForwardSlash = true;
            }
            regExString += escapeRegEx(split.string);
          }
        });

        if (containsParameter && allOptionalBetweenForwardSlash) {
          regExString = sliceLastFromRegExString(regExString);
        }

        result.push({
          regEx: new RegExp(regExString + '$', 'i'),
          params: params
        });
      });

      return result;
    },

    _sliceLastFromRegExString: function (regExString) {
      var index;

      for (var i = 0; i < regExString.length; i++) {
        index = regExString.length - i - 1;
        if (regExString.charAt(index) == '/' && regExString.charAt(index + 1) != ']') {
          break;
        }
      }

      return regExString.substring(0, index - 1);
    },

    _getOptionalParametersCombinations: function (route, routeData) {
      var optionalParameters = this._getOptionalParameters(route, routeData);
      var iterations = Math.pow(2, optionalParameters.length);
      var length = optionalParameters.length;
      var combinations = [{}];
      var current;
      var i;
      var j;

      for (i = 0; i < iterations ; i++) {
        current = {};
        current.__lowestIndex__ = length;
        current.__length__ = 0;
        for (j = 0; j < length; j++) {
          /* jshint bitwise: false */
          if ((i & Math.pow(2, j))) {
            if (j < current.__lowestIndex__) {
              current.__lowestIndex__ = j;
            }
            current[optionalParameters[j]] = true;
            current.__length__ += 1;
          }
        }
        if (current.__length__) {
          combinations.push(current);
        }
      }

      combinations.sort(function (x, y) {
        var result = x.__length__ - y.__length__;

        if (!result) {
          return y.__lowestIndex__ - x.__lowestIndex__;
        }

        return result;
      });

      return combinations;
    },

    _getOptionalParameters: function (route, routeData) {
      var optionalParameters = [];

      blocks.each(routeData, function (split) {
        if (route._optional && split.param && blocks.has(route._optional, split.param)) {
          optionalParameters.push(split.param);
        }
      });

      return optionalParameters;
    },

    _generateRouteStringData: function (routeString) {
      var pushStringData = this._pushStringData;
      var data = [];
      var lastIndex = 0;

      routeString.replace(/{{[^}]+}}/g, function (match, startIndex) {
        pushStringData(data, routeString.substring(lastIndex, startIndex));
        lastIndex = startIndex + match.length;
        data.push({
          param: match.substring(2, match.length - 2)
        });
      });

      if (lastIndex != routeString.length) {
        pushStringData(data, routeString.substring(lastIndex));
      }

      return data;
    },

    _pushStringData: function (data, string) {
      var splits = string.split('/');
      blocks.each(splits, function (split, index) {
        if (split) {
          data.push({
            string: split
          });
        }
        if (index != splits.length - 1) {
          data.push({
            string: '/'
          });
        }
      });
    },
    _setBaseUrl: function (url) {
      if (blocks.isString(url)) {
        if (!url.endsWith('/')) {
          url += '/';
        }
        if(url.startsWith('/')) {
          url = url.substr(1, url.length);
        }
        this._baseUrl = url;
      }
    }
  };

  return Router;
});
