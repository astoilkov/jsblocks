define([
  '../var/trimRegExp',
  './var/classAttr',
  './getClassIndex',
  './VirtualElement'
], function (trimRegExp, classAttr, getClassIndex, VirtualElement) {

  var classListMultiArguments = true;
  if (typeof document !== 'undefined') {
    var element = document.createElement('div');
    if (element.classList) {
      element.classList.add('a', 'b');
      classListMultiArguments = element.className == 'a b';
    }
  }

  function setClass(type, element, classNames) {
    if (classNames != null) {
      classNames = blocks.isArray(classNames) ? classNames : classNames.toString().split(' ');
      var i = 0;
      var classAttribute;
      var className;
      var index;

      if (VirtualElement.Is(element)) {
        classAttribute = element._getAttr(classAttr);
      } else if (element.classList) {
        if (classListMultiArguments) {
          element.classList[type].apply(element.classList, classNames);
        } else {
          blocks.each(classNames, function (value) {
            element.classList[type](value);
          });
        }
        return;
      } else {
        classAttribute = element.className;
      }
      classAttribute = classAttribute || '';

      for (; i < classNames.length; i++) {
        className = classNames[i];
        index = getClassIndex(classAttribute, className);
        if (type == 'add') {
          if (index < 0) {
            if (classAttribute !== '') {
              className = ' ' + className;
            }
            classAttribute += className;
          }
        } else if (index != -1) {
          classAttribute = (classAttribute.substring(0, index) + ' ' +
          classAttribute.substring(index + className.length + 1, classAttribute.length)).replace(trimRegExp, '');
        }
      }

      if (VirtualElement.Is(element)) {
        if (element._state) {
          element._state.attributes[classAttr] = classAttribute;
        } else {
         element._attributes[classAttr] = classAttribute; 
        }
      } else {
        element.className = classAttribute;
      }
    }
  }

  return setClass;
});
