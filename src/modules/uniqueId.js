define([
  '../core'
], function (blocks) {
  var uniqueId = (function () {
    var timeStamp = Date.now();
    return function () {
      return 'blocks_' + blocks.version + '_' + timeStamp++;
    };
  })();

  return uniqueId;
});
