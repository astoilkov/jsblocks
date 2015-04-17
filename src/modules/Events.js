define([
  '../core'
], function (blocks) {
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

      once: function (eventNames, callback, thisArg) {
        Events.once(this, eventNames, callback, thisArg);
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

      on: function (object, eventNames, callback, thisArg) {
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
            thisArg: thisArg
          });
        }
      },

      once: function (object, eventNames, callback, thisArg) {
        Events.on(object, eventNames, callback, thisArg);
        Events.on(object, eventNames, function () {
          Events.off(object, eventNames, callback);
        });
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
        var result = true;
        var eventsData;
        var thisArg;
        var args;

        if (object && object._events) {
          eventsData = object._events[eventName];

          if (eventsData && eventsData.length > 0) {
            args = Array.prototype.slice.call(arguments, 2);

            blocks.each(eventsData, function iterateEventsData(eventData) {
              if (eventData) {
                thisArg = object;
                if (eventData.thisArg !== undefined) {
                  thisArg = eventData.thisArg;
                }
                if (eventData.callback.apply(thisArg, args) === false) {
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

  return Events;
});