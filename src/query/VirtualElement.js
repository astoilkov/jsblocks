define([
  '../core',
  '../modules/keys',
  './var/classAttr',
  './var/dataIdAttr',
  './getClassIndex',
  './setClass',
  './escapeValue',
  './resolveKeyValue',
  './createFragment',
  './Expression',
  './ElementsData',
  './HtmlElement'
], function (blocks, keys, classAttr, dataIdAttr, getClassIndex, setClass, escapeValue, createFragment,
             Expression, ElementsData, HtmlElement) {

  function VirtualElement(tagName) {
    if (!VirtualElement.prototype.isPrototypeOf(this)) {
      return new VirtualElement(tagName);
    }

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
    this._changes = null;

    if (blocks.isElement(tagName)) {
      this._el = HtmlElement(tagName);
    } else {
      this._el = HtmlElement.Empty();
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

    html: function (html) {
      if (arguments.length > 0) {
        html = html == null ? '' : html;
        this._innerHTML = html;
        this._children = [];
        this._el.html(html);
        return this;
      }
      return this._innerHTML || '';
    },

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

    parent: function () {
      return this._parent;
    },

    children: function (value) {
      if (typeof value === 'number') {
        return this._children[value];
      }
      return this._children;
    },

    // Note!
    // The attributes could be optimized by using array instead of object
    // firstly this could sound insane. However, when generating the html
    // output for each elements the attributes object is looped with for...in
    // loop which is slow because the browser should construct an internal collection
    // to loop for.
    // However, this should be investigated further in order to be sure it is an
    // optimization rather than the opposite
    attr: function (attributeName, attributeValue) {
      var _this = this;
      var returnValue;

      if (typeof attributeName == 'string') {
        var tagName = this._tagName;
        var type = this._attributes.type;
        var rawAttributeValue = attributeValue;
        var elementData = ElementsData.data(this);

        attributeName = blocks.unwrapObservable(attributeName);
        attributeName = HtmlElement.AttrFix[attributeName] || attributeName;
        attributeValue = blocks.unwrapObservable(attributeValue);

        if (blocks.isObservable(rawAttributeValue) && attributeName == 'value' && HtmlElement.ValueTagNames[tagName] && (!type || HtmlElement.ValueTypes[type])) {
          elementData.subscribe = tagName == 'select' ? 'change' : 'input';
          elementData.valueObservable = rawAttributeValue;
        } else if (blocks.isObservable(rawAttributeValue) &&
          attributeName == 'checked' && (type == 'checkbox' || type == 'radio')) {

          elementData.subscribe = 'click';
          elementData.valueObservable = rawAttributeValue;
        }

        if (arguments.length == 1) {
          returnValue = this._attributes[attributeName];
          return returnValue === undefined ? null : returnValue;
        }

        if (attributeName == 'checked' && attributeValue != null && !this._fake) {
          if (this._attributes.type == 'radio' &&
            typeof attributeValue == 'string' &&
            attributeValue != this._attributes.value && this._attributes.value != null) {

            attributeValue = null;
          } else {
            attributeValue = attributeValue ? 'checked' : null;
          }
        } else if (attributeName == 'disabled') {
          attributeValue = attributeValue ? 'disabled' : null;
        }

        if (tagName == 'textarea' && attributeName == 'value' && this._el == HtmlElement.Empty()) {
          this.html(attributeValue);
        } else if (attributeName == 'value' && tagName == 'select') {
          this._values = keys(blocks.toArray(attributeValue));
          this._el.attr(attributeName, attributeValue);
        } else {
          if (this._changes) {
            this._changes.attributes.push([attributeName, this._attributes[attributeName]]);
          }
          this._haveAttributes = true;
          this._attributes[attributeName] = attributeValue;
          this._el.attr(attributeName, attributeValue);
        }
      } else if (blocks.isPlainObject(attributeName)) {
        blocks.each(attributeName, function (val, key) {
          _this.attr(key, val);
        });
      }

      return this;
    },

    removeAttr: function (attributeName) {
      this._attributes[attributeName] = null;
      this._el.removeAttr(attributeName);
      return this;
    },

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
          value = this._style[propertyName];
          return value === undefined ? null : value;
        }

        if (propertyName == 'display') {
          value = value == 'none' || (!value && value !== '') ? 'none' : '';
        }

        if (this._changes) {
          this._changes.styles.push([propertyName, this._style[propertyName]]);
        }
        this._haveStyle = true;
        if (!VirtualElement.CssNumbers[propertyName]) {
          value = blocks.toUnit(value);
        }
        this._style[propertyName] = value;
        this._el.css(propertyName, value);
      } else if (blocks.isPlainObject(propertyName)) {
        blocks.each(propertyName, function (val, key) {
          _this.css(key, val);
        });
      }

      return this;
    },

    addChild: function (element, index) {
      var children = this._template || this._children;
      if (element) {
        element._parent = this;
        if (this._childrenEach || this._each) {
          element._each = true;
        } else if (this._el._element) {
          if (typeof index === 'number') {
            this._el.element.insertBefore(
              createFragment(element.render(blocks.domQuery(this))), this._el.element.childNodes[index]);
          } else {
            this._el._element.appendChild(
              createFragment(element.render(blocks.domQuery(this))));
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

    addClass: function (className) {
      setClass('add', this, className);
      this._el.addClass(className);
      return this;
    },

    removeClass: function (className) {
      setClass('remove', this, className);
      this._el.removeClass(className);
      return this;
    },

    toggleClass: function (className, condition) {
      if (condition === false) {
        this.removeClass(className);
      } else {
        this.addClass(className);
      }
    },

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
        html += generateStyleAttribute(this._style);
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

    render: function (domQuery) {
      var html = '';
      var childHtml = '';
      var htmlElement = this._el;

      this._el = HtmlElement.Empty();

      this._execute(domQuery);

      this._el = htmlElement;

      if (this._renderMode != VirtualElement.RenderMode.None) {
        if (this._renderMode != VirtualElement.RenderMode.ElementOnly) {
          if (this._innerHTML != null) {
            childHtml = this._innerHTML;
          } else {
            childHtml = this.renderChildren(domQuery);
          }
        }

        html += this.renderBeginTag();

        html += childHtml;

        html += this.renderEndTag();
      }

      return html;
    },

    renderChildren: function (domQuery) {
      var html = '';
      var children = this._template || this._children;
      var length = children.length;
      var index = -1;
      var child;

      while (++index < length) {
        child = children[index];
        if (typeof child == 'string') {
          html += child;
        } else if (VirtualElement.Is(child)) {
          child._each = child._each || this._each;
          html += child.render(domQuery);
        } else if (domQuery) {
          html += Expression.GetValue(domQuery._context, null, child);
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

    sync: function (domQuery) {
      this._execute(domQuery);

      var children = this._children;
      var length = children.length;
      var index = -1;
      var htmlElement;
      var lastVirtual;
      var child;

      this.renderBeginTag();

      if (this._innerHTML || this._childrenEach) {
        this.renderEndTag();
        return;
      }

      while (++index < length) {
        child = children[index];
        if (VirtualElement.Is(child)) {
          child._each = child._each || this._each;

          child.sync(domQuery);

          htmlElement = null;
          lastVirtual = child;
        } else if (typeof child != 'string' && domQuery) {
          htmlElement = (htmlElement && htmlElement.nextSibling) || (lastVirtual && lastVirtual._el._element.nextSibling);
          if (!htmlElement) {
            if (this._el._element.nodeType == 1) {
              htmlElement = this._el._element.childNodes[0];
            } else {
              htmlElement = this._el._element.nextSibling;
            }
          }
          if (htmlElement) {
            htmlElement.parentNode.insertBefore(createFragment(Expression.GetValue(domQuery._context, null, child)), htmlElement);
            htmlElement.parentNode.removeChild(htmlElement);
          }
        }
      }

      this.renderEndTag();
    },

    _execute: function (domQuery) {
      if (!domQuery) {
        return;
      }
      if (this._each) {
        this._revertChanges();
        this._trackChanges();
        this._el = HtmlElement.Empty();
      }

      if (this._renderMode != VirtualElement.RenderMode.None) {
        ElementsData.createIfNotExists(this);
        domQuery.applyContextToElement(this);
        this._executeAttributeExpressions(domQuery._context);
        domQuery.executeElementQuery(this);
        ElementsData.clear(this);
      }
    },

    _renderAttributes: function () {
      var attributes = this._attributes;
      var html = '';
      var key;
      var value;

      if (this._tagName == 'option' && this._parent._values) {
        attributes.selected = this._parent._values[attributes.value] ? 'selected' : null;
      }

      for (key in attributes) {
        value = attributes[key];
        if (value === '') {
          html += ' ' + key;
        } else if (value != null) {
          html += ' ' + key + '="' + value + '"';
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
      var element = this._each || HtmlElement.Empty() === this._el ? this : this._el;
      var elementData = ElementsData.data(this);

      blocks.each(this._attributeExpressions, function (expression) {
        element.attr(expression.attributeName, Expression.GetValue(context, elementData, expression));
      });
    },

    _revertChanges: function () {
      if (!this._changes) {
        return;
      }
      var elementStyles = this._style;
      var elementAttributes = this._attributes;
      var changes = this._changes;
      var styles = changes.styles;
      var attributes = changes.attributes;
      var length = Math.max(styles.length, attributes.length);
      var i = length - 1;
      var style;
      var attribute;

      for (; i >= 0; i--) {
        style = styles[i];
        attribute = attributes[i];
        if (style) {
          elementStyles[style[0]] = style[1];
        }
        if (attribute) {
          elementAttributes[attribute[0]] = attribute[1];
        }
      }

      this._attributes[classAttr] = changes[classAttr];
      this._tagName = changes.tagName;
      this._innerHTML = changes.html;
      this._renderMode = VirtualElement.RenderMode.All;
    },

    _trackChanges: function () {
      this._changes = {
        styles: [],
        attributes: [],
        'class': this._attributes[classAttr],
        html: this._innerHTML,
        tagName: this._tagName
      };
    },

    _removeRelation: function () {
      this._el = HtmlElement.Empty();
    }
  });

  VirtualElement.Is = function (value) {
    return VirtualElement.prototype.isPrototypeOf(value);
  };

  VirtualElement.RenderMode = {
    All: 0,
    ElementOnly: 2,
    None: 4
  };

  VirtualElement.CssNumbers = {
    'columnCount': true,
    'fillOpacity': true,
    'flexGrow': true,
    'flexShrink': true,
    'fontWeight': true,
    'lineHeight': true,
    'opacity': true,
    'order': true,
    'orphans': true,
    'widows': true,
    'zIndex': true,
    'zoom': true
  };

  function generateStyleAttribute(style) {
    var html = ' style="';
    var haveStyle = false;
    var key;
    var value;

    for (key in style) {
      value = style[key];
      if (value || value === 0) {
        haveStyle = true;
        key = key.replace(/[A-Z]/g, replaceStyleAttribute);
        html += key;
        html += ':';
        html += value;
        html += ';';
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
