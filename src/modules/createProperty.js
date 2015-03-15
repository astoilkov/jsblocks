define(function () {
  function createProperty(propertyName) {
    return function (value) {
      if (arguments.length === 0) {
        return this[propertyName];
      }
      this[propertyName] = value;
      return this;
    };
  }

  return createProperty;
});