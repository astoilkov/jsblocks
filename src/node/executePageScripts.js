define([
  '../core',
  '../query/ElementsData'
], function (blocks, ElementsData) {
 // var vm = require('vm');

  function executePageScripts(env, scripts, callback) {
    var code = 'with(window) {';

    blocks.each(scripts, function (script) {
      code += script.code + ';';
    });

    code += '}';
    executeCode(env, code, callback);
  }

  var funcs = {};
  function executeCode(env, code, callback) {
    contextBubble(env, function () {
      blocks.core.deleteApplication();
      ElementsData.reset();

      if (!funcs[code]) {
        // jshint -W054
        // Disable JSHint error: The Function constructor is a form of eval
        funcs[code] = new Function('blocks', 'document', 'window', 'require', code);
      }

      funcs[code].call(this, blocks, env.document, env.window, require);

      server.await(function () {
        handleResult(env, callback);
      });
    });
  }

  function contextBubble(obj, callback) {
    var _this = this;
    var values = {};

    blocks.each(obj, function (val, name) {
      values[name] = _this[name];
      _this[name] = val;
    });

    callback();

    server.await(function () {
      blocks.each(obj, function (val, name) {
        _this[name] = values[name];
      });
    }, true);
  }

  function handleResult(env, callback) {
    var hasRoute = false;
    var hasActive = false;
    var application = env.server.application;
    if (application) {
      application._createViews();
      application._startHistory();
      
      server.await(function () {
        blocks.query(application);
        blocks.each(application._views, function (view) {
          if (blocks.has(view.options, 'route')) {
            hasRoute = true;
          }
          if (view.isActive()) {
            hasActive = true;
          }
        });  
      });
    }
    
    server.await(function () {
      if (hasRoute && !hasActive) {
        callback('not found', null);
      }

      if (env.server.rendered) {
        callback(null, env.server.rendered);
      } else {
        callback('no query', env.server.html);
      }
    });
  }


//  function executeCode(browserEnv, html, code) {
//    var context = vm.createContext(browserEnv.getObject());
//    var script = vm.createScript(code);
//  
//    blocks.extend(context, {
//      server: {
//        html: html,
//        data: {},
//        rendered: '',
//        applications: []
//      },
//      require: require
//    });
//  
//    script.runInContext(context);
//  
//    blocks.each(context.server.applications, function (application) {
//      application.start();
//    });
//  
//    return context.server.rendered || html;
//  }

  return executePageScripts;
});