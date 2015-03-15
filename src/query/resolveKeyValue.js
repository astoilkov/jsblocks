define([
  '../core'
], function () {
  function resolveKeyValue(nameOrObject, value, callback) {
    if (typeof nameOrObject == 'string') {
      callback(nameOrObject, value);
    } else if (blocks.isPlainObject(nameOrObject)) {
      blocks.each(nameOrObject, function (val, key) {
        callback(key, val);
      });
    }
  }

  return resolveKeyValue;
});
