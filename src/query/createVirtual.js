define([
  '../var/trimRegExp',
  './var/dataQueryAttr',
  './escapeValue',
  './browser',
  './Expression',
  './VirtualElement',
  './VirtualComment'
], function (trimRegExp, dataQueryAttr, escapeValue, browser, Expression, VirtualElement, VirtualComment) {
  function createVirtual(htmlElement, parentElement) {
    var elements = [];
    var element;
    var tagName;
    var elementAttributes;
    var htmlAttributes;
    var htmlAttribute;
    var nodeType;
    var commentText;
    var commentTextTrimmed;
    var data;

    while (htmlElement) {
      nodeType = htmlElement.nodeType;
      if (nodeType == 1) {
        // HtmlDomElement
        tagName = htmlElement.tagName.toLowerCase();
        element = new VirtualElement(htmlElement);
        element._tagName = tagName;
        element._parent = parentElement;
        element._haveAttributes = false;
        htmlAttributes = htmlElement.attributes;
        elementAttributes = {};
        for (var i = 0; i < htmlAttributes.length; i++) {
          htmlAttribute = htmlAttributes[i];
          // the style should not be part of the attributes. The style is handled individually.
          if (htmlAttribute.nodeName !== 'style' &&
            (htmlAttribute.specified ||
              //IE7 wil return false for .specified for the "value" attribute - WTF!
            (browser.IE < 8 && htmlAttribute.nodeName == 'value' && htmlAttribute.nodeValue))) {
            elementAttributes[htmlAttribute.nodeName.toLowerCase()] = browser.IE < 11 ? htmlAttribute.nodeValue : htmlAttribute.value;
            element._haveAttributes = true;
          }
        }
        element._attributes = elementAttributes;
        element._createAttributeExpressions();

        if (htmlElement.style.cssText) {
          element._haveStyle = true;
          element._style = generateStyleObject(htmlElement.style.cssText);
        }

        setIsSelfClosing(element);
        if (tagName == 'script' || tagName == 'style' || tagName == 'code' || element.hasClass('bl-skip')) {
          element._innerHTML = htmlElement.innerHTML;
        } else {
          element._children = createVirtual(htmlElement.childNodes[0], element);
        }

        elements.push(element);
      } else if (nodeType == 3) {
        // TextNode
        //if (htmlElement.data.replace(trimRegExp, '').replace(/(\r\n|\n|\r)/gm, '') !== '') {
        //
        //}
        data = escapeValue(htmlElement.data);
        elements.push(Expression.Create(data, null, htmlElement) || data);
      } else if (nodeType == 8) {
        // Comment
        commentText = htmlElement.nodeValue;
        commentTextTrimmed = commentText.replace(trimRegExp, '');
        if (commentTextTrimmed.indexOf('blocks') === 0) {
          element = new VirtualComment(htmlElement);
          element._parent = parentElement;
          element._attributes[dataQueryAttr] = commentTextTrimmed.substring(6);
          data = createVirtual(htmlElement.nextSibling, element);
          element._children = data.elements;
          element._el._endElement = data.htmlElement;
          htmlElement = data.htmlElement || htmlElement;
          elements.push(element);
        } else if (VirtualComment.Is(parentElement) && commentTextTrimmed.indexOf('/blocks') === 0) {
          return {
            elements: elements,
            htmlElement: htmlElement
          };
        } else if (VirtualComment.Is(parentElement)) {
          elements.push('<!--' + commentText + '-->');
        } else if (window.__blocksServerData__) {
          var number = parseInt(/[0-9]+/.exec(commentTextTrimmed), 10);
          if (!blocks.isNaN(number) && window.__blocksServerData__[number]) {
            elements.push(Expression.Create(window.__blocksServerData__[number]));
          }
        } else if (commentTextTrimmed.indexOf('/blocks') !== 0) {
          elements.push('<!--' + commentText + '-->');
        }
      }
      htmlElement = htmlElement.nextSibling;
    }
    return elements;
  }

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

  var isSelfClosingCache = {};
  function setIsSelfClosing(element) {
    var tagName = element._tagName;
    var domElement;

    if (isSelfClosingCache[tagName] !== undefined) {
      element._isSelfClosing = isSelfClosingCache[tagName];
      return;
    }
    domElement = document.createElement('div');
    domElement.appendChild(document.createElement(tagName));
    isSelfClosingCache[tagName] = element._isSelfClosing = domElement.innerHTML.indexOf('</') === -1;
  }

  return createVirtual;
});