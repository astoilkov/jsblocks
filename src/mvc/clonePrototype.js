define([
  './Model',
  './Property'
], function (Model, Property) {
  function clonePrototype(prototype, object) {
    var key;
    var value;

    for (key in prototype) {
      value = prototype[key];
      if (Property.Is(value)) {
        continue;
      }

      if (blocks.isObservable(value)) {
        // clone the observable and also its value by passing true to the clone method
        object[key] = value.clone(true);
        object[key].__context__ = object;
      } else if (blocks.isFunction(value)) {
        object[key] = blocks.bind(value, object);
      } else if (Model.prototype.isPrototypeOf(value)) {
        object[key] = value.clone(true);
      } else if (blocks.isObject(value) && !blocks.isPlainObject(value)) {
        object[key] = blocks.clone(value, true);
      } else {
        object[key] = blocks.clone(value, true);
      }
    }
  }

  return clonePrototype;
});
