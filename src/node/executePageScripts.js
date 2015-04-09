define([
  '../core'
], function (blocks) {
  var vm = require('vm');
  var fs = require('fs');

  function executePageScripts(env, scripts, callback) {
    var code = '';

    blocks.each(scripts, function (script) {
      code += script.code + ';';
    });

    executeCode(env, code, callback);
  }

  var funcs = {};
  function executeCode(env, code, callback) {
    blocks.extend(this, env);

    blocks.core.deleteApplication();
    ElementsData.reset();

    if (!funcs[code]) {
      // jshint -W054
      // Disable JSHint error: The Function constructor is a form of eval
      funcs[code] = new Function('blocks', 'document', 'window', 'require', code);
    }

    funcs[code].call(this, blocks, env.document, env.window, require);

    var hasRoute = false;
    var hasActive = false;
    var application = server.application;
    application.start();
    blocks.each(application._views, function (view) {
      if (blocks.has(view.options, 'route')) {
        hasRoute = true;
      }
      if (view.isActive()) {
        hasActive = true;
      }
    });

    if (hasRoute && !hasActive) {
      callback('not found', null);
    }

    if (env.server.rendered) {
      callback(null, env.server.rendered);
    } else {
      callback('no query', env.server.html);
    }
  }


  //function executeCode(browserEnv, html, code) {
  //  var context = vm.createContext(browserEnv.getObject());
  //  var script = vm.createScript(code);
  //
  //  blocks.extend(context, {
  //    server: {
  //      html: html,
  //      data: {},
  //      rendered: '',
  //      applications: []
  //    },
  //    require: require
  //  });
  //
  //  script.runInContext(context);
  //
  //  blocks.each(context.server.applications, function (application) {
  //    application.start();
  //  });
  //
  //  return context.server.rendered || html;
  //}

  return executePageScripts;
});