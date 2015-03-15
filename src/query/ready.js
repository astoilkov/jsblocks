define([
  '../core',
  '../modules/parseCallback',
  '../modules/Events'
], function (blocks, parseCallback, Events) {
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
});
