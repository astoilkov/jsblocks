define([
  '../modules/keys',
  './on',
  './browser',
  './setClass',
  './animation',
  './createFragment'
], function (keys, on, browser, setClass, animation, createFragment) {
  function HtmlElement(element) {
    if (!HtmlElement.prototype.isPrototypeOf(this)) {
      return new HtmlElement(element);
    }
    this._element = element;
  }

  var Empty;
  HtmlElement.Empty = function () {
    if (!Empty) {
      Empty = {};
      for (var key in HtmlElement.prototype) {
        Empty[key] = blocks.noop;
      }
    }
    return Empty;
  };

  HtmlElement.ValueTagNames = {
   input: true,
   textarea: true,
   select: true
  };

  HtmlElement.ValueTypes = {
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
  };

  HtmlElement.Props = {
   'for': true,
   'class': true,
   value: true,
   checked: true,
   tabindex: true,
   className: true,
   htmlFor: true
  };

  HtmlElement.PropFix = {
   'for': 'htmlFor',
   'class': 'className',
   tabindex: 'tabIndex'
  };

  HtmlElement.AttrFix = {
   className: 'class',
   htmlFor: 'for'
  };

  HtmlElement.prototype = {
   addClass: function (className) {
     setClass('add', this._element, className);
   },

   removeClass: function (className) {
     setClass('remove', this._element, className);
   },

   html: function (html) {
     html = html.toString();
     if (browser.IE < 10) {
       while (this._element.firstChild) {
         this._element.removeChild(this._element.firstChild);
       }
       this._element.appendChild(createFragment(html));
     } else {
       this._element.innerHTML = html;
     }
   },

   attr: function (attributeName, attributeValue) {
     var isProperty = HtmlElement.Props[attributeName];
     var element = this._element;
     attributeName = HtmlElement.PropFix[attributeName.toLowerCase()] || attributeName;

     if (blocks.core.skipExecution &&
       blocks.core.skipExecution.element === element &&
       blocks.core.skipExecution.attributeName == attributeName) {
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

   removeAttr: function (attributeName) {
     this.attr(attributeName, null);
   },

   css: function (name, value) {
     // IE7 will thrown an error if you try to set element.style[''] (with empty string)
     if (!name) {
       return;
     }

     var element = this._element;

     if (name == 'display') {
       animation.setVisibility(element, value == 'none' ? false : true);
     } else {
       element.style[name] = value;
     }
   },

   on: function (eventName, handler) {
     on(this._element, eventName, handler);
   },

   off: function () {

   }
  };

  return HtmlElement;
});
