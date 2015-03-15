define([
  '../core',
  './parseToVirtual'
], function (blocks, parseToVirtual) {
  function findPageScripts(html, callback) {
    var virtual = parseToVirtual(html);
    var scripts = [];
    findPageScriptsRecurse(virtual, scripts, true, 0, callback);
  }

  function findPageScriptsRecurse(virtual, scripts, isInitial, filesPending, callback) {
    blocks.each(virtual.children(), function (child) {
      if (!VirtualElement.Is(child)) {
        return;
      }
      var src;

      if (child.tagName() == 'script') {
        src = child.attr('src');
        if (src) {
          src = getScriptPath(src);
          if (blocks.contains(src, 'blocks.js') ||
            (blocks.contains(src, 'blocks-') && blocks.endsWith(src, '.js'))) {
            src = 'blocks-node.js';
          }
          scripts.push({
            type: 'external',
            url: src,
            code: ''
          });

          filesPending++;
          populateScript(scripts[scripts.length - 1], function () {
            filesPending--;
            if (filesPending === 0) {
              callback(scripts);
            }
          });
        } else {
          scripts.push({
            type: 'page',
            code: child.renderChildren()
          });
        }
      }
      findPageScriptsRecurse(child, scripts, false, filesPending, callback);
    });

    //if (filesPending === 0 && isInitial) {
    //  callback(scripts);
    //}
  }

  function populateScript(script, callback) {
    fs.readFile(script.url, { encoding: 'utf-8' }, function (err, code) {
      script.code = code;
      callback();
    });
  }

  function getScriptPath(url) {
    return 'public/' + url;
  }

  return findPageScripts;
});