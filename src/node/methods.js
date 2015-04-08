define([
  '../core',
  './ServerApplication',
], function (blocks, ServerApplication) {
  blocks.server = function (options) {
    return new ServerApplication(options);
  };
});