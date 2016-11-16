define([
  '../core'
], function (blocks) {
  function Property(options) {
    this._options = options || {};
  }

  Property.Is = function (value) {
    return Property.prototype.isPrototypeOf(value);
  };

  Property.Inflate = function (object) {
    var properties = {};
    var key;
    var value;

    for (key in object) {
      value = object[key];
      if (Property.Is(value)) {
        value = value._options;
        value.propertyName = key;
        properties[value.field || key] = value;
      }
    }

    return properties;
  };

  Property.Create = function (options, thisArg, value) {
    var observable;

    if (arguments.length < 3) {
      value = options.value || options.defaultValue;
    }
    thisArg = options.thisArg ? options.thisArg : thisArg;

    observable = blocks
      .observable(value, thisArg)
      .extend('validation', options)
      .on('changing', options.changing, thisArg)
      .on('change', options.change, thisArg);

    if (options.extenders) {
      blocks.each(options.extenders, function (extendee) {
        observable = observable.extend.apply(observable, extendee);
      });
    }

    return observable;
  };

  Property.prototype.extend = function () {
    var options = this._options;
    options.extenders = options.extenders || [];
    options.extenders.push(blocks.toArray(arguments));

    return this;
  };
  return Property;
});
