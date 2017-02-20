define([
  '../core',
  './var/MODEL'
], function (blocks, MODEL) {
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
    var defaultValue;

    for (key in object) {
      value = object[key];
      if (Property.Is(value)) {
        value = value._options;
        defaultValue = value.defaultValue;
        value.propertyName = key;
        value.isModel = defaultValue && (value.defaultValue.prototype && defaultValue.prototype.__identity__ == MODEL || defaultValue.__identity__ == MODEL);
        if (value.isModel) {
          value.modelConstructor = defaultValue.__identity__ == MODEL ? defaultValue.constructor : defaultValue;
        }
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

    if (options.isModel && !(value instanceof options.modelConstructor)) {
      if (value == options.modelConstructor) {
        value = new options.modelConstructor();
      } else {
        value = new options.modelConstructor(value);
      }
    } else {
      value = blocks.clone(value);
    }

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
