define(function () {
  var ampRegEx = /&/g;
  var quotRegEx = /"/g;
  var singleQuoteRegEx = /'/g;
  var lessThanRegEx = /</g;
  var greaterThanRegEx = />/g;
  function escapeValue(value) {
    return String(value)
      .replace(ampRegEx, '&amp;')
      .replace(quotRegEx, '&quot;')
      .replace(singleQuoteRegEx, '&#39;')
      .replace(lessThanRegEx, '&lt;')
      .replace(greaterThanRegEx, '&gt;');
    // return document
    //   .createElement('a')
    //   .appendChild(document.createTextNode(value))
    //     .parentNode
    //     .innerHTML;
  }

  return escapeValue;
});
