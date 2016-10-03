define([
  '../query/VirtualElement',
  '../query/VirtualComment',
  '../query/Expression',
  '../var/trimRegExp',
  '../query/var/dataQueryAttr'
], function (VirtualElement, VirtualComment, Expression, trimRegExp, dataQueryAttr) {
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
    var parser = new parse5.SAXParser({
      decodeHtmlEntities: false
    });
    parser.on('doctype', function(name, publicId, systemId /*, [location] */) {
      root.children().push('<!DOCTYPE ' + name + '>');
    });

    parser.on('startTag', function(tagName, attrsArray, selfClosing /*, [location] */) {
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
    });

    parser.on('endTag', function(tagName) {
      var newParent = parent._parent;

      if (parent && parent.tagName() !== tagName.toLowerCase()) {
        //TODO Improve with adding information about the location inside the file.
        console.warn('tag missmatch found closing tag for ' + tagName + ' while expecting to close ' + parent.tagName() + '!');
      }

      if (skip) {
        skip -= 1;
        if (skip === 0) {
          parent._innerHTML = parent.renderChildren();
        }
      }
      if (parent) {
        parent = newParent || root;
      }
    });

    parser.on('text', function(text /*, [location] */) {
      if (parent) {
        if (skip === 0) {
          parent._children.push(Expression.Create(text) || text);
        } else {
          parent._children.push(text);
        }
      }
    });

    parser.on('comment', function(text /*, [location] */) {
      var trimmedComment = text.replace(trimRegExp, '');
      var comment;

      if (trimmedComment.indexOf('blocks') === 0) {
        comment = new VirtualComment(text);
        comment._parent = parent;
        comment._attributes[dataQueryAttr] = trimmedComment.substring(6);
        parent._children.push(comment);
        parent = comment;
      } else if (trimmedComment.indexOf('/blocks') === 0) {
        parent = parent._parent;
      } else {
        parent._children.push('<!--' + text + '-->');
      }
    });

    parser.end(html);

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