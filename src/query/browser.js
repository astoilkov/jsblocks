define([
  '../core'
], function (blocks) {
  var browser = {};

  function parseVersion(matches) {
    if (matches) {
      return parseFloat(matches[1]);
    }
    return undefined;
  }

  if (typeof document !== 'undefined') {
    blocks.extend(browser, {
      IE: document && (function () {
        var version = 3;
        var div = document.createElement('div');
        var iElems = div.getElementsByTagName('i');

        /* jshint noempty: false */
        // Disable JSHint error: Empty block
        // Keep constructing conditional HTML blocks until we hit one that resolves to an empty fragment
        while (
          div.innerHTML = '<!--[if gt IE ' + (++version) + ']><i></i><![endif]-->',
          iElems[0]
          ) { }
        return version > 4 ? version : undefined;
      }()),

      Opera: (window && window.navigator && window.opera && window.opera.version && parseInt(window.opera.version(), 10)) || undefined,

      Safari: window && window.navigator && parseVersion(window.navigator.userAgent.match(/^(?:(?!chrome).)*version\/([^ ]*) safari/i)),

      Firefox: window && window.navigator && parseVersion(window.navigator.userAgent.match(/Firefox\/([^ ]*)/))
    });
  }

  return browser;
});
