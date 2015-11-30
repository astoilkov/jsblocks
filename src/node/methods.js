define([
  '../core',
  './Server',
  './Middleware'
], function (blocks, Server, Middleware) {
  blocks.server = function (options) {
    return new Server(options);
  };

  blocks.middleware = function (options) {
  	var express = require('express');
  	var path = require('path');
  	// the real middleware
  	var middleware;
  	// array of middlewares to return
  	var middlewares = [];

  	options = blocks.extend({}, Middleware.Defaults, options);
  	middleware = new Middleware(options);

  	// express.static is required as the frontend app needs it's files
  	middlewares.push(express.static(path.resolve(options.static), {
  		index: false
  	}));

  	middlewares.push(blocks.bind(middleware.tryServePage, middleware));

  	// returning array of express middlewares that express will call in that order
  	return middlewares;
  };

  blocks.static = function (options) {
    
  };
});