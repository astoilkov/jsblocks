define([
  '../core',
  '../var/hasOwn',
  '../modules/keys',
  './var/virtualElementIdentity',
  './var/classAttr',
  './var/dataIdAttr',
  './var/dataQueryAttr',
  './getClassIndex',
  './setClass',
  './escapeValue',
  './createFragment',
  './dom',
  './Expression',
  './ElementsData'
], function (blocks, hasOwn, keys, virtualElementIdentity, classAttr, dataIdAttr, dataQueryAttr, getClassIndex, setClass, escapeValue, createFragment, dom,
             Expression, ElementsData) {

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
      var element = this._el.nodeType == 8 ? this._el : this._el.childNodes[offset || 0];
      var index = -1;
      var elementForDeletion;
      var deletionCount;
      var fragment;
      var expression;
      var child;
      var lastExpression;

      while (++index < length) {
        child = children[index];
        if (child.isExpression) {
          if (domQuery) {
            expression = Expression.GetValue(domQuery._context, null, child, state ? Expression.NodeWise : Expression.Html);

            if (!state || (state && state.expressions[index] !== expression)) {
              if (state) {
                lastExpression = state.expressions[index];
                state.expressions[index] = expression;
                if (element) {
                  blocks.each(expression, function (value, key) {
                    // skipp comment (= null values) & unchanged nodes
                    if (value == null || element.nodeType == 8 || (blocks.isArray(lastExpression) && lastExpression[key] == value)) {
                      element = element.nextSibling;
                      return;
                    }
                    element.nodeValue = value;
                    element = element.nextSibling;
                  });
                } else {
                  this._el.textContent = expression.join();
                }
              } else {
                fragment = createFragment(expression);
                deletionCount = syncIndex ? child.nodeLength : 1;
                this._el.insertBefore(fragment, element);
                while (deletionCount-- > 0) {
                  elementForDeletion = element;
                  element = element.nextSibling;
                  this._el.removeChild(elementForDeletion);
                }
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
          if (template[index].isExpression && template[index].nodeLength) {
            length += template[index].nodeLength;
          } else {
            length += 1;
          }
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
        if (state && typeof state.attributes.value !== 'undefined') {
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
        if(!attributeValue) {
          // In Serverside rendering, some attributes will be set to null in some cases
          return;
        }

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
          if (isVirtual && !this._state) {
            this._attributes[attributeName] = value;
          } else if (!isVirtual) {
            dom.attr(this._el, attributeName, value);
          }

          if (this._state) {
            this._state.attributes[attributeName] = value;
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

  return VirtualElement;
});
