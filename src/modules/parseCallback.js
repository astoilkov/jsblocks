define(function () {
  function parseCallback(callback, thisArg) {
    //callback = parseExpression(callback);
    if (thisArg != null) {
      var orgCallback = callback;
      callback = function (value, index, collection) {
        return orgCallback.call(thisArg, value, index, collection);
      };
    }
    return callback;
  }

  return parseCallback;
});