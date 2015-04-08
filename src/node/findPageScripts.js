define([
  '../core',
  './parseToVirtual'
], function (blocks, parseToVirtual) {
  var path = require('path');

  function findPageScripts(virtual, static, callback) {
    var scripts = [];
    var args = {
      filesPending: 0,
      callback: callback,
      static: static
    };
    findPageScriptsRecurse(virtual, scripts, args);
    if (args.filesPending === 0) {
      args.callback([]);
    }
  }

  function findPageScriptsRecurse(virtual, scripts, args) {
    blocks.each(virtual.children(), function (child) {
      if (!VirtualElement.Is(child)) {
        return;
      }
      var src;

      if (child.tagName() == 'script' && (!child.attr('type') || child.attr('type') == 'text/javascript')) {
        src = child.attr('src');
        if (src) {
          src = path.join(args.static, src);
          if (blocks.contains(src, 'blocks') && blocks.endsWith(src, '.js')) {
            src = 'node_modules/blocks/blocks.js';
          }
          scripts.push({
            type: 'external',
            url: src,
            code: ''
          });

          args.filesPending += 1;
          populateScript(scripts[scripts.length - 1], function () {
            args.filesPending -= 1;
            if (args.filesPending === 0) {
              args.callback(scripts);
            }
          });
        } else {
          scripts.push({
            type: 'page',
            code: child.renderChildren()
          });
        }
      }
      findPageScriptsRecurse(child, scripts, args);
    });
  }

  function populateScript(script, callback) {
    fs.readFile(script.url, { encoding: 'utf-8' }, function (err, code) {
      script.code = code;
      callback();
    });
  }

  return findPageScripts;
});