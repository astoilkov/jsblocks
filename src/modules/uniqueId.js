define([
  '../core'
], function (blocks) {
  var uniqueId = (function () {
    var timeStamp = Date.now();
    return function () {
      return 'blocks-' + blocks.version + '-' + timeStamp++;
    };
  })();

  return uniqueId;
});