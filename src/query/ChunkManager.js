define([
  '../core',
  './animation',
  './ElementsData'
], function (blocks, animation, ElementsData) {
  var ChunkManager = function (observable) {
    this.observable = observable;
    this.chunkLengths = {};
    this.dispose();
  };

  ChunkManager.prototype = {
    dispose: function () {
      this.childNodesCount = undefined;
      this.startIndex = 0;
      this.observableLength = undefined;
      this.startOffset = 0;
      this.endOffset = 0;
    },

    setStartIndex: function (index) {
      this.startIndex = index + this.startOffset;
    },

    // TODO: Explain why we even need this method. Required to fix a bug.
    setChildNodesCount: function (count) {
      if (this.childNodesCount === undefined) {
        this.observableLength = this.observable().length;
      }
      this.childNodesCount = count - (this.startOffset + this.endOffset);
    },

    chunkLength: function (wrapper) {
      var chunkLengths = this.chunkLengths;
      var id = ElementsData.id(wrapper);
      var length = chunkLengths[id] || (this.childNodesCount || wrapper.childNodes.length) / (this.observableLength || this.observable.__value__.length);
      var result;

      if (blocks.isNaN(length) || length === Infinity) {
        result = 0;
      } else {
        result = Math.round(length);
      }

      chunkLengths[id] = result;

      return result;
    },

    getAt: function (wrapper, index) {
      var chunkLength = this.chunkLength(wrapper);
      var childNodes = wrapper.childNodes;
      var result = [];

      for (var i = 0; i < chunkLength; i++) {
        result[i] = childNodes[index * chunkLength + i + this.startIndex];
      }
      return result;
    },

    insertAt: function (wrapper, index, chunk) {
      animation.insert(
        wrapper,
        this.chunkLength(wrapper) * index + this.startIndex,
        blocks.isArray(chunk) ? chunk : [chunk]);
    },

    removeAt: function (wrapper, index) {
      var chunkLength = this.chunkLength(wrapper);
      //var childNode;
      //var i = 0;

      animation.remove(
        wrapper,
        chunkLength * index + this.startIndex,
        chunkLength);

      // TODO: When normalize = false we should ensure there is an empty text node left if there is need for one and there have been one before
      //for (; i < chunkLength; i++) {
      //  childNode = wrapper.childNodes[chunkLength * index + this.startIndex];
      //  if (childNode) {
      //    animateDomAction('remove', childNode);
      //    //ElementsData.clear(childNode, true);
      //    //wrapper.removeChild(childNode);
      //  }
      //}
    },

    removeAll: function () {
      var _this = this;
      var array = this.observable.__value__;

      this.each(function (parent) {
        blocks.each(array, function () {
          _this.removeAt(parent, 0);
        });
      });
    },

    each: function (callback) {
      var i = 0;
      var domElements = this.observable._elements;

      for (; i < domElements.length; i++) {
        var data = domElements[i];
        if (!data.element) {
          data.element = ElementsData.rawData[data.elementId].dom;
        }
        this.setup(data.element, callback);
      }
    },

    setup: function (domElement, callback) {
      var eachData = ElementsData.data(domElement).eachData;
      var element;
      var commentId;
      var commentIndex;
      var commentElement;

      if (!eachData || eachData.id != this.observable.__id__) {
        return;
      }

      element = eachData.element;
      this.startOffset = eachData.startOffset;
      this.endOffset = eachData.endOffset;

      if (domElement.nodeType == 1) {
        // HTMLElement
        this.setStartIndex(0);
        this.setChildNodesCount(domElement.childNodes.length);
        callback(domElement, element, domElement);
      } else {
        // Comment
        commentId = ElementsData.id(domElement);
        commentElement = domElement.parentNode.firstChild;
        commentIndex = 0;
        while (commentElement != domElement) {
          commentElement = commentElement.nextSibling;
          commentIndex++;
        }
        this.setStartIndex(commentIndex + 1);
        while (commentElement && (commentElement.nodeType != 8 || commentElement.nodeValue.indexOf(commentId + ':/blocks') != 1)) {
          commentElement = commentElement.nextSibling;
          commentIndex++;
        }
        this.setChildNodesCount(commentIndex - this.startIndex/* - 1*/);
        callback(domElement.parentNode, element, domElement);
      }
    }
  };
});
