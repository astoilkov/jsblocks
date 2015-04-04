define([
  '../core',
  '../modules/Request',
  '../query/var/dataIdAttr',
  '../query/DomQuery',
  '../query/VirtualElement',
  '../mvc/Application',
  './parseToVirtual'
], function (blocks, Request, dataIdAttr, DomQuery, VirtualElement, Application, parseToVirtual) {
  var eachQuery = blocks.queries.each.preprocess;

  blocks.queries.each.preprocess = function (domQuery, collection) {
    removeDataIds(this);
    server.data[this._attributes[dataIdAttr]] = this.renderChildren();
    eachQuery.call(this, domQuery, collection);
  };

  function removeDataIds(element) {
    var children = element._template || element._children;
    blocks.each(children, function (child) {
      if (VirtualElement.Is(child)) {
        child._attributes['data-id'] = null;
        removeDataIds(child);
      }
    });
  }

  blocks.query = function (model) {
    var domQuery = new DomQuery(model);
    var virtual = blocks.first(parseToVirtual(server.html), function (child) {
      return VirtualElement.Is(child);
    });

    domQuery.pushContext(model);

    blocks.each(virtual.children(), function (child) {
      if (VirtualElement.Is(child)) {
        if (child.tagName() == 'body') {
          child._parent = null;
          server.rendered += child.render(domQuery) + VirtualElement('script').html('window.__blocksServerData__ = ' + JSON.stringify(server.data)).render();
        } else {
          server.rendered += child.render();
        }
      } else {
        server.rendered += child;
      }
    });
  };

  var executeExpressionValue = Expression.Execute;

  Expression.Execute = function (context, elementData, expressionData, entireExpression) {
    var value = executeExpressionValue(context, elementData, expressionData, entireExpression);
    elementData = value.elementData;
    if (elementData) {
      if (expressionData.attributeName) {
        server.data[elementData.id + expressionData.attributeName] =  entireExpression.text;
      } else {
        server.data[elementData.id] = '{{' + expressionData.expression + '}}';
      }
    }

    return value;
  };

  Application.prototype._prepare = function () {
    server.applications.push(this);
  };

  var viewQuery = blocks.queries.view.preprocess;

  blocks.queries.view.preprocess = function (domQuery, view) {
    viewQuery.call(this, domQuery, view);
    if (view._html) {
      this._children = parseToVirtual(view._html);
    }
  };


  var http = require('http');
  var fs = require('fs');
  var path = require('path');
  Request.prototype.execute = function () {
    var url = this.options.url;

    if (blocks.startsWith(url, 'http') || blocks.startsWith(url, 'www')) {

    } else {
      this.callSuccess(fs.readFileSync(path.join(server.options.staticFolder, url), { encoding: 'utf-8'} ));
    }
  };

  Request.prototype._handleFileCallback = function (err, contents) {
    if (err) {
      this.callError(err);
    } else {
      this.callSuccess(contents);
    }
  };

  //var createExpression =
});