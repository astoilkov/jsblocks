define([
  '../core',
  './ServerApplication',
], function (blocks, ServerApplication) {
  blocks.serverApplication = function (options) {
    return new ServerApplication(options);
  };

  blocks.middleware = function () {

  };
});