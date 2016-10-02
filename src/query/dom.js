define([
  '../core',
  '../var/trimRegExp',
  '../modules/keys',
  './var/dataIdAttr',
  './on',
  './browser',
  './setClass',
  './animation',
  './createFragment'
], function (blocks, trimRegExp, keys, dataIdAttr, on, browser, setClass, animation, createFragment) {

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
            element.removeChild(element.firstChild);
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
          if (blocks.isArray(attributeValue)) {
            attributeValue = attributeValue.indexOf(element.value) !== -1;
          } else {
            attributeValue = !!attributeValue;
          }
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

  return blocks.dom;
});
