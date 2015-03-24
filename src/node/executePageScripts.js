define([
  '../core'
], function (blocks) {
  var vm = require('vm');
  var fs = require('fs');

  function executePageScripts(browserEnv, html, scripts) {
    var code = '';

    blocks.each(scripts, function (script) {
      code += script.code + ';';
    });

    return executeCode(browserEnv, html, code);
  }


  function executeCode(browserEnv, html, code) {
    var context = vm.createContext(browserEnv.getObject());
    var script = vm.createScript(code);

    blocks.extend(context, {
      server: {
        html: html,
        data: {},
        rendered: '',
        applications: []
      },
      require: require
    });

    script.runInContext(context);

    blocks.each(context.server.applications, function (application) {
      application.start();
    });

    return context.server.rendered;
  }

  return executePageScripts;
});