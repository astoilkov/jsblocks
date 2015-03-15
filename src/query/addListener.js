define([
  '../modules/Event'
], function (Event) {
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

  return addListener;
});
