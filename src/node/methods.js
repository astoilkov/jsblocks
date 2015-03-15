define([
  '../core',
  './ServerApplication',
  './Engine'
], function (blocks, ServerApplication, Engine) {
  blocks.serverApplication = function (options) {
    return new ServerApplication(options);
  };

  blocks.createEngine = function (options) {
    return Engine.Create(options);
  };

  blocks.render = function (contents, callback) {
    Engine.RenderContents(contents, callback);
  };

  blocks.renderFile = function (filePath, callback) {
    Engine.RenderFile(filePath, callback);
  };
});