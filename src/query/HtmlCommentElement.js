define([
  '../core',
  '../var/trimRegExp',
  './var/dataIdAttr',
  './createFragment',
  './HtmlElement'
], function (blocks, trimRegExp, dataIdAttr, createFragment, HtmlElement) {

  function HtmlCommentElement(commentElement) {
    if (!HtmlCommentElement.prototype.isPrototypeOf(this)) {
      return new HtmlCommentElement(commentElement);
    }

    this._element = commentElement;
  }

  HtmlCommentElement.prototype = blocks.clone(HtmlElement.Empty());

  blocks.extend(HtmlCommentElement.prototype, {
    html: function (html) {
      // var commentElement = this._element.nextSibling;
      // var parentNode = commentElement.parentNode;
      // parentNode.insertBefore(DomQuery.CreateFragment(html), commentElement);
      // parentNode.removeChild(commentElement);
      var commentElement = this._element;
      var parentNode = commentElement.parentNode;
      var currentElement = commentElement.nextSibling;
      var temp;
      var count = 0;

      while (currentElement && (currentElement.nodeType != 8 || currentElement.nodeValue.indexOf('/blocks') == -1)) {
        count++;
        temp = currentElement.nextSibling;
        parentNode.removeChild(currentElement);
        currentElement = temp;
      }

      parentNode.insertBefore(createFragment(html), commentElement.nextSibling);
      //parentNode.removeChild(currentElement);
      return count;
    },

    attr: function (attributeName, attributeValue) {
      if (attributeName == dataIdAttr && attributeValue) {
        var commentElement = this._element;
        var endComment = this._endElement;
        commentElement.nodeValue = ' ' + attributeValue + ':' + commentElement.nodeValue.replace(trimRegExp, '') + ' ';
        endComment.nodeValue = ' ' + attributeValue + ':' + endComment.nodeValue.replace(trimRegExp, '') + ' ';
        return this;
      }
      return this;
    }
  });

  return HtmlCommentElement;
});
