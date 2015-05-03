define(function () {
  var ampRegEx = /&/g;
  var lessThanRegEx = /</g;

  function escapeValue(value) {
    return String(value)
      .replace(ampRegEx, '&amp;')
      .replace(lessThanRegEx, '&lt;');
  }

  return escapeValue;
});
