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
    if (!server.data[this._attributes[dataIdAttr]]) {
      removeDataIds(this);
      server.data[this._attributes[dataIdAttr]] = this.renderChildren();
    }

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
    var children = parseToVirtual(server.html);

    domQuery.pushContext(model);

    renderChildren(children, domQuery);
  };

  function renderChildren(children, domQuery) {
    blocks.each(children, function (child) {
      if (VirtualElement.Is(child)) {
        if (child.tagName() == 'body') {
          child._parent = null;
          child.render(domQuery);
          if (server.isReady()) {
            renderBody(child);
          } else {
            server.on('ready', function () {
              renderBody(child);
            });
          }
        } else {
          server.rendered += child.renderBeginTag();
          renderChildren(child.children(), domQuery);
          server.rendered += child.renderEndTag();
        }
      } else {
        server.rendered += child;
      }
    });
  }

  function renderBody(child) {
    server.rendered += child.render() + VirtualElement('script').html('window.__blocksServerData__ = ' + JSON.stringify(server.data)).render();
  }

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
    server.application = this;
  };

  Application.prototype._viewsReady = blocks.noop;

  var viewQuery = blocks.queries.view.preprocess;

  blocks.queries.view.preprocess = function (domQuery, view) {
    viewQuery.call(this, domQuery, view);
    if (view._html && server.application && server.application.options.history == 'pushState') {
      this._children = parseToVirtual(view._html);
    }
  };

  blocks.queries.template.preprocess = function (domQuery, html, value) {
    if (VirtualElement.Is(html)) {
      html = html.html();
    }
    if (html) {
      if (value) {
        blocks.queries['with'].preprocess.call(this, domQuery, value, '$template');
      }
      this.html(html);
      if (!this._each) {
        this._children = parseToVirtual(this.html());
        this._innerHTML = null;
      }
      server.data.templates = server.data.templates || {};
      server.data.templates[ElementsData.id(this)] = true;
    }
  };


  var http = require('http');
  var fs = require('fs');
  var path = require('path');
  Request.prototype.execute = function () {
    var _this = this;
    var url = this.options.url;
    var views;

    if (blocks.startsWith(url, 'http') || blocks.startsWith(url, 'www')) {

    } else {
      url = path.join(server.options.static, url);
      if (this.options.isView) {
        views = server.data.views = server.data.views || {};
        views[url] = true;
        this.callSuccess(fs.readFileSync(url, {encoding: 'utf-8'}));
      } else if (this.options.async === false) {

      } else {
        server.wait();
        fs.readFile(url, { encoding: 'utf-8' }, function (err, contents) {
          if (err) {
            _this.callError(err);
          } else {
            _this.callSuccess(contents);
          }
          server.ready();
        });
      }
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