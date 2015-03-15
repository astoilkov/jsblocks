define([
  './Request'
], function (Request) {
  function ajax(options) {
    if (window) {
      var jQuery = window.jQuery || window.$;
      if (jQuery && jQuery.ajax) {
        jQuery.ajax(options);
      } else {
        Request.Execute(options);
      }
    }
  }

  return ajax;
});