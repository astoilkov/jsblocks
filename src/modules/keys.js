define(function () {
  function keys(array) {
    var result = {};
    blocks.each(array, function (value) {
      result[value] = true;
    });
    return result;
  }

  return keys;
});