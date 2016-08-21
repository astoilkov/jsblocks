define([
  './var/dataIdAttr',
  './var/virtualElementIdentity',
  './VirtualElement'
], function (dataIdAttr, virtualElementIdentity, VirtualElement) {
  var ElementsData = (function () {
    var data = {};
    var globalId = 1;

    function getDataId(element) {
      var result = element ? VirtualElement.Is(element) ? element._state ? element._state.attributes[dataIdAttr] : element._attributes[dataIdAttr] :
        element.nodeType == 1 ? element.getAttribute(dataIdAttr) :
          element.nodeType == 8 ? /\s+(\d+):[^\/]/.exec(element.nodeValue) :
            null :
        null;

      return blocks.isArray(result) ? result[1] : result;
    }

    function setDataId(element, id) {
      if (VirtualElement.Is(element)) {
        element.attr(dataIdAttr, id);
      } else if (element.nodeType == 1) {
        element.setAttribute(dataIdAttr, id);
      }
    }

    return {
      id: function (element) {
        return getDataId(element);
      },

      /* @if SERVER */
      reset: function () {
        data = {};
        globalId = 1;
      },
      /* @endif */

      collectGarbage: function () {
        blocks.each(data, function (value) {
          if (value && value.dom && !document.body.contains(value.dom)) {
            ElementsData.clear(value.id, true);
          }
        });
      },

      createIfNotExists: function (element) {
        var isVirtual = element && element.__identity__ == virtualElementIdentity;
        var currentData;
        var id;

        if (isVirtual) {
          currentData = data[element._getAttr(dataIdAttr)];
        } else {
          currentData = data[element && getDataId(element)];
        }

        if (!currentData) {
          id = globalId++;
          if (element) {
            if (isVirtual && element._each) {
              element._haveAttributes = true;
              if (element._state) {
                element._state.attributes[dataIdAttr] = id;
              } else {
                element._attributes[dataIdAttr] = id;
              }
            } else {
              setDataId(element, id);
            }
          }

          // if element is not defined then treat it as expression
          if (!element) {
            currentData = data[id] = {
              id: id,
              observables: {}
            };
          } else {
            currentData = data[id] = {
              id: id,
              virtual: isVirtual ? element : null,
              animating: 0,
              observables: {},
              preprocess: isVirtual
            };
          }
        }

        return currentData;
      },

      byId: function (id) {
        return data[id];
      },

      data: function (element, name, value) {
        var result = data[getDataId(element) || element];
        if (!result) {
          return;
        }
        if (arguments.length == 1) {
          return result;
        } else if (arguments.length > 2) {
          result[name] = value;
        }
        return result[name];
      },

      clear: function (element, force) {
        var id = getDataId(element) || element;
        var currentData = data[id];

        if (currentData && (!currentData.haveData || force)) {
          blocks.each(currentData.observables, function (value) {
            for (var i = 0; i < value._elements.length; i++) {
              if (value._elements[i].elementId == currentData.id) {
                value._elements.splice(i, 1);
                i--;
              }
            }

            if (value._expressionKeys[currentData.id]) {
              for (i = 0; i < value._expressions.length; i++) {
                if (value._expressions[i].elementId == currentData.id) {
                  value._expressions.splice(i, 1);
                  i--;
                }
              }
              value._expressionKeys[currentData.id] = null;
            }
          });
          data[id] = undefined;
          if (VirtualElement.Is(element)) {
            element.removeAttr(dataIdAttr);
          } else if (element.nodeType == 1) {
            element.removeAttribute(dataIdAttr);
          }
        }
      }
    };
  })();

  return ElementsData;
});
