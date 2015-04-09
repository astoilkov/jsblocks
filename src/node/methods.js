define([
  '../core',
  './Server',
], function (blocks, Server) {
  blocks.server = function (options) {
    return new Server(options);
  };

  blocks.static = function (options) {
    
  };
});