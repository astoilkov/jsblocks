define(function () {
  function escapeRegEx(string) {
    return string.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
  }

  return escapeRegEx;
});
