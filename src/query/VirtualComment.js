define([
  '../core',
  '../var/trimRegExp',
  './var/dataIdAttr',
  './VirtualElement',
  '../modules/Escape'
], function (blocks, trimRegExp, dataIdAttr, VirtualElement, Escape) {
  function VirtualComment(commentText) {
    if (!VirtualComment.prototype.isPrototypeOf(this)) {
      return new VirtualComment(commentText);
    }

    this.__Class__();

    if (commentText.nodeType == 8) {
      this._commentText = commentText.nodeValue;
      this._el = commentText;
    } else {
      this._commentText = commentText;
    }
  }

  blocks.VirtualComment = blocks.inherit(VirtualElement, VirtualComment, {
    renderBeginTag: function () {
      var dataId = this._getAttr(dataIdAttr);
      var html = '<!-- ';

      if (dataId) {
        html += dataId + ':';
      }
      html += Escape.forHTML(this._commentText.replace(trimRegExp, '')) + ' -->';

      return html;
    },

    renderEndTag: function () {
      var dataId = this._getAttr(dataIdAttr);
      var html = '<!-- ';

      if (dataId) {
        html += dataId + ':';
      }
      html += '/blocks -->';
      return html;
    },

    _executeAttributeExpressions: blocks.noop
  });

  VirtualComment.Is = function (value) {
    return VirtualComment.prototype.isPrototypeOf(value);
  };

  return VirtualComment;
});
