define([
  '../core',
  '../var/trimRegExp',
  '../modules/createProperty',
  './var/parameterQueryCache',
  './var/dataQueryAttr',
  './on',
  './parseQuery',
  './createFragment',
  './ElementsData',
  './Observer',
  './VirtualElement',
  './VirtualComment'
], function (blocks, trimRegExp, createProperty, addEventListener, dataQueryAttr, parameterQueryCache, on, parseQuery, createFragment,
             ElementsData, Observer, VirtualElement, VirtualComment) {
  function DomQuery(options) {
    this._options = options || {};
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
        $parentContext: context || null,
        __props__: blocks.clone(context && context.__props__)
      };
      newContext.$context = newContext;
      this._context = newContext;
      this.applyProperties();

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
      var context = this._context;

      context.__props__ = context.__props__ || {};
      context.__props__[name] = value;
      this.applyProperties();
    },

    applyProperties: function () {
      var properties = this._context.__props__;
      var key;

      for (key in properties) {
        this._context[key] = properties[key];
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
            currentParameter.parameterName = parameter;
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
            // @if DEBUG
            blocks.debug.throwMessage('data-query ' + methods[i].name + ' does not support to be executed as on a comment.', blocks.debug.queries[methods[i].name], 'Error');
            // @endif
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
              element: elementData.dom || elementData.virtual._el,
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

      if (blocks.isArray(value()) && (type == 'checkbox' || type == 'radio')) {
        var unwrapedValue = value();
        if (element.checked) {
          if (unwrapedValue.indexOf(element.value) == -1) {
            value.add(element.value);
          }
        } else if (unwrapedValue.indexOf(element.value) !== -1) {
          value.splice(unwrapedValue.indexOf(element.value), 1);
        }
      } else if (type == 'checkbox') {
        value(element.checked);
      } else if (tagName == 'select' && element.getAttribute('multiple') !== null) {
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
    parseQuery(query, createCacheCallback, {cache: cache, element: element});
    return cache;
  }
  
  function createCacheCallback(methodName, parameters) {
    var method = blocks.queries[methodName];
    var methodObj = {
      name: methodName,
      params: parameters,
      query: methodName + '(' + parameters.join(',') + ')'
    };

    if (method) {
      // TODO: Think of a way to remove this approach
      if (methodName == 'attr' || methodName == 'val') {
        this.cache.unshift(methodObj);
      } else {
        this.cache.push(methodObj);
      }
    }
    /* @if DEBUG */
    else {
      blocks.debug.queryNotExists(methodObj, this.element);
    }
    /* @endif */
  }
  return DomQuery;
});
