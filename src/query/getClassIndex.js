define(function () {
  function getClassIndex(classAttribute, className) {
    if (!classAttribute || typeof classAttribute !== 'string' || className == null) {
      return -1;
    }

    classAttribute = ' ' + classAttribute + ' ';
    return classAttribute.indexOf(' ' + className + ' ');
  }

  return getClassIndex;
});