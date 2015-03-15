

  function parseCallback(callback, thisArg) {
    //callback = parseExpression(callback);
    if (thisArg != null) {
      var orgCallback = callback;
      callback = function (value, index, collection) {
        return orgCallback.call(thisArg, value, index, collection);
      };
    }
    return callback;
  }

  var Events = (function () {
    function createEventMethod(eventName) {
      return function (callback, context) {
        if (arguments.length > 1) {
          Events.on(this, eventName, callback, context);
        } else {
          Events.on(this, eventName, callback);
        }
        return this;
      };
    }

    var methods = {
      on: function (eventName, callback, context) {
        if (arguments.length > 2) {
          Events.on(this, eventName, callback, context);
        } else {
          Events.on(this, eventName, callback);
        }
        return this;
      },

      off: function (eventName, callback) {
        Events.off(this, eventName, callback);
      },

      trigger: function (eventName) {
        Events.trigger(this, eventName, blocks.toArray(arguments).slice(1, 100));
      }
    };
    methods._trigger = methods.trigger;

    return {
      register: function (object, eventNames) {
        eventNames = blocks.isArray(eventNames) ? eventNames : [eventNames];
        for (var i = 0; i < eventNames.length; i++) {
          var methodName = eventNames[i];
          if (methods[methodName]) {
            object[methodName] = methods[methodName];
          } else {
            object[methodName] = createEventMethod(methodName);
          }
        }
      },

      on: function (object, eventNames, callback, context) {
        eventNames = blocks.toArray(eventNames).join(' ').split(' ');

        var i = 0;
        var length = eventNames.length;
        var eventName;

        if (!callback) {
          return;
        }

        if (!object._events) {
          object._events = {};
        }
        for (; i < length; i++) {
          eventName = eventNames[i];
          if (!object._events[eventName]) {
            object._events[eventName] = [];
          }
          object._events[eventName].push({
            callback: callback,
            context: context
          });
        }
      },

      off: function (object, eventName, callback) {
        if (blocks.isFunction(eventName)) {
          callback = eventName;
          eventName = undefined;
        }

        if (eventName !== undefined || callback !== undefined) {
          blocks.each(object._events, function (events, currentEventName) {
            if (eventName !== undefined && callback === undefined) {
              object._events[eventName] = [];
            } else {
              blocks.each(events, function (eventData, index) {
                if (eventData.callback == callback) {
                  object._events[currentEventName].splice(index, 1);
                  return false;
                }
              });
            }
          });
        } else {
          object._events = undefined;
        }
      },

      trigger: function (object, eventName) {
        var eventsData;
        var context;
        var result;
        var args;

        if (object && object._events) {
          eventsData = object._events[eventName];

          if (eventsData && eventsData.length > 0) {
            args = Array.prototype.slice.call(arguments, 2);

            blocks.each(eventsData, function iterateEventsData(eventData) {
              if (eventData) {
                context = object;
                if (eventData.context !== undefined) {
                  context = eventData.context;
                }
                if (eventData.callback.apply(context, args) === false) {
                  result = false;
                }
              }
            });
          }
        }

        return result;
      },

      has: function (object, eventName) {
        return !!blocks.access(object, '_events.' + eventName + '.length');
      }
    };
  })();

  // Implementation of blocks.domReady event
  (function () {
    blocks.isDomReady = false;

    //blocks.elementReady = function (element, callback, thisArg) {
    //  callback = parseCallback(callback, thisArg);
    //  if (element) {
    //    callback();
    //  } else {
    //    blocks.domReady(callback);
    //  }
    //};

    blocks.domReady = function (callback, thisArg) {
      if (typeof document == 'undefined' || typeof window == 'undefined') {
        return;
      }

      callback = parseCallback(callback, thisArg);
      if (blocks.isDomReady || document.readyState == 'complete' ||
        (window.__mock__ && document.__mock__) ||
        (window.jQuery && window.jQuery.isReady)) {
        blocks.isDomReady = true;
        callback();
      } else {
        Events.on(blocks.core, 'domReady', callback);
        handleReady();
      }
    };

    function handleReady() {
      if (document.readyState === 'complete') {
        setTimeout(ready);
      } else if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', completed, false);
        window.addEventListener('load', completed, false);
      } else {
        document.attachEvent('onreadystatechange', completed);
        window.attachEvent('onload', completed);

        var top = false;
        try {
          top = window.frameElement == null && document.documentElement;
        } catch (e) { }

        if (top && top.doScroll) {
          (function doScrollCheck() {
            if (!blocks.isDomReady) {
              try {
                top.doScroll('left');
              } catch (e) {
                return setTimeout(doScrollCheck, 50);
              }

              ready();
            }
          })();
        }
      }
    }

    function completed() {
      if (document.addEventListener || event.type == 'load' || document.readyState == 'complete') {
        ready();
      }
    }

    function ready() {
      if (!blocks.isDomReady) {
        blocks.isDomReady = true;
        Events.trigger(blocks.core, 'domReady');
        Events.off(blocks.core, 'domReady');
      }
    }
  })();

    var slice = Array.prototype.slice;

    var trimRegExp = /^\s+|\s+$/gm;


  function keys(array) {
    var result = {};
    blocks.each(array, function (value) {
      result[value] = true;
    });
    return result;
  }
    var classAttr = 'class';

    var queries = (blocks.queries = {});


  var isMouseEventRegEx = /^(?:mouse|pointer|contextmenu)|click/;
  var isKeyEventRegEx = /^key/;

  function returnFalse() {
    return false;
  }

  function returnTrue() {
    return true;
  }

  function Event(e) {
    this.originalEvent = e;
    this.type = e.type;

    this.isDefaultPrevented = e.defaultPrevented ||
        (e.defaultPrevented === undefined &&
        // Support: IE < 9, Android < 4.0
        e.returnValue === false) ?
        returnTrue :
        returnFalse;

    this.timeStamp = e.timeStamp || +new Date();
  }

  Event.PropertiesToCopy = {
    all: 'altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which'.split(' '),
    mouse: 'button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement'.split(' '),
    keyboard: 'char charCode key keyCode'.split(' ')
  };

  Event.CopyProperties = function (originalEvent, event, propertiesName) {
    blocks.each(Event.PropertiesToCopy[propertiesName], function (propertyName) {
      event[propertyName] = originalEvent[propertyName];
    });
  };

  Event.prototype = {
    preventDefault: function () {
        var e = this.originalEvent;

        this.isDefaultPrevented = returnTrue;

        if (e.preventDefault) {
            // If preventDefault exists, run it on the original event
            e.preventDefault();
        } else {
            // Support: IE
            // Otherwise set the returnValue property of the original event to false
            e.returnValue = false;
        }
    },

    stopPropagation: function () {
        var e = this.originalEvent;

        this.isPropagationStopped = returnTrue;

        // If stopPropagation exists, run it on the original event
        if (e.stopPropagation) {
            e.stopPropagation();
        }

        // Support: IE
        // Set the cancelBubble property of the original event to true
        e.cancelBubble = true;
    },

    stopImmediatePropagation: function () {
        var e = this.originalEvent;

        this.isImmediatePropagationStopped = returnTrue;

        if (e.stopImmediatePropagation) {
            e.stopImmediatePropagation();
        }

        this.stopPropagation();
    }
  };

  Event.fix = function (originalEvent) {
    var type = originalEvent.type;
    var event = new Event(originalEvent);

    Event.CopyProperties(originalEvent, event, 'all');

    // Support: IE<9
    // Fix target property (#1925)
    if (!event.target) {
        event.target = originalEvent.srcElement || document;
    }

    // Support: Chrome 23+, Safari?
    // Target should not be a text node (#504, #13143)
    if (event.target.nodeType === 3) {
        event.target = event.target.parentNode;
    }

    // Support: IE<9
    // For mouse/key events, metaKey==false if it's undefined (#3368, #11328)
    event.metaKey = !!event.metaKey;

    if (isMouseEventRegEx.test(type)) {
        Event.fixMouse(originalEvent, event);
    } else if (isKeyEventRegEx.test(type) && event.which == null) {
        Event.CopyProperties(originalEvent, event, 'keyboard');
        // Add which for key events
        event.which = originalEvent.charCode != null ? originalEvent.charCode : originalEvent.keyCode;
    }

    return event;
  };

  Event.fixMouse = function (originalEvent, event) {
    var button = originalEvent.button;
    var fromElement = originalEvent.fromElement;
    var body;
    var eventDoc;
    var doc;

    Event.CopyProperties(originalEvent, event, 'mouse');

    // Calculate pageX/Y if missing and clientX/Y available
    if (event.pageX == null && originalEvent.clientX != null) {
        eventDoc = event.target.ownerDocument || document;
        doc = eventDoc.documentElement;
        body = eventDoc.body;

        event.pageX = originalEvent.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
        event.pageY = originalEvent.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc && doc.clientTop || body && body.clientTop || 0);
    }

    // Add relatedTarget, if necessary
    if (!event.relatedTarget && fromElement) {
        event.relatedTarget = fromElement === event.target ? originalEvent.toElement : fromElement;
    }

    // Add which for click: 1 === left; 2 === middle; 3 === right
    // Note: button is not normalized, so don't use it
    if (!event.which && button !== undefined) {
        /* jshint bitwise: false */
        event.which = (button & 1 ? 1 : (button & 2 ? 3 : (button & 4 ? 2 : 0)));
    }
  };

  //var event = blocks.Event();
  //event.currentTarget = 1; // the current element from which is the event is fired
  //event.namespace = ''; // the namespace for the event

  function addListener(element, eventName, callback) {
    if (element.addEventListener && eventName != 'propertychange') {
      element.addEventListener(eventName, function (event) {
        callback.call(this, Event.fix(event));
      }, false);
    } else if (element.attachEvent) {
      element.attachEvent('on' + eventName, function (event) {
        callback.call(this, Event.fix(event));
      });
    }
  }

  function getClassIndex(classAttribute, className) {
    if (!classAttribute || typeof classAttribute !== 'string' || className == null) {
      return -1;
    }

    classAttribute = ' ' + classAttribute + ' ';
    return classAttribute.indexOf(' ' + className + ' ');
  }

  var ampRegEx = /&/g;
  var quotRegEx = /"/g;
  var singleQuoteRegEx = /'/g;
  var lessThanRegEx = /</g;
  var greaterThanRegEx = />/g;
  function escapeValue(value) {
    return String(value)
      .replace(ampRegEx, '&amp;')
      .replace(quotRegEx, '&quot;')
      .replace(singleQuoteRegEx, '&#39;')
      .replace(lessThanRegEx, '&lt;')
      .replace(greaterThanRegEx, '&gt;');
    // return document
    //   .createElement('a')
    //   .appendChild(document.createTextNode(value))
    //     .parentNode
    //     .innerHTML;
  }
    var dataIdAttr = 'data-id';


  function resolveKeyValue(nameOrObject, value, callback) {
    if (typeof nameOrObject == 'string') {
      callback(nameOrObject, value);
    } else if (blocks.isPlainObject(nameOrObject)) {
      blocks.each(nameOrObject, function (val, key) {
        callback(key, val);
      });
    }
  }

  function createFragment(html) {
    var fragment = document.createDocumentFragment();
    var temp = document.createElement('div');
    var count = 1;
    var table = '<table>';
    var tableEnd = '</table>';
    var tbody = '<tbody>';
    var tbodyEnd = '</tbody>';
    var tr = '<tr>';
    var trEnd = '</tr>';

    html = html.toString();

    if ((html.indexOf('<option') != -1) && html.indexOf('<select') == -1) {
      html = '<select>' + html + '</select>';
      count = 2;
    } else if (html.indexOf('<table') == -1) {
      if (html.match(/<(tbody|thead|tfoot)/)) {
        count = 2;
        html = table + html + tableEnd;
      } else if (html.indexOf('<tr') != -1) {
        count = 3;
        html = table + tbody + html + tbodyEnd + tableEnd;
      } else if (html.match(/<(td|th)/)) {
        count = 4;
        html = table + tbody + tr + html + trEnd + tbodyEnd + tableEnd;
      }
    }


    temp.innerHTML = 'A<div>' + html + '</div>';

    while (count--) {
      temp = temp.lastChild;
    }

    while (temp.firstChild) {
      fragment.appendChild(temp.firstChild);
    }

    return fragment;
  }
    var parameterQueryCache = {};


  var ElementsData = (function () {
    var data = {};
    var globalId = 1;
    var freeIds = [];

    function getDataId(element) {
      var result = element ? VirtualElement.Is(element) ? element._attributes[dataIdAttr] :
        element.nodeType == 1 ? element.getAttribute(dataIdAttr) :
        element.nodeType == 8 ? /\s+(\d+):[^\/]/.exec(element.nodeValue) :
        null :
        null;

      return blocks.isArray(result) ? result[1] : result;
    }

    function setDataId(element, id) {
      if (VirtualElement.Is(element)) {
        element.attr(dataIdAttr, id);
      } else if (element.nodeType == 1) {
        element.setAttribute(dataIdAttr, id);
      }
    }

    return {
      rawData: data,

      id: function (element) {
        return getDataId(element);
      },

      collectGarbage: function () {
        blocks.each(data, function (value, key) {
          if (value && !document.body.contains(value.dom)) {
            data[key] = undefined;
            freeIds.push(key);
          }
        });
      },

      createIfNotExists: function (element) {
        var currentData = data[element && getDataId(element)];
        var id;

        if (!currentData) {
          id = freeIds.pop() || globalId++;
          if (element) {
            setDataId(element, id);
          }

          // if element is not defined then treat it as expression
          if (!element) {
            currentData = data[id] = {
              id: id
            };
          } else {
            currentData = data[id] = {
              id: id,
              virtual: VirtualElement.Is(element) ? element : null,
              animating: 0,
              observables: {},
              preprocess: VirtualElement.Is(element)
            };
          }
        }

        return currentData;
      },

      data: function (element, name, value) {
        var result = data[getDataId(element)];
        if (!result) {
          return;
        }
        if (arguments.length == 1) {
          return result;
        } else if (arguments.length > 2) {
          result[name] = value;
        }
        return result[name];
      },

      clear: function (element, force) {
        var id = getDataId(element);
        if (data[id] && (!data[id].haveData || force)) {
          data[id] = undefined;
          freeIds.push(id);
          if (VirtualElement.Is(element)) {
            element.attr(dataIdAttr, null);
          } else if (element.nodeType == 1) {
            element.removeAttribute(dataIdAttr);
          }
        }
      }
    };
  })();

  var Observer = (function () {
    var stack = [];

    return {
      startObserving: function () {
        stack.push([]);
      },

      stopObserving: function () {
        return stack.pop();
      },

      currentObservables: function () {
        return stack[stack.length - 1];
      },

      registerObservable: function (newObservable) {
        var observables = stack[stack.length - 1];
        var alreadyExists = false;

        if (observables) {
          blocks.each(observables, function (observable) {
            if (observable === newObservable) {
              alreadyExists = true;
              return false;
            }
          });
          if (!alreadyExists) {
            observables.push(newObservable);
          }
        }
      }
    };
  })();

  var Expression = {
    Create: function (text, attributeName, element) {
      var index = -1;
      var endIndex = 0;
      var result = [];
      var character;
      var startIndex;
      var match;

      while (text.length > ++index) {
        character = text.charAt(index);

        if (character == '{' && text.charAt(index + 1) == '{') {
          startIndex = index + 2;
        } else if (character == '}' && text.charAt(index + 1) == '}') {
          if (startIndex) {
            match = text.substring(startIndex, index);
            if (!attributeName) {
              match = match
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, '\'')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>');
            }

            character = text.substring(endIndex, startIndex - 2);
            if (character) {
              result.push(character);
            }

            result.push({
              expression: match,
              attributeName: attributeName
            });

            endIndex = index + 2;
          }
          startIndex = 0;
        }
      }

      character = text.substring(endIndex);
      if (character) {
        result.push(character);
      }

      result.text = text;
      result.attributeName = attributeName;
      result.element = element;
      return match ? result : null;
    },

    GetValue: function (context, elementData, expression) {
      var value = '';

      if (!context) {
        return expression.text;
      }

      blocks.each(expression, function (chunk) {
        if (typeof chunk == 'string') {
          value += chunk;
        } else {
          value += Expression.Execute(context, elementData, chunk, expression).value;
        }
      });

      return value;
    },

    Execute: function (context, elementData, expressionData, entireExpression) {
      var expression = expressionData.expression;
      var attributeName = expressionData.attributeName;
      var observables;
      var result;
      var value;
      var func;

      // jshint -W054
      // Disable JSHint error: The Function constructor is a form of eval
      func = parameterQueryCache[expression] = parameterQueryCache[expression] ||
        new Function('c', 'with(c){with($this){ return ' + expression + '}}');

      Observer.startObserving();

      /* @if DEBUG */ {
        try {
          value = func(context);
        } catch (ex) {
          blocks.debug.expressionFail(expression, entireExpression.element);
        }
      } /* @endif */

      value = func(context);

      result = blocks.unwrap(value);
      result = result == null ? '' : result.toString();
      result = escapeValue(result);

      observables = Observer.stopObserving();

      //for (key in elementData.observables) {
        //  blocks.observable.cache[key]._expressions.push({
        //    length: elementData.length,
        //    element: currentElement,
        //    expression: elementData.expression,
        //    context: elementData.context
        //  });
        //}

      if (blocks.isObservable(value) || observables.length) {
        if (!attributeName) {
          elementData = ElementsData.createIfNotExists();
        }
        if (elementData) {
          elementData.haveData = true;

          blocks.each(observables, function (observable) {
            if (!observable._expressionKeys[elementData.id]) {
              observable._expressionKeys[elementData.id] = true;
              observable._expressions.push({
                length: result.length,
                attr: attributeName,
                context: context,
                elementId: elementData.id,
                expression: expression,
                entire: entireExpression
              });
            }
          });
        }
        if (!attributeName) {
          result = '<!-- ' + elementData.id + ':blocks -->' + result;
        }
      }

      return {
        value: result,
        elementData: elementData
      };
    }
  };

  var browser = {};

  function parseVersion(matches) {
    if (matches) {
      return parseFloat(matches[1]);
    }
    return undefined;
  }

  if (typeof document !== 'undefined') {
    blocks.extend(browser, {
      IE: document && (function () {
        var version = 3;
        var div = document.createElement('div');
        var iElems = div.getElementsByTagName('i');

        /* jshint noempty: false */
        // Disable JSHint error: Empty block
        // Keep constructing conditional HTML blocks until we hit one that resolves to an empty fragment
        while (
          div.innerHTML = '<!--[if gt IE ' + (++version) + ']><i></i><![endif]-->',
          iElems[0]
          ) { }
        return version > 4 ? version : undefined;
      }()),

      Opera: (window && window.navigator && window.opera && window.opera.version && parseInt(window.opera.version(), 10)) || undefined,

      Safari: window && window.navigator && parseVersion(window.navigator.userAgent.match(/^(?:(?!chrome).)*version\/([^ ]*) safari/i)),

      Firefox: window && window.navigator && parseVersion(window.navigator.userAgent.match(/Firefox\/([^ ]*)/))
    });
  }

  function on(element, eventName, handler) {
    if (Workarounds[eventName]) {
      Workarounds[eventName](element, handler, function (eventName, callback) {
        addListener(element, eventName, callback);
      });
    } else {
      addListener(element, eventName, handler);
    }
  }

  var Workarounds = {
    input: function (element, handler, subscribe) {
      var timeout;

      function call(e) {
        clearTimeout(timeout);
        handler(e);
      }

      function deferCall() {
        if (!timeout) {
          timeout = setTimeout(call, 4);
        }
      }

      if (browser.IE < 10) {
        subscribe('propertychange', function (e) {
          if (e.originalEvent.propertyName === 'value') {
            call(e);
          }
        });

        if (browser.IE == 8) {
          subscribe('keyup', call);
          subscribe('keydown', call);
        }
        if (browser.IE >= 8) {
          globalSelectionChangeHandler(element, call);
          subscribe('dragend', deferCall);
        }
      } else {
        subscribe('input', call);

        if (browser.Safari < 7 && element.tagName.toLowerCase() == 'textarea') {
          subscribe('keydown', deferCall);
          subscribe('paste', deferCall);
          subscribe('cut', deferCall);
        } else if (browser.Opera < 11) {
          subscribe('keydown', deferCall);
        } else if (browser.Firefox < 4.0) {
          subscribe('DOMAutoComplete', call);
          subscribe('dragdrop', call);
          subscribe('drop', call);
        }
      }
    }
  };

  var globalSelectionChangeHandler = (function () {
    var isRegistered = false;

    function selectionChangeHandler(e) {
      var element = this.activeElement;
      var handler = element && ElementsData.data(element, 'selectionchange');
      if (handler) {
        handler(e);
      }
    }

    return function (element, handler) {
      if (!isRegistered) {
        addListener(element.ownerDocument, 'selectionchange', selectionChangeHandler);
        isRegistered = true;
      }
      ElementsData.createIfNotExists(element).selectionChange = handler;
    };
  })();

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
        if (html != null) {
          this._innerHTML = html;
          this._children = [];
          this._el.html(html);
        }
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

        if (tagName == 'textarea' && attributeName == 'value') {
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
          value = value == 'none' || value == null || value === false ? 'none' : '';
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

      //executeFormatQueries(this);

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
          html += Expression.GetValue(null, null, child);
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
      if (this._each) {
        this._revertChanges();
        this._trackChanges();
        this._el = HtmlElement.Empty();
      }

      if (this._renderMode != VirtualElement.RenderMode.None && domQuery) {
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

    _createAttributeExpressions: function () {
      var attributeExpressions = this._attributeExpressions;
      var expression;

      blocks.each(this._attributes, function (attributeValue, attributeName) {
        expression = Expression.Create(attributeValue, attributeName);
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

  //function generateStyleValue(style) {
  //  var html = '';
  //  var haveStyle = false;
  //  var key;
  //  var value;
  //
  //  for (key in style) {
  //    value = style[key];
  //    if (value != null) {
  //      haveStyle = true;
  //      key = key.replace(/[A-Z]/g, replaceStyleAttribute);
  //      html += key;
  //      html += ':';
  //      html += value;
  //      html += ';';
  //    }
  //  }
  //  html += '';
  //  return html;
  //}

  function replaceStyleAttribute(match) {
    return '-' + match.toLowerCase();
  }


  var classListMultiArguments = true;
  if (typeof document !== 'undefined') {
    var element = document.createElement('div');
    if (element.classList) {
      element.classList.add('a', 'b');
      classListMultiArguments = element.className == 'a b';
    }
  }

  function setClass(type, element, classNames) {
    if (classNames != null) {
      classNames = blocks.isArray(classNames) ? classNames : classNames.toString().split(' ');
      var i = 0;
      var classAttribute;
      var className;
      var index;

      if (VirtualElement.Is(element)) {
        classAttribute = element._attributes[classAttr];
      } else if (element.classList) {
        if (classListMultiArguments) {
          element.classList[type].apply(element.classList, classNames);
        } else {
          blocks.each(classNames, function (value) {
            element.classList[type](value);
          });
        }
        return;
      } else {
        classAttribute = element.className;
      }
      classAttribute = classAttribute || '';

      for (; i < classNames.length; i++) {
        className = classNames[i];
        index = getClassIndex(classAttribute, className);
        if (type == 'add') {
          if (index < 0) {
            if (classAttribute !== '') {
              className = ' ' + className;
            }
            classAttribute += className;
          }
        } else if (index != -1) {
          classAttribute = (classAttribute.substring(0, index) + ' ' +
          classAttribute.substring(index + className.length + 1, classAttribute.length)).replace(trimRegExp, '');
        }
      }

      if (VirtualElement.Is(element)) {
        element._attributes[classAttr] = classAttribute;
      } else {
        element.className = classAttribute;
      }
    }
  }

  var animation = {
    insert: function (parentElement, index, chunk) {
      index = getIndexOffset(parentElement, index);
      var insertPositionNode = parentElement.childNodes[index];
      var childNodesCount;
      var firstChild;

      blocks.each(chunk, function (node) {
        childNodesCount = node.nodeType == 11 ? node.childNodes.length : 0;
        firstChild = node.childNodes ? node.childNodes[0] : undefined;

        if (insertPositionNode) {
          //checkItemExistance(insertPositionNode);
          parentElement.insertBefore(node, insertPositionNode);
        } else {
          //checkItemExistance(parentElement.childNodes[parentElement.childNodes.length - 1]);
          parentElement.appendChild(node);
        }

        if (childNodesCount) {
          while (childNodesCount) {
            animateDomAction('add', firstChild);
            firstChild = firstChild.nextSibling;
            childNodesCount--;
          }
        } else {
          animateDomAction('add', node);
        }
      });
    },

    remove: function (parentElement, index, count) {
      var i = 0;
      var node;

      index = getIndexOffset(parentElement, index);

      for (; i < count; i++) {
        node = parentElement.childNodes[index];
        if (node) {
          if (animateDomAction('remove', node)) {
            index++;
          }
        }
      }
    },

    setVisibility: function (element, visible) {
      if (visible) {
        animation.show(element);
      } else {
        animation.hide(element);
      }
    },

    show: function (element) {
      animateDomAction('show', element);
    },

    hide: function (element) {
      animateDomAction('hide', element);
    }
  };

  function getIndexOffset(parentElement, index) {
    var elementData = ElementsData.data(parentElement);
    if (elementData && elementData.animating > 0) {
      var childNodes = parentElement.childNodes;
      var childIndex = 0;
      var currentIndex = 0;
      var className;

      while (index != currentIndex) {
        if (!childNodes[childIndex]) {
          return Number.POSITIVE_INFINITY;
        }
        className = childNodes[childIndex].className;
        childIndex++;

        if (getClassIndex(className, 'b-hide') == -1) {
          currentIndex++;
        }
      }

      if (!childNodes[childIndex]) {
        return Number.POSITIVE_INFINITY;
      }

      className = childNodes[childIndex].className;

      while (getClassIndex(className, 'b-hide') != -1) {
        childIndex++;
        if (!childNodes[childIndex]) {
          return Number.POSITIVE_INFINITY;
        }
        className = childNodes[childIndex].className;
      }

      return childIndex;
    }

    return index;
  }

  function animateDomAction(type, element) {
    var animating = false;
    var elementData = ElementsData.createIfNotExists(element);
    var parentElementData = ElementsData.createIfNotExists(element.parentNode);
    var animateCallback = elementData.animateCallback;
    var cssType = type == 'remove' ? 'hide' : type == 'add' ? 'show' : type;
    var disposeCallback = type == 'remove' ? function disposeElement() {
      ElementsData.clear(element, true);
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    } : type == 'hide' ? function hideElement() {
      element.style.display = 'none';
    } : blocks.noop;
    var readyCallback = function () {
      elementData.animating -= 1;
      parentElementData.animating -= 1;
      if (!elementData.animating) {
        disposeCallback();
      }
    };

    if (element.nodeType != 1) {
      disposeCallback();
      return;
    }

    if (cssType == 'show') {
      element.style.display = '';
    }

    if (elementData.preprocess) {
      disposeCallback();
      return;
    }

    if (animateCallback) {
      animating = true;
      elementData.animating += 1;
      parentElementData.animating += 1;
      var context = blocks.context(element);
      var thisArg = context.$view || context.$root;
      animateCallback.call(thisArg, element, readyCallback, cssType);
    }
    return animating || cssAnimate(cssType, element, disposeCallback, readyCallback);
  }

  function cssAnimate(type, element, disposeCallback, readyCallback) {
    if (typeof window == 'undefined' || window.ontransitionend === undefined) {
      disposeCallback();
      return;
    }
    setClass('add', element, 'b-' + type); // this is possible to be moved to a preprocess operation

    var computedStyle = window.getComputedStyle(element);
    var prefix = '';
    var eventName;
    if (window.onanimationend === undefined && window.onwebkitanimationend !== undefined) {
      prefix = '-webkit-';
      eventName = 'webkitAnimationEnd';
    } else {
      eventName = 'animationend';
    }

    var transitionDuration = parseFloat(computedStyle['transition-duration']) || 0;
    var transitionDelay = parseFloat(computedStyle['transition-delay']) || 0;
    var animationDuration = parseFloat(computedStyle[prefix + 'animation-duration']) || 0;
    var animationDelay = parseFloat(computedStyle[prefix + 'animation-delay']) || 0;

    if (transitionDuration <= 0 && transitionDelay <= 0 &&
      animationDuration <= 0 && animationDelay <= 0) {

      setClass('remove', element, 'b-' + type);
      disposeCallback();
      return;
    }

    ElementsData.createIfNotExists(element).animating += 1;
    ElementsData.createIfNotExists(element.parentNode).animating += 1;

    setTimeout(function () {
      setClass('add', element, 'b-' + type + '-end');
      element.addEventListener('transitionend', end, false);
      element.addEventListener(eventName, end, false);
    }, 1);

    function end() {
      setClass('remove', element, 'b-' + type);
      setClass('remove', element, 'b-' + type + '-end');
      readyCallback();
      element.removeEventListener('transitionend', end, false);
      element.removeEventListener(eventName, end, false);
    }

    return true;
  }
    var dataQueryAttr = 'data-query';



  function HtmlCommentElement(commentElement) {
    if (!HtmlCommentElement.prototype.isPrototypeOf(this)) {
      return new HtmlCommentElement(commentElement);
    }

    this._element = commentElement;
  }

  HtmlCommentElement.prototype = blocks.clone(HtmlElement.Empty());

  blocks.extend(HtmlCommentElement.prototype, {
    html: function (html) {
      // var commentElement = this._element.nextSibling;
      // var parentNode = commentElement.parentNode;
      // parentNode.insertBefore(DomQuery.CreateFragment(html), commentElement);
      // parentNode.removeChild(commentElement);
      var commentElement = this._element;
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

    attr: function (attributeName, attributeValue) {
      if (attributeName == dataIdAttr && attributeValue) {
        var commentElement = this._element;
        var endComment = this._endElement;
        commentElement.nodeValue = ' ' + attributeValue + ':' + commentElement.nodeValue.replace(trimRegExp, '') + ' ';
        endComment.nodeValue = ' ' + attributeValue + ':' + endComment.nodeValue.replace(trimRegExp, '') + ' ';
        return this;
      }
      return this;
    }
  });

  function VirtualComment(commentText) {
    if (!VirtualComment.prototype.isPrototypeOf(this)) {
      return new VirtualComment(commentText);
    }

    this.__Class__();

    if (commentText.nodeType == 8) {
      this._commentText = commentText.nodeValue;
      this._el = HtmlCommentElement(commentText);
    } else {
      this._commentText = commentText;
    }
  }

  blocks.VirtualComment = blocks.inherit(VirtualElement, VirtualComment, {
    renderBeginTag: function () {
      var dataId = this._attributes[dataIdAttr];
      var html = '<!-- ';

      if (dataId) {
        html += dataId + ':';
      }
      html += this._commentText.replace(trimRegExp, '') + ' -->';

      return html;
    },

    renderEndTag: function () {
      var dataId = this._attributes[dataIdAttr];
      var html = '<!-- ';

      if (dataId) {
        html += dataId + ':';
      }
      html += '/blocks -->';
      return html;
    },

    _executeAttributeExpressions: blocks.noop
  });

  VirtualComment.Is = function (value) {
    return VirtualComment.prototype.isPrototypeOf(value);
  };

  function createVirtual(htmlElement, parentElement) {
    var elements = [];
    var element;
    var tagName;
    var elementAttributes;
    var htmlAttributes;
    var htmlAttribute;
    var nodeType;
    var commentText;
    var commentTextTrimmed;
    var data;

    while (htmlElement) {
      nodeType = htmlElement.nodeType;
      if (nodeType == 1) {
        // HtmlDomElement
        tagName = htmlElement.tagName.toLowerCase();
        element = new VirtualElement(htmlElement);
        element._tagName = tagName;
        element._parent = parentElement;
        element._haveAttributes = false;
        htmlAttributes = htmlElement.attributes;
        elementAttributes = {};
        for (var i = 0; i < htmlAttributes.length; i++) {
          htmlAttribute = htmlAttributes[i];
          // the style should not be part of the attributes. The style is handled individually.
          if (htmlAttribute.nodeName !== 'style' &&
            (htmlAttribute.specified ||
              //IE7 wil return false for .specified for the "value" attribute - WTF!
            (browser.IE < 8 && htmlAttribute.nodeName == 'value' && htmlAttribute.nodeValue))) {
            elementAttributes[htmlAttribute.nodeName.toLowerCase()] = browser.IE < 11 ? htmlAttribute.nodeValue : htmlAttribute.value;
            element._haveAttributes = true;
          }
        }
        element._attributes = elementAttributes;
        element._createAttributeExpressions();

        if (htmlElement.style.cssText) {
          element._haveStyle = true;
          element._style = generateStyleObject(htmlElement.style.cssText);
        }

        setIsSelfClosing(element);
        if (tagName == 'script' || tagName == 'style' || tagName == 'code' || element.hasClass('bl-skip')) {
          element._innerHTML = htmlElement.innerHTML;
        } else {
          element._children = createVirtual(htmlElement.childNodes[0], element);
        }

        elements.push(element);
      } else if (nodeType == 3) {
        // TextNode
        //if (htmlElement.data.replace(trimRegExp, '').replace(/(\r\n|\n|\r)/gm, '') !== '') {
        //
        //}
        data = escapeValue(htmlElement.data);
        elements.push(Expression.Create(data, null, htmlElement) || data);
      } else if (nodeType == 8) {
        // Comment
        commentText = htmlElement.nodeValue;
        commentTextTrimmed = commentText.replace(trimRegExp, '');
        if (commentTextTrimmed.indexOf('blocks') === 0) {
          element = new VirtualComment(htmlElement);
          element._parent = parentElement;
          element._attributes[dataQueryAttr] = commentTextTrimmed.substring(6);
          data = createVirtual(htmlElement.nextSibling, element);
          element._children = data.elements;
          element._el._endElement = data.htmlElement;
          htmlElement = data.htmlElement || htmlElement;
          elements.push(element);
        } else if (VirtualComment.Is(parentElement) && commentTextTrimmed.indexOf('/blocks') === 0) {
          return {
            elements: elements,
            htmlElement: htmlElement
          };
        } else if (VirtualComment.Is(parentElement)) {
          elements.push('<!--' + commentText + '-->');
        } else if (window.__blocksServerData__) {
          var number = parseInt(/[0-9]+/.exec(commentTextTrimmed), 10);
          if (!blocks.isNaN(number) && window.__blocksServerData__[number]) {
            elements.push(Expression.Create(window.__blocksServerData__[number]));
          }
        } else if (commentTextTrimmed.indexOf('/blocks') !== 0) {
          elements.push('<!--' + commentText + '-->');
        }
      }
      htmlElement = htmlElement.nextSibling;
    }
    return elements;
  }

  function generateStyleObject(styleString) {
    var styles = styleString.split(';');
    var styleObject = {};
    var index;
    var style;
    var values;

    for (var i = 0; i < styles.length; i++) {
      style = styles[i];
      if (style) {
        index = style.indexOf(':');
        if (index != -1) {
          values = [style.substring(0, index), style.substring(index + 1)];
          styleObject[values[0].toLowerCase().replace(trimRegExp, '')] = values[1].replace(trimRegExp, '');
        }
      }
    }

    return styleObject;
  }

  var isSelfClosingCache = {};
  function setIsSelfClosing(element) {
    var tagName = element._tagName;
    var domElement;

    if (isSelfClosingCache[tagName] !== undefined) {
      element._isSelfClosing = isSelfClosingCache[tagName];
      return;
    }
    domElement = document.createElement('div');
    domElement.appendChild(document.createElement(tagName));
    isSelfClosingCache[tagName] = element._isSelfClosing = domElement.innerHTML.indexOf('</') === -1;
  }

  function createProperty(propertyName) {
    return function (value) {
      if (arguments.length === 0) {
        return this[propertyName];
      }
      this[propertyName] = value;
      return this;
    };
  }


  function parseQuery(query, callback) {
    var character = 0;
    var bracketsCount = 0;
    var curlyBracketsCount = 0;
    var squareBracketsCount = 0;
    var isInSingleQuotes = false;
    var isInDoubleQuotes = false;
    var startIndex = 0;
    var parameters = [];
    var currentParameter;
    var methodName;

    query = query || '';

    for (var i = 0; i < query.length; i++) {
      character = query.charAt(i);

      if (!isInSingleQuotes && !isInDoubleQuotes) {
        if (character == '[') {
          squareBracketsCount++;
        } else if (character == ']') {
          squareBracketsCount--;
        } else if (character == '{') {
          curlyBracketsCount++;
        } else if (character == '}') {
          curlyBracketsCount--;
        }
      }

      if (curlyBracketsCount !== 0 || squareBracketsCount !== 0) {
        continue;
      }

      if (character == '\'') {
        isInSingleQuotes = !isInSingleQuotes;
      } else if (character == '"') {
        isInDoubleQuotes = !isInDoubleQuotes;
      }

      if (isInSingleQuotes || isInDoubleQuotes) {
        continue;
      }

      if (character == '(') {
        if (bracketsCount === 0) {
          methodName = query.substring(startIndex, i).replace(trimRegExp, '');
          startIndex = i + 1;
        }
        bracketsCount++;
      } else if (character == ')') {
        bracketsCount--;
        if (bracketsCount === 0) {
          currentParameter = query.substring(startIndex, i).replace(trimRegExp, '');
          if (currentParameter.length) {
            parameters.push(currentParameter);
          }

          if (methodName) {
            methodName = methodName.replace(/^("|')+|("|')+$/g, ''); // trim single and double quotes
            callback(methodName, parameters);
          }
          parameters = [];
          methodName = undefined;
        }
      } else if (character == ',' && bracketsCount == 1) {
        currentParameter = query.substring(startIndex, i).replace(trimRegExp, '');
        if (currentParameter.length) {
          parameters.push(currentParameter);
        }
        startIndex = i + 1;
      } else if (character == '.' && bracketsCount === 0) {
        startIndex = i + 1;
      }
    }
  }

  function DomQuery(options) {
    this._options = options || {};
    this._contextProperties = {};
  }

  DomQuery.QueryCache = {};

  DomQuery.prototype = {
    options: function () {
      return this._options;
    },

    dataIndex: createProperty('_dataIndex'),

    context: createProperty('_context'),

    popContext: function () {
      this._context = this._context.$parentContext;
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
        $parentContext: context || null
      };
      newContext.$context = newContext;
      this._context = newContext;
      this.applyDefinedContextProperties();

      return newContext;
    },

    addProperty: function (name, value) {
      this._contextProperties[name] = value;
      this.applyDefinedContextProperties();
    },

    removeProperty: function (name) {
      delete this._contextProperties[name];
    },

    applyDefinedContextProperties: function () {
      var context = this._context;
      var contextProperties = this._contextProperties;
      var key;

      for (key in contextProperties) {
        context[key] = contextProperties[key];
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
      var cache = DomQuery.QueryCache[query];

      if (!cache) {
        cache = DomQuery.QueryCache[query] = [];

        parseQuery(query, function (methodName, parameters) {
          var method = blocks.queries[methodName];
          var methodObj = {
            name: methodName,
            params: parameters,
            query: methodName + '(' + parameters.join(',') + ')'
          };

          if (method) {
            // TODO: Think of a way to remove this approach
            // TODO: Think about the blocks.queries.with query
            if (methodName == 'attr' || methodName == 'val') {
              cache.unshift(methodObj);
            } else {
              cache.push(methodObj);
            }
          }
          /* @if DEBUG */
          else {
            blocks.debug.queryNotExists(methodObj, element);
          }
          /* @endif */
        });
      }
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
        if (VirtualElement.Is(element) && !method.call && !method.preprocess && method.update) {
          elementData.haveData = true;
          if (!elementData.execute) {
            elementData.execute = [];
          }
          elementData.execute.push(methods[i]);
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
            // TODO: Should throw debug message
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
            virtual._el = HtmlElement(element);
            virtual._fake = true;
          }
          if (method.call === true) {
            virtual[methods[i].name].apply(virtual, executedParameters);
          } else {
            executedParameters.unshift(method.prefix || methods[i].name);
            virtual[method.call].apply(virtual, executedParameters);
          }
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
            elementData.observables[observable.__id__ + method.query] = true;
            observable._elements.push({
              elementId: elementData.id,
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

      if (type == 'checkbox') {
        value(element.checked);
      } else if (tagName == 'select' && element.getAttribute('multiple')) {
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
     * <div data-query="if(true, setClass('success'), setClass('fail'))"></div>
     * <div data-query="if(false, setClass('success'), setClass('fail'))"></div>
     *
     * <!-- will result in -->
     * <div data-query="if(true, setClass('success'), setClass('fail'))" class="fail"></div>
     * <div data-query="if(false, setClass('success'), setClass('fail'))" class="success"></div>
     */
    ifnot: {},

    /**
     * Queries and sets the inner html of the element from the template specified
     *
     * @memberof blocks.queries
     * @param {(HTMLElement|string)} template - The template that will be rendered.
     * The value could be an element id (the element innerHTML property will be taken), string (the template) or
     * an element (again the element innerHTML property will be taken)
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

      preprocess: function (domQuery, template, value) {
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
          this.html(html);
          if (!this._each) {
            this._children = createVirtual(this._el._element.childNodes[0], this);
            this._innerHTML = null;
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
     * @param {string} [name] - Optional name of the new context.
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
     * <div data-query="view(ProfilePage.user, '$user')">
     *  My name is {{$user.name}} and I am {{$this.age}} years old.
     * </div>
     *
     * <!-- will result in -->
     * <div data-query="view(ProfilePage.user, '$user')">
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

          //domQuery.applyContextToElement(this);

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

      preprocess: function (domQuery, collection, name) {
        var element = this;
        var i = 0;
        var rawCollection;
        var elementData;
        var startIndex;
        var staticHtml;
        var maxCount;
        var html;

        element._template = element._template || element._children;

        this._childrenEach = true;

        if (domQuery._serverData) {
          elementData = domQuery._serverData[ElementsData.data(element).id];
          if (elementData) {
            var div = document.createElement('div');
            div.innerHTML = elementData;
            element._template = element._children = createVirtual(div.childNodes[0]);
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

        if (blocks.isArray(rawCollection)) {
          startIndex = startIndex || 0;
          maxCount = maxCount || rawCollection.length;
          for (i = 0; i < rawCollection.length; i++) {
            domQuery.dataIndex(blocks.observable.getIndex(collection, i));
            domQuery.pushContext(rawCollection[i]);
            if (name) {
              blocks.queries.define.preprocess.call(element, domQuery, name, rawCollection[i]);
            }
            html += element.renderChildren(domQuery);
            domQuery.popContext();
            domQuery.dataIndex(undefined);
          }
        } else if (blocks.isObject(rawCollection)) {
          for (var key in rawCollection) {
            domQuery.dataIndex(blocks.observable.getIndex(collection, i));
            domQuery.pushContext(rawCollection[key]);
            html += element.renderChildren(domQuery);
            domQuery.popContext();
            domQuery.dataIndex(undefined);
            i++;
          }
        }

        //element._innerHTML = html + staticHtml.footer;
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
        if (!this._each) {
          throw new Error('render() is supported only in each context');
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
          // TODO: Should use the logic from HtmlElement.prototype.html method
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
    * @param {boolean} [condition=true] - Optional value indicating if the class name will be added or removed. true - add, false - remove.
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
          this.toggleClass(className, condition);
        } else {
          this.addClass(className);
        }
      },

      update: function (className, condition) {
        var virtual = ElementsData.data(this).virtual;
        if (virtual._each) {
          virtual = VirtualElement();
          virtual._el = HtmlElement(this);
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
    * Adds or removes the inner text from an element
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
    * @param {boolean} [condition=true] - Value indicating if the attribute will be set or removed.
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
    * @param {(string|number|Array)} value - The new value for the element.
    * @param {boolean} [condition=true] - Determines if the value will be set or not.
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
    * @param {boolean} [condition=true] - Determines if the element will be checked or not
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
    * @param {boolean} [condition=true] - Determines if the element will be disabled or not
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
      * @param {string} name - The name of the CSS property that will be get, set or removed.
      * @param {string} value - The value of the of the attribute. It will be set if condition is true.
      * @param {boolean} [condition=true] - Condition indicating if the attribute will be set or removed.
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
      * @param {boolean} [condition=true] - Value indicating if the width property will be updated
      */
    width: {
      call: 'css'
    },

    /**
      * Sets the height of the element
      *
      * @memberof blocks.queries
      * @param {number|string} value - The new height of the element
      * @param {boolean} [condition=true] - Value indicating if the height property will be updated
      */
    height: {
      call: 'css'
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
      update: function (events, callbacks, args) {
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

      update: function (callback, data) {
        blocks.queries.on.update.call(this, eventName, callback, data);
      }
    };
  });

    var OBSERVABLE = '__blocks.observable__';


  var ChunkManager = function (observable) {
    this.observable = observable;
    this.chunkLengths = {};
    this.dispose();
  };

  ChunkManager.prototype = {
    dispose: function () {
      this.childNodesCount = undefined;
      this.startIndex = 0;
      this.observableLength = undefined;
      this.startOffset = 0;
      this.endOffset = 0;
    },

    setStartIndex: function (index) {
      this.startIndex = index + this.startOffset;
    },

    // TODO: Explain why we even need this method. Required to fix a bug.
    setChildNodesCount: function (count) {
      if (this.childNodesCount === undefined) {
        this.observableLength = this.observable().length;
      }
      this.childNodesCount = count - (this.startOffset + this.endOffset);
    },

    chunkLength: function (wrapper) {
      var chunkLengths = this.chunkLengths;
      var id = ElementsData.id(wrapper);
      var length = chunkLengths[id] || (this.childNodesCount || wrapper.childNodes.length) / (this.observableLength || this.observable.__value__.length);
      var result;

      if (blocks.isNaN(length) || length === Infinity) {
        result = 0;
      } else {
        result = Math.round(length);
      }

      chunkLengths[id] = result;

      return result;
    },

    getAt: function (wrapper, index) {
      var chunkLength = this.chunkLength(wrapper);
      var childNodes = wrapper.childNodes;
      var result = [];

      for (var i = 0; i < chunkLength; i++) {
        result[i] = childNodes[index * chunkLength + i + this.startIndex];
      }
      return result;
    },

    insertAt: function (wrapper, index, chunk) {
      animation.insert(
        wrapper,
        this.chunkLength(wrapper) * index + this.startIndex,
        blocks.isArray(chunk) ? chunk : [chunk]);
    },

    removeAt: function (wrapper, index) {
      var chunkLength = this.chunkLength(wrapper);
      //var childNode;
      //var i = 0;

      animation.remove(
        wrapper,
        chunkLength * index + this.startIndex,
        chunkLength);

      // TODO: When normalize = false we should ensure there is an empty text node left if there is need for one and there have been one before
      //for (; i < chunkLength; i++) {
      //  childNode = wrapper.childNodes[chunkLength * index + this.startIndex];
      //  if (childNode) {
      //    animateDomAction('remove', childNode);
      //    //ElementsData.clear(childNode, true);
      //    //wrapper.removeChild(childNode);
      //  }
      //}
    },

    removeAll: function () {
      var _this = this;
      var array = this.observable.__value__;

      this.each(function (parent) {
        blocks.each(array, function () {
          _this.removeAt(parent, 0);
        });
      });
    },

    each: function (callback) {
      var i = 0;
      var domElements = this.observable._elements;

      for (; i < domElements.length; i++) {
        var data = domElements[i];
        if (!data.element) {
          data.element = ElementsData.rawData[data.elementId].dom;
        }
        this.setup(data.element, callback);
      }
    },

    setup: function (domElement, callback) {
      var eachData = ElementsData.data(domElement).eachData;
      var element;
      var commentId;
      var commentIndex;
      var commentElement;

      if (!eachData || eachData.id != this.observable.__id__) {
        return;
      }

      element = eachData.element;
      this.startOffset = eachData.startOffset;
      this.endOffset = eachData.endOffset;

      if (domElement.nodeType == 1) {
        // HTMLElement
        this.setStartIndex(0);
        this.setChildNodesCount(domElement.childNodes.length);
        callback(domElement, element, domElement);
      } else {
        // Comment
        commentId = ElementsData.id(domElement);
        commentElement = domElement.parentNode.firstChild;
        commentIndex = 0;
        while (commentElement != domElement) {
          commentElement = commentElement.nextSibling;
          commentIndex++;
        }
        this.setStartIndex(commentIndex + 1);
        while (commentElement && (commentElement.nodeType != 8 || commentElement.nodeValue.indexOf(commentId + ':/blocks') != 1)) {
          commentElement = commentElement.nextSibling;
          commentIndex++;
        }
        this.setChildNodesCount(commentIndex - this.startIndex/* - 1*/);
        callback(domElement.parentNode, element, domElement);
      }
    }
  };



  var observableId = 1;

  /**
  * @namespace blocks.observable
  * @param {*} initialValue -
  * @param {*} [context] -
  * @returns {blocks.observable}
  */
  blocks.observable = function (initialValue, thisArg) {
    var observable = function (value) {
      if (arguments.length === 0) {
        Events.trigger(observable, 'get', observable);
      }

      var currentValue = getObservableValue(observable);

      if (arguments.length === 0) {
        Observer.registerObservable(observable);
        return currentValue;
      } else if (!blocks.equals(value, currentValue, false) && Events.trigger(observable, 'changing', value, currentValue) !== false) {
        if (!observable._dependencyType) {
          if (blocks.isArray(currentValue) && blocks.isArray(value) && observable.removeAll && observable.addMany) {
            observable.removeAll();
            observable.addMany(value);
          } else {
            observable.__value__ = value;
          }
        } else if (observable._dependencyType == 2) {
          observable.__value__.set.call(observable.__context__, value);
        }

        observable.update();

        Events.trigger(observable, 'change', value, currentValue);
      }
      return observable;
    };

    initialValue = blocks.unwrap(initialValue);

    blocks.extend(observable, blocks.observable.fn.base);
    observable.__id__ = observableId++;
    observable.__value__ = initialValue;
    observable.__context__ = thisArg || blocks.__viewInInitialize__ || observable;
    observable._expressionKeys = {};
    observable._expressions = [];
    observable._elementKeys = {};
    observable._elements = [];

    if (blocks.isArray(initialValue)) {
      blocks.extend(observable, blocks.observable.fn.array);
      observable._indexes = [];
      observable._chunkManager = new ChunkManager(observable);
    } else if (blocks.isFunction(initialValue)) {
      observable._dependencyType = 1; // Function dependecy
    } else if (initialValue && blocks.isFunction(initialValue.get) && blocks.isFunction(initialValue.set)) {
      observable._dependencyType = 2; // Custom object
    }

    if (observable._dependencyType) {
      observable._getDependency = blocks.bind(getDependency, observable);
      observable.on('get', observable._getDependency);
    }

    return observable;
  };

  function getDependency() {
    var observable = this;
    var value = observable.__value__;
    var accessor = observable._dependencyType == 1 ? value : value.get;

    Events.off(observable, 'get', observable._getDependency);
    observable._getDependency = undefined;

    Observer.startObserving();
    accessor.call(observable.__context__);
    blocks.each(Observer.stopObserving(), function (dependency) {
      (dependency._dependencies = dependency._dependencies || []).push(observable);
    });
  }

  function getObservableValue(observable) {
    var context = observable.__context__;
    return observable._dependencyType == 1 ? observable.__value__.call(context)
      : observable._dependencyType == 2 ? observable.__value__.get.call(context)
      : observable.__value__;
  }

  blocks.extend(blocks.observable, {
    getIndex: function (observable, index, forceGet) {
      if (!blocks.isObservable(observable)) {
        return blocks.observable(index);
      }
      var indexes = observable._indexes;
      var $index;

      if (indexes) {
        if (indexes.length == observable().length || forceGet) {
          $index = indexes[index];
        } else {
          $index = blocks.observable(index);
          indexes.push($index);
        }
      } else {
        $index = blocks.observable(index);
      }

      return $index;
    },

    fn: {
      base: {
        __identity__: OBSERVABLE,

        /**
         * Updates all elements, expressions and dependencies where the observable is used
         *
         * @memberof blocks.observable
         * @returns {blocks.observable} Returns the observable itself - return this;
         */
        update: function () {
          var elements = this._elements;
          var domQuery;
          var context;
          var element;
          var offset;
          var value;


          // Expression support
          //value = value == null ? '' : value.toString();
          blocks.eachRight(this._expressions, function updateExpression(expression) {
            element = expression.element;
            context = expression.context;

            if (!element) {
              element = expression.element = ElementsData.rawData[expression.elementId].dom;
            }

            try {
              value = blocks.unwrap(parameterQueryCache[expression.expression](context));
            } catch (ex) {
              value = '';
            }

            value = value == null ? '' : value.toString();

            offset = expression.length - value.length;
            expression.length = value.length;

            if (expression.attr) {
              element.setAttribute(expression.attr, Expression.GetValue(context, null, expression.entire));
            } else {
              if (element.nextSibling) {
                element = element.nextSibling;
                element.nodeValue = value + element.nodeValue.substring(expression.length + offset);
              } else {
                element.parentNode.appendChild(document.createTextNode(value));
              }
            }
          });

          for (var i = 0; i < elements.length; i++) {
            value = elements[i];
            element = value.element;
            if (!element) {
              element = value.element = ElementsData.rawData[value.elementId].dom;
            }
            if (document.body.contains(element)) {
              domQuery = blocks.domQuery(element);
              domQuery.context(value.context);
              domQuery.executeMethods(element, value.cache);
              domQuery.context(undefined);
            } else {
              elements.splice(i, 1);
              i -= 1;
            }
          }

          blocks.each(this._dependencies, function updateDependency(dependency) {
            dependency.update();
          });

          blocks.each(this._indexes, function updateIndex(observable, index) {
            observable(index);
          });

          return this;
        },


        on: function (eventName, callback, thisArg) {
          Events.on(this, eventName, callback, thisArg || this.__context__);
          return this;
        },

        /**
         * Extends the current observable with particular functionality depending on the parameters
         * specified. If the method is called without arguments and jsvalue framework is included
         * the observable will be extended with the methods available in jsvalue for the current type
         *
         * @memberof blocks.observable
         * @param {String} [name] -
         * @param {...*} [options]
         * @returns {*} - The result of the extend or the observable itself
         *
         * @example {javascript}
         * blocks.observable.formatter = function () {
         *   // your code here
         * };
         *
         * // extending using the formatter extender
         * var data = blocks.observable([1, 2, 3]).extend('formatter');
         *
         */
        extend: function (name /*, options*/) {
          var extendFunc = blocks.observable[name];
          var result;

          if (arguments.length === 0) {
            if (blocks.core.expressionsCreated) {
              blocks.core.applyExpressions(blocks.type(this()), this);
            }
            return this;
          } else if (extendFunc) {
            result = extendFunc.apply(this, blocks.toArray(arguments).slice(1));
            return blocks.isObservable(result) ? result : this;
          }
        },

        clone: function (cloneValue) {
          var value = this.__value__;
          return blocks.observable(cloneValue ? blocks.clone(value) : value, this.__context__);
        },

        toString: function () {
          var context = this.__context__;
          var value = this._dependencyType == 1 ? this.__value__.call(context)
            : this._dependencyType == 2 ? this.__value__.get.call(context)
            : this.__value__;

          Observer.registerObservable(this);

          if (value != null && blocks.isFunction(value.toString)) {
            return value.toString();
          }
          return String(value);
        }
      },

      /**
       * @memberof blocks.observable
       * @class array
       */
      array: {

        /**
         * Removes all items from the collection and replaces them with the new value provided.
         * The value could be Array, observable array or jsvalue.Array
         *
         * @memberof array
         * @param {Array} value - The new value that will be populated
         * @returns {blocks.observable} - Returns the observable itself - return this;
         *
         * @example {javascript}
         * // creates an observable array with [1, 2, 3] as values
         * var items = blocks.observable([1, 2, 3]);
         *
         * // removes the previous values and fills the observable array with [5, 6, 7] values
         * items.reset([5, 6, 7]);
         */
        reset: function (value) {
          value = blocks.isArray(value) ? value : [];
          return this(value);
        },

        /**
         * Adds values to the end of the observable array
         *
         * @memberof array
         * @param {*} value - The values that will be added to the end of the array
         * @param {number} [index] - Optional index specifying where to insert the value
         * @returns {blocks.observable} - Returns the observable itself - return this;
         *
         * @example {javascript}
         * var items = blocks.observable([1, 2, 3]);
         *
         * // results in observable array with [1, 2, 3, 4] values
         * items.add(4);
         *
         */
        add: function (value, index) {
          this.splice(blocks.isNumber(index) ? index : this.__value__.length, 0, value);

          return this;
        },

        /**
         * Adds the values from the provided array(s) to the end of the collection
         *
         * @memberof array
         * @param {Array} value - The array that will be added to the end of the array
         * @param {number} [index] - Optional position where the array of values to be inserted
         * @returns {blocks.observable} - Returns the observable itself - return this;
         *
         * @example {javascript}
         * var items = blocks.observable([1, 2, 3]);
         *
         * // results in observable array with [1, 2, 3, 4, 5, 6] values
         * items.addMany([4, 5], [6]);
         */
        addMany: function (value, index) {
          this.splice.apply(this, [blocks.isNumber(index) ? index : this.__value__.length, 0].concat(blocks.toArray(value)));
          return this;
        },

        /**
         * Swaps two values in the observable array.
         * Note: Faster than removing the items and adding them at the locations
         *
         * @memberof array
         * @param {number} indexA - The first index that points to the index in the array that will be swapped
         * @param {number} indexB - The second index that points to the index in the array that will be swapped
         * @returns {blocks.observable} - Returns the observable itself - return this;
         *
         * @example {javascript}
         * var items = blocks.observable([4, 2, 3, 1]);
         *
         * // results in observable array with [1, 2, 3, 4] values
         * items.swap(0, 3);
         */
        swap: function (indexA, indexB) {
          var array = this();
          var elements = this._elements;
          var chunkManager = this._chunkManager;
          var element;

          blocks.swap(array, indexA, indexB);

          for (var i = 0; i < elements.length; i++) {
            element = elements[i].element;
            if (indexA > indexB) {
              chunkManager.insertAt(element, indexA, chunkManager.getAt(element, indexB));
              chunkManager.insertAt(element, indexB, chunkManager.getAt(element, indexA));
            } else {
              chunkManager.insertAt(element, indexB, chunkManager.getAt(element, indexA));
              chunkManager.insertAt(element, indexA, chunkManager.getAt(element, indexB));
            }
          }

          return this;
        },

        /**
         * Moves an item from one location to another in the array.
         * Note: Faster than removing the item and adding it at the location
         *
         * @memberof array
         * @param {number} sourceIndex - The index pointing to the item that will be moved
         * @param {number} targetIndex - The index where the item will be moved to
         * @returns {blocks.observable} - Returns the observable itself - return this;
         *
         * @example {javascript}
         * var items = blocks.observable([1, 4, 2, 3, 5]);
         *
         * // results in observable array with [1, 2, 3, 4, 5] values
         * items.move(1, 4);
         */
        move: function (sourceIndex, targetIndex) {
          var array = this();
          var elements = this._elements;
          var chunkManager = this._chunkManager;
          var element;

          blocks.move(array, sourceIndex, targetIndex);

          if (targetIndex > sourceIndex) {
            targetIndex++;
          }

          for (var i = 0; i < elements.length; i++) {
            element = elements[i].element;
            chunkManager.insertAt(element, targetIndex, chunkManager.getAt(element, sourceIndex));
          }

          return this;
        },

        /**
         * Removes an item from the observable array
         *
         * @memberof array
         * @param {[type]}   position [description]
         * @param {Function} callback [description]
         * @returns {blocks.observable} - Returns the observable itself - return this;
         *
         * @example {javascript}
         *
         */
        remove: function (callback, thisArg) {
          return this.removeAll(callback, thisArg, true);
        },

        /**
         * Removes an item at the specified index
         *
         * @memberof array
         * @param {number} index - The index location of the item that will be removed
         * @param {number} [count] - Optional parameter that if specified will remove
         * the next items starting from the specified index
         * @returns {blocks.observable} - Returns the observable itself - return this;
         */
        removeAt: function (index, count) {
          if (!blocks.isNumber(count)) {
            count = 1;
          }
          this.splice(index, count);

          return this;
        },

        /**
         * Removes all items from the observable array and optionally filter which items
         * to be removed by providing a callback
         *
         * @memberof array
         * @param {Function} [callback] - Optional callback function which filters which items
         * to be removed. Returning a truthy value will remove the item and vice versa
         * @param {*}  [thisArg] - Optional this context for the callback function
         * @param {blocks.observable} - Returns the observable itself - return this;
         */
        removeAll: function (callback, thisArg, removeOne) {
          var array = this.__value__;
          var chunkManager = this._chunkManager;
          var items;
          var i;

          if (arguments.length === 0) {
            if (Events.has(this, 'removing') || Events.has(this, 'remove')) {
              items = blocks.clone(array);
            }
            Events.trigger(this, 'removing', {
              type: 'removing',
              items: items,
              index: 0
            });

            chunkManager.removeAll();

            //this._indexes.splice(0, array.length);
            this._indexes = [];
            items = array.splice(0, array.length);
            Events.trigger(this, 'remove', {
              type: 'remove',
              items: items,
              index: 0
            });
          } else {
            var length = array.length;
            var isCallbackAFunction = blocks.isFunction(callback);
            var value;

            for (i = 0; i < length; i++) {
              value = array[i];
              if (value === callback || (isCallbackAFunction && callback.call(thisArg, value, i, array))) {
                this.splice(i, 1);
                i -= 1;
                if (removeOne) {
                  break;
                }
              }
            }
          }

          this.update();

          return this;
        },

        //#region Base

        /**
         * The concat() method is used to join two or more arrays
         *
         * @memberof array
         * @param {...Array} The arrays to be joined
         * @returns {Array} The joined array
         */
        concat: function () {
          var array = this();
          return array.concat.apply(array, blocks.toArray(arguments));
        },

        //
        /**
         * The slice() method returns the selected elements in an array, as a new array object
         *
         * @memberof array
         * @param {number} start An integer that specifies where to start the selection (The first element has an index of 0)
         * @param {number} [end] An integer that specifies where to end the selection. If omitted, all elements from the start
         * position and to the end of the array will be selected. Use negative numbers to select from the end of an array
         * @returns {Array} A new array, containing the selected elements
         */
        slice: function (start, end) {
          if (arguments.length > 1) {
            return this().slice(start, end);
          }
          return this().slice(start);
        },

        /**
         * The join() method joins the elements of an array into a string, and returns the string
         *
         * @memberof array
         * @param {string} [seperator=','] The separator to be used. If omitted, the elements are separated with a comma
         * @returns {string} The array values, separated by the specified separator
         */
        join: function (seperator) {
          if (arguments.length > 0) {
            return this().join(seperator);
          }
          return this().join();
        },

        ///**
        // * The indexOf() method returns the position of the first occurrence of a specified value in a string.
        // * @param {*} item The item to search for.
        // * @param {number} [index=0] Where to start the search. Negative values will start at the given position counting from the end, and search to the end.
        // * @returns {number} The position of the specified item, otherwise -1
        // */
        //indexOf: function (item, index) {
        //    return blocks.indexOf(this(), item, index);
        //},


        ///**
        // * The lastIndexOf() method returns the position of the last occurrence of a specified value in a string.
        // * @param {*} item The item to search for.
        // * @param {number} [index=0] Where to start the search. Negative values will start at the given position counting from the end, and search to the beginning.
        // * @returns {number} The position of the specified item, otherwise -1.
        // */
        //lastIndexOf: function (item, index) {
        //    var array = this();
        //    if (arguments.length > 1) {
        //        return blocks.lastIndexOf(array, item, index);
        //    }
        //    return blocks.lastIndexOf(array, item);
        //},

        //#endregion

        /**
         * The pop() method removes the last element of a observable array, and returns that element
         *
         * @memberof array
         * @returns {*} The removed array item
         */
        pop: function () {
          var that = this;
          var array = that();

          return that.splice(array.length - 1, 1)[0];
        },

        /**
         * The push() method adds new items to the end of the observable array, and returns the new length
         *
         * @memberof array
         * @param {...*} values - The item(s) to add to the observable array
         * @returns {number} The new length of the observable array
         */
        push: function () {
          this.addMany(arguments);
          return this.__value__.length;
        },

        /**
         * Reverses the order of the elements in the observable array
         *
         * @memberof array
         * @returns {Array} The array after it has been reversed
         */
        reverse: function () {
          var array = this().reverse();
          var chunkManager = this._chunkManager;

          this._indexes.reverse();

          chunkManager.each(function (domElement) {
            for (var j = 1; j < array.length; j++) {
              chunkManager.insertAt(domElement, 0, chunkManager.getAt(domElement, j));
            }
          });

          this.update();

          return array;
        },

        /**
         * Removes the first element of a observable array, and returns that element
         *
         * @memberof array
         * @returns {*} The removed array item
         */
        shift: function () {
          return this.splice(0, 1)[0];
          //returns - The removed array item
        },

        /**
         * Sorts the elements of an array
         *
         * @memberof array
         * @param {Function} [sortfunction] - A function that defines the sort order
         * @returns {Array} - The Array object, with the items sorted
         */
        sort: function (sortfunction) {
          var array = this.__value__;
          var length = array.length;
          var useSortFunction = arguments.length > 0;
          var chunkManager = this._chunkManager;
          var indexes = this._indexes;
          var i = 0;
          var j;
          var item;

          for (; i < length; i++) {
            var result = [array[i], i];

            chunkManager.each(function (domElement) {
              result.push(chunkManager.getAt(domElement, i));
            });
            //if (!useSortFunction) { // TODO: Test performance
            //    result.toString = function () { return this[0]; }
            //}
            array[i] = result;
          }

          //if (useSortFunction) { // TODO: Test performance
          //    array.sort(function (a, b) {
          //        return sortfunction.call(this, a[0], b[0])
          //    });
          //}

          // TODO: Test performance (Comment)
          array.sort(function (a, b) {
            a = a[0];
            b = b[0];
            if (useSortFunction) {
              return sortfunction.call(this, a, b);
            }
            if (a < b) {
              return -1;
            }
            if (a > b) {
              return 1;
            }
            return 0;
          });

          if (indexes.length > 0) {
            this._indexes = [];
          }

          for (i = 0; i < length; i++) {
            item = array[i];
            if (indexes.length > 0) {
              this._indexes.push(indexes[item[1]]);
            }

            j = 2;
            chunkManager.each(function (domElement) {
              chunkManager.insertAt(domElement, length, item[j]);
              j++;
            });
            array[i] = item[0];
          }

          this.update();

          //chunkManager.dispose();

          return array;
        },

        /**
         * Adds and/or removes elements from the observable array
         *
         * @memberof array
         * @param {number} index An integer that specifies at what position to add/remove items.
         * Use negative values to specify the position from the end of the array.
         * @param {number} howMany The number of items to be removed. If set to 0, no items will be removed.
         * @param {...*} The new item(s) to be added to the array.
         * @returns {Array} A new array containing the removed items, if any.
         */
        splice: function (index, howMany) {
          var _this = this;
          var array = this.__value__;
          var indexes = this._indexes;
          var chunkManager = this._chunkManager;
          var returnValue = [];
          var args = arguments;
          var addItems;

          index = index < 0 ? array.length - index : index;

          if (howMany && index < array.length && index >= 0) {
            howMany = Math.min(array.length - index, howMany);
            returnValue = array.slice(index, index + howMany);
            Events.trigger(this, 'removing', {
              type: 'removing',
              items: returnValue,
              index: index
            });

            chunkManager.each(function (domElement) {
              for (var j = 0; j < howMany; j++) {
                chunkManager.removeAt(domElement, index);
              }
            });

            ElementsData.collectGarbage();

            indexes.splice(index, howMany);
            returnValue = array.splice(index, howMany);
            Events.trigger(this, 'remove', {
              type: 'remove',
              items: returnValue,
              index: index
            });
            chunkManager.dispose();
          }

          if (args.length > 2) {
            addItems = blocks.toArray(args);
            addItems.splice(0, 2);
            Events.trigger(this, 'adding', {
              type: 'adding',
              index: index,
              items: addItems
            });

            blocks.each(addItems, function (item, i) {
              indexes.splice(index + i, 0, blocks.observable(index + i));
            });

            chunkManager.each(function (domElement, virtualElement) {
              var html = '';
              var length = addItems.length;
              var i = 0;

              var domQuery = blocks.domQuery(domElement);
              domQuery.context(blocks.context(domElement));

              for (; i < length; i++) {
                // TODO: Should be refactored in a method because
                // the same logic is used in the each method
                domQuery.dataIndex(blocks.observable.getIndex(_this, index + i, true));
                domQuery.pushContext(addItems[i]);
                html += virtualElement.renderChildren(domQuery);
                domQuery.popContext();
                domQuery.dataIndex(undefined);
              }

              if (domElement.childNodes.length === 0) {
                (new HtmlElement(domElement)).html(html);
                //domElement.innerHTML = html;
                domQuery.createElementObservableDependencies(domElement.childNodes);
              } else {
                var fragment = domQuery.createFragment(html);
                chunkManager.insertAt(domElement, index, fragment);
              }
            });

            array.splice.apply(array, [index, 0].concat(addItems));
            Events.trigger(this, 'add', {
              type: 'add',
              index: index,
              items: addItems
            });
          }

          // TODO: Explain why this is here. Fixes a bug.
          chunkManager.dispose();

          this.update();
          return returnValue;
        },

        /**
         * The unshift() method adds new items to the beginning of an array, and returns the new length.
         *
         * @memberof array
         * @this {blocks.observable}
         * @param {...*} The new items that will be added to the beginning of the observable array.
         * @returns {number} The new length of the observable array.
         */
        unshift: function () {
          this.addMany(arguments, 0);
          return this.__value__.length;
        }
      }
    }
  });




  /**
   * @memberof blocks.observable
   * @class extenders
   */

  /**
   * Extends the observable by adding a .view property which is filtered
   * based on the provided options
   *
   * @memberof extenders
   * @param  {(Function|Object|String)} options
   * @returns {blocks.observable} - Returns a new observable
   * containing a .view property with the filtered data
   *
   * @example {javascript}
   */
  blocks.observable.filter = function (options) {
    var observable = initExpressionExtender(this);

    observable._operations.push({
      type: 'filter',
      filter: options
    });

    observable.on('add', function (args) {
      if (observable.view._initialized) {
        executeOperations(observable);
      } else {
        observable.view.splice.apply(observable.view, [args.index, 0].concat(args.items));
      }
    });

    observable.on('remove', function (args) {
      if (observable.view._initialized) {
        blocks.each(args.items, function (item) {
          observable.view.remove(item);
        });
      }
    });

    return observable;
  };

  /**
   * Extends the observable by adding a .view property in which the first n
   * items are skipped
   *
   * @memberof extenders
   * @param {(number|blocks.observable)} value - The number of items to be skipped
   * @returns {blocks.observable} - Returns a new observable
   * containing a .view property with the manipulated data
   */
  blocks.observable.skip = function (value) {
    var observable = initExpressionExtender(this);

    observable._operations.push({
      type: 'skip',
      skip: value
    });

    return observable;
  };

  /**
   * Extends the observable by adding a .view property in which there is
   * always maximum n items
   *
   * @memberof extenders
   * @param {(number|blocks.observable))} value - The max number of items to be in the collection
   * @returns {blocks.observable} - Returns a new observable
   * containing a .view property with the manipulated data
   */
  blocks.observable.take = function (value) {
    var observable = initExpressionExtender(this);

    observable._operations.push({
      type: 'take',
      take: value
    });

    return observable;
  };

  /**
   * Extends the observable by adding a .view property which is sorted
   * based on the provided options
   *
   * @memberof extenders
   * @param  {(Function|string)} options -
   * @returns {blocks.observable} - Returns a new observable
   * containing a .view property with the sorted data
   */
  blocks.observable.sort = function (options) {
    var observable = initExpressionExtender(this);

    observable._operations.push({
      type: 'sort',
      sort: options
    });

    return observable;
  };

  function initExpressionExtender(observable) {
    var newObservable = observable.clone();

    newObservable.view = blocks.observable([]);
    newObservable.view._connections = {};
    newObservable._operations = observable._operations ? blocks.clone(observable._operations) : [];
    newObservable._getter = blocks.bind(getter, newObservable);
    newObservable.view._initialized = false;

    newObservable.view.on('get', newObservable._getter);

    return newObservable;
  }

  function getter() {
    var _this = this;

    if (this.__value__.length) {
      Events.off(_this.view, 'get', _this._getter);
      this._getter = undefined;

      Observer.startObserving();
      executeOperations(_this);
      blocks.each(Observer.stopObserving(), function (observable) {
        observable.on('change', function () {
          executeOperations(_this);
        });
      });
      this.view._initialized = true;
    }
  }

  function executeOperations(observable) {
    var chunk = [];
    var executedAtLeastOnce = false;

    blocks.each(observable._operations, function (operation) {
      if (blocks.has(operation, 'sort')) {
        if (chunk.length) {
          executeOperationsChunk(observable, chunk);
          executedAtLeastOnce = true;
        }
        if (blocks.isString(operation.sort)) {
          if (!executedAtLeastOnce) {
            observable.view.addMany(observable.__value__);
          }
          observable.view.sort(function (valueA, valueB) {
            return valueA[operation.sort] - valueB[operation.sort];
          });
        } else if (blocks.isFunction(operation.sort)) {
          if (!executedAtLeastOnce) {
            observable.view.addMany(observable.__value__);
          }
          observable.view.sort(operation.sort);
        } else {
          if (!executedAtLeastOnce) {
            observable.view.addMany(observable.__value__);
          }
          observable.view.sort();
        }
        chunk = [];
      } else {
        chunk.push(operation);
      }
    });

    if (chunk.length) {
      executeOperationsChunk(observable, chunk);
    }
  }

  function executeOperationsChunk(observable, operations) {
    var ADD = 'add';
    var REMOVE = 'remove';
    var EXISTS = 'exists';
    var action = EXISTS;

    var collection = observable.__value__;
    var view = observable.view;
    var connections = view._connections;
    //var initialized = view._initialized;
    var viewIndex = 0;
    var update = view.update;
    var skip = 0;
    var take = collection.length;
    view.update = blocks.noop;

    blocks.each(operations, function (operation) {
      if (operation.type == 'skip') {
        skip = blocks.unwrap(operation.skip);
      } else if (operation.type == 'take') {
        take = blocks.unwrap(operation.take);
      }
    });

    blocks.each(collection, function iterateCollection(value, index) {
      if (take <= 0) {
        while (view().length - viewIndex > 0) {
          connections[view.length - 1] = undefined;
          view.removeAt(view.length - 1);
        }
        return false;
      }
      blocks.each(operations, function executeExtender(operation) {
        var filterCallback = operation.filter;

        action = undefined;

        if (filterCallback) {
          if (filterCallback.call(observable.__context__, value, index, collection)) {
            action = EXISTS;

            if (connections[index] === undefined) {
              action = ADD;
            }
          } else {
            action = undefined;
            if (connections[index] !== undefined) {
              action = REMOVE;
            }
            return false;
          }
        } else if (operation.type == 'skip') {
          action = EXISTS;
          skip -= 1;
          if (skip >= 0) {
            action = REMOVE;
          } else if (skip < 0 && connections[index] === undefined) {
            action = ADD;
          }
          return false;
        } else if (operation.type == 'take') {
          if (take <= 0) {
            action = REMOVE;
            return false;
          } else {
            take -= 1;
            action = EXISTS;

            if (connections[index] === undefined) {
              action = ADD;
            }
          }
        }
      });

      switch (action) {
        case ADD:
          view.splice(viewIndex, 0, value);
          connections[index] = viewIndex;
          viewIndex++;
          break;
        case REMOVE:
          connections[index] = undefined;
          view.removeAt(viewIndex);
          break;
        case EXISTS:
          connections[index] = viewIndex;
          viewIndex++;
          break;
      }
    });

    view.update = update;
    view.update();
  }


  /**
   * Performs a query operation on the DOM. Executes all data-query attributes
   * and renders the html result to the specified HTMLElement if not specified
   * uses document.body by default.
   *
   * @memberof blocks
   * @param {*} model - The model that will be used to query the DOM.
   * @param {HTMLElement} [queryElement=document.body] - Optional element on which to execute the query.
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
  blocks.query = function query(model, queryElement) {
    blocks.domReady(function () {
      blocks.$unwrap(queryElement, function (element) {
        if (!blocks.isElement(element)) {
          element = document.body;
        }

        var domQuery = new DomQuery();
        var rootElement = createVirtual(element)[0];
        var serverData = window.__blocksServerData__;

        domQuery.pushContext(model);
        domQuery._serverData = serverData;

        if (serverData) {
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
   * Gets the associated dataItem for a particlar element. Searches all parents until it finds the context
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


