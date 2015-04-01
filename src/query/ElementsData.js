define([
  './var/dataIdAttr',
  './VirtualElement'
], function (dataIdAttr, VirtualElement) {
  var ElementsData = (function () {
    var data = {};
    var globalId = 1;
    var freeIds = [];

    function getDataId(element) {
      var result = element ? VirtualElement.Is(element) ? element._attributes[dataIdAttr] :
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
      rawData: data,

      id: function (element) {
        return getDataId(element);
      },

      collectGarbage: function () {
        blocks.each(data, function (value, key) {
          if (value && value.dom && !document.body.contains(value.dom)) {
            ElementsData.clear(value.virtual, true);
          }
        });
      },

      createIfNotExists: function (element) {
        var currentData = data[element && getDataId(element)];
        var id;

        if (!currentData) {
          id = freeIds.pop() || globalId++;
          if (element) {
            setDataId(element, id);
          }

          // if element is not defined then treat it as expression
          if (!element) {
            currentData = data[id] = {
              id: id
            };
          } else {
            currentData = data[id] = {
              id: id,
              virtual: VirtualElement.Is(element) ? element : null,
              animating: 0,
              observables: {},
              preprocess: VirtualElement.Is(element)
            };
          }
        }

        return currentData;
      },

      data: function (element, name, value) {
        var result = data[getDataId(element)];
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
        var id = getDataId(element);
        var currentData = data[id];

        if (currentData && (!currentData.haveData || force)) {
          blocks.each(currentData.observables, function (value) {
            for (var i = 0; i < value._elements.length; i++) {
              if (value._elements[i].elementId == data.id) {
                value._elements.splice(i, 1);
                i--;
              }
            }
          });
          data[id] = undefined;
          //freeIds.push(id);
          if (VirtualElement.Is(element)) {
            element.attr(dataIdAttr, null);
          } else if (element.nodeType == 1) {
            element.removeAttribute(dataIdAttr);
          }
        }
      }
    };
  })();

  return ElementsData;
});
