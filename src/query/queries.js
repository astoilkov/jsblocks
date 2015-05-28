define([
  '../core',
  '../var/slice',
  '../var/trimRegExp',
  '../modules/keys',
  './var/classAttr',
  './var/queries',
  './addListener',
  './getClassIndex',
  './escapeValue',
  './animation',
  './createFragment',
  './createVirtual',
  './ElementsData',
  './DomQuery',
  './Expression',
  './VirtualElement'
], function (blocks, slice, trimRegExp, keys, classAttr, queries, addListener, getClassIndex, escapeValue, animation, createFragment, createVirtual,
  ElementsData, DomQuery, Expression, VirtualElement) {

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
          element.updateChildren(collection, collection.length, domQuery, this._el);
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
});
