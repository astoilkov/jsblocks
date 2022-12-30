define([
  '../core',
  './var/dataQueryAttr',
  './var/OBSERVABLE',
  './createVirtual',
  './DomQuery',
  './VirtualElement',
  './ElementsData',
  './serverData',
  './Expression'
], function (blocks, dataQueryAttr, OBSERVABLE, createVirtual, DomQuery, VirtualElement, ElementsData, serverData, Expression) {
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

        domQuery.pushContext(model);

        if (serverData.hasData) {
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
   * Gets the associated dataItem for a particular element. Searches all parents until it finds the context
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

  /**
   * Executes expressions on a specified context.
   *
   * @param  {string} expression The expression to execute.
   * @param  {Object} context    The context to exute the expression on.
   *                             The context for an element can be get via block.context().
   * @param  {Object} [options]  An optional options object.
   * @param  {bool}   [options.raw] If true the function returns an array with the raw value. Default: false
   *
   * @returns {string|Object[]}]  Returns the result of the expressions as a string.
   *                             Or if options.raw is specified it returns an array of objects (see second example for details);
   * @example {javascript}
   * var context = {greeter: blocks.observable("world")};
   * var expression = "Hello {{greeter}}!";
   * blocks.executeExpression(expression, context);
   * // -> "Hello world!"
   *
   * blocks.executeExpression(expression, context, {raw: true});
   * // -> [{observables: [], value: "Hello ", result: "Hello "},
   * //    {observables: [observable<"world">], value: observable<"world">, result: "world"},
   * //    {observable: [], value: "!", result: "!"}]
   */
  blocks.executeExpression = function (expression, context, options) {
    options = options || {};
    var expressionData = Expression.Create(blocks.unwrapObservable(expression));
    var setContext = false;
    var value;
    var values = [];
    context = blocks.unwrapObservable(context);

    if (!blocks.isObject(context)) {
      context = {$this: context};
    } else if (!context.$this) {
      setContext = true;
      context.$this = context;
    }

    value = Expression.GetValue(context, null, expressionData, options.raw ? Expression.Raw : Expression.ValueOnly);

    if (setContext) {
      context.$this = undefined;
    }

    if (options.raw) {
      blocks.each(blocks.toArray(value), function (val, i) {
        values[i] = blocks.isObject(val) ? val : {observables: [], result: val, value: val};
      });
    }

    return options.raw ? values : value;
  };
});
