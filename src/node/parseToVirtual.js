define([
  '../query/VirtualElement'
], function (VirtualElement) {
  var parse5 = require('parse5');

  var selfClosingTags = {
    area: true,
    base: true,
    br: true,
    col: true,
    embed: true,
    hr: true,
    img: true,
    input: true,
    keygen: true,
    link: true,
    menuitem: true,
    meta: true,
    param: true,
    source: true,
    track: true,
    wbr: true
  };

  function parseToVirtual(html) {
    var skip = 0;
    var root = VirtualElement('root');
    var parent = root;
    var parser = new parse5.SimpleApiParser({
      doctype: function(name, publicId, systemId /*, [location] */) {
        root.children().push('<!DOCTYPE ' + name + '>');
      },

      startTag: function(tagName, attrsArray, selfClosing /*, [location] */) {
        var attrs = {};
        var length = attrsArray.length;
        var index = -1;
        while (++index < length) {
          attrs[attrsArray[index].name] = attrsArray[index].value;
        }

        selfClosing = selfClosing || selfClosingTags[tagName];

        var element = VirtualElement(tagName);
        if (parent !== root) {
          element._parent = parent;
        }
        element._attributes = attrs;
        element._isSelfClosing = selfClosing;
        element._haveAttributes = true;
        element._createAttributeExpressions();

        if (attrs.style) {
          element._style = generateStyleObject(attrs.style);
          element._haveStyle = true;
          attrs.style = null;
        }

        if (parent) {
          parent._children.push(element);
        }

        if (!selfClosing) {
          parent = element;
        }

        if (skip) {
          attrs['data-query'] = null;
        }

        if (!selfClosing && (skip || tagName == 'script' || tagName == 'style' || tagName == 'code' || element.hasClass('bl-skip'))) {
          skip += 1;
        }
      },

      endTag: function(tagName /*, [location] */) {
        var newParent = parent._parent;

        if (skip) {
          skip -= 1;
          if (skip === 0) {
            parent._innerHTML = parent.renderChildren();
          }
        }
        if (parent) {
          parent = newParent || root;
        }
      },

      text: function(text /*, [location] */) {
        if (parent) {
          if (skip === 0) {
            parent._children.push(Expression.Create(text) || text);
          } else {
            parent._children.push(text);
          }
        }
      },

      comment: function(text /*, [location] */) {
        //Handle comments here
      }
    }, {
      decodeHtmlEntities: false
    });

    parser.parse(html);

    return root.children();
  }

  // TODO: Refactor this because it is duplicate from query/createVirtual.js file
  function generateStyleObject(styleString) {
    var styles = styleString.split(';');
    var styleObject = {};
    var index;
    var style;
    var values;

    for (var i = 0; i < styles.length; i++) {
      style = styles[i];
      if (style) {
        index = style.indexOf(':');
        if (index != -1) {
          values = [style.substring(0, index), style.substring(index + 1)];
          styleObject[values[0].toLowerCase().replace(trimRegExp, '')] = values[1].replace(trimRegExp, '');
        }
      }
    }

    return styleObject;
  }

  return parseToVirtual;
});