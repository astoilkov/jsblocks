define([
  '../core',
  './dom',
  './animation',
  './ElementsData'
], function (blocks, dom, animation, ElementsData) {
  function ChunkManager(observable) {
    this.observable = observable;
    this.chunkLengths = {};
    this.dispose();
  }

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

    setChildNodesCount: function (count) {
      if (this.childNodesCount === undefined) {
        this.observableLength = this.observable._getValue().length;
      }
      this.childNodesCount = count - (this.startOffset + this.endOffset);
    },

    chunkLength: function (wrapper) {
      var chunkLengths = this.chunkLengths;
      var id = ElementsData.id(wrapper);
      var length = chunkLengths[id] || (this.childNodesCount || wrapper.childNodes.length) / (this.observableLength || this.observable._getValue().length);
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

    remove: function (index, howMany) {
      var _this = this;

      this.each(function (domElement) {
        for (var j = 0; j < howMany; j++) {
          _this._removeAt(domElement, index);
        }
      });

      ElementsData.collectGarbage();

      this.dispose();

      this.observable._indexes.splice(index, howMany);
    },

    add: function (addItems, index) {
      var _this = this;
      var observable = this.observable;

      blocks.each(addItems, function (item, i) {
        observable._indexes.splice(index + i, 0, blocks.observable(index + i));
      });

      this.each(function (domElement, virtualElement) {
        var domQuery = blocks.domQuery(domElement);
        var context = blocks.context(domElement);
        var html = '';
        var syncIndex;

        domQuery.contextBubble(context, function () {
          syncIndex = domQuery.getSyncIndex();
          for (var i = 0; i < addItems.length; i++) {
            domQuery.dataIndex(blocks.observable.getIndex(observable, i + index, true));
            domQuery.pushContext(addItems[i]);
            html += virtualElement.renderChildren(domQuery, syncIndex + (i + index));
            domQuery.popContext();
            domQuery.dataIndex(undefined);
          }
        });

        if (domElement.childNodes.length === 0) {
          dom.html(domElement, html);
          domQuery.createElementObservableDependencies(domElement.childNodes);
        } else {
          var fragment = domQuery.createFragment(html);
          _this.insertAt(domElement, index, fragment);
        }
      });

      this.dispose();
    },

    each: function (callback) {
      var i = 0;
      var domElements = this.observable._elements;

      for (; i < domElements.length; i++) {
        var data = domElements[i];
        if (!data.element) {
          data.element = ElementsData.data(data.elementId).dom;
        }
        this.setup(data.element, callback);
      }
    },

    setup: function (domElement, callback) {
      if (!domElement) {
        return;
      }

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
        this.setChildNodesCount(commentIndex - this.startIndex);
        callback(domElement.parentNode, element, domElement);
      }
    },

    _removeAt: function (wrapper, index) {
      var chunkLength = this.chunkLength(wrapper);

      animation.remove(
        wrapper,
        chunkLength * index + this.startIndex,
        chunkLength);
    }
  };
});
