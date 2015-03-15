define([
	'./addListener',
  './browser',
	'./ElementsData'
], function (addListener, browser, ElementsData) {
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

  return on;
});
