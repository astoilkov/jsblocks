define(function () {
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

  return Event;
});
