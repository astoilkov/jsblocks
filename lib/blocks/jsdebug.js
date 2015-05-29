
var customTypes = {};

blocks.debug = {
  enabled: true,

  enable: function () {
    blocks.debug.enabled = true;
  },

  disable: function () {
    blocks.debug.enabled = false;
  },

  addType: function (name, checkCallback) {
    customTypes[name.toLowerCase()] = checkCallback;
  },

  checkArgs: debugFunc(function (method, args, options) {
    if (!blocks.debug.enabled) {
      return;
    }
    if (!options) {
      return;
    }
    var errors = checkMethod(method, args);

    if (errors.length === 0) {
      return;
    }

    blocks.debug.printErrors(method, args, options, errors);
  }),

  printErrors: function (method, args, options, errors) {
    if (!blocks.debug.enabled) {
      return;
    }
    var message = new ConsoleMessage();
    var one = errors.length === 1;
    var firstError = errors[0];

    if (one) {
      message.beginCollapsedGroup();
    } else {
      message.beginGroup();
    }

    message
      .addSpan('Arguments mismatch:', { background: 'yellow'})
      .addText(' ');

    if (one) {
      addError(message, firstError, method, options.paramsNames);
      tryInsertElement(message, options.element);
      addMethodReference(message, method);
    } else {
      message.addText('Multiple errors:');
      tryInsertElement(message, options.element);
      message.newLine();
      for (var i = 0; i < errors.length; i++) {
        message.addText((i + 1) + '. ');
        addError(message, errors[i], method, options.paramsNames);
        message.newLine();
      }
      message.beginCollapsedGroup();
      message.addText('Method reference');
      message.newLine();
      addMethodReference(message, method, true);
      message.endGroup();
    }

    message.endGroup();
    message.print();
  },

  checkQuery: function (name, args, query, element) {
    if (!blocks.debug.enabled) {
      return;
    }
    var method = blocks.debug.queries[name];
    if (method) {
      blocks.debug.checkArgs(method, args, {
        paramsNames: query.params,
        element: element
      });
    }
  },

  queryNotExists: function (query, element) {
    if (!blocks.debug.enabled) {
      return;
    }
    var message = blocks.debug.Message();
    message.beginSpan({ 'font-weight': 'bold' });
    message.addSpan('Warning:', { background: 'orange', padding: '0 3px' });

    message.addText(' ');
    message.addSpan(query.name, { background: 'red', color: 'white' });
    message.addSpan('(' + query.params.join(', ') + ')', { background: '#EEE' });

    message.addText(' - data-query ');
    message.addSpan(query.name, { background: '#EEE', padding: '0 5px' });
    message.addText(' does not exists');
    tryInsertElement(message, element);
    message.endSpan();

    message.print();
  },

  queryParameterFail: function (query, failedParameter, element) {
    if (!blocks.debug.enabled) {
      return;
    }
    var method = blocks.debug.queries[query.name];
    var message = blocks.debug.Message();
    var params = query.params;
    var param;

    if (!method) {
      return;
    }

    message.beginCollapsedGroup();
    message.beginSpan({ 'font-weight': 'bold' });
    message.addSpan('Critical:', { background: 'red', color: 'white' });
    message.addText(' ');
    message.beginSpan({ background: '#EEE' });
    message.addText(query.name + '(');
    for (var i = 0; i < params.length; i++) {
      param = params[i];
      if (param == failedParameter) {
        message.addSpan(param, { background: 'red', color: 'white' });
      } else {
        message.addText(param);
      }
      if (i != params.length - 1) {
        message.addText(', ');
      }
    }
    message.addText(')');
    message.endSpan();
    message.addText(' - exception thrown while executing query parameter');
    tryInsertElement(message, element);
    addMethodReference(message, method);
    message.endGroup();

    message.print();
  },

  expressionFail: function (expressionText, element) {
    if (!blocks.debug.enabled) {
      return;
    }
    var message = new blocks.debug.Message();

    message.beginSpan({ 'font-weight': 'bold' });
    message.addSpan('Critical:', { background: 'red', color: 'white' });
    message.addText(' ');
    message.addSpan('{{' + expressionText + '}}', { background: 'red', color: 'white' });
    message.addText(' - exception thrown while executing expression');
    message.endSpan();

    tryInsertElement(message, element);

    message.print();
  },

  Message: ConsoleMessage
};

function tryInsertElement(message, element) {
  if (element) {
    //message.addText(' -->');
    message.addText('   ');
    if (blocks.VirtualElement.Is(element)) {
      if (element._el) {
        message.addElement(element._el);
      } else {
        message.addText(element.renderBeginTag());
      }
    } else {
      message.addElement(element);
    }
  }
}

function addMethodReference(message, method, examplesExpanded) {
  var examples = method.examples;

  message
    .newLine()
    .addSpan(method.description, { color: 'green' });

  addMethodSignature(message, method);

  if (examplesExpanded) {
    message.beginGroup();
  } else {
    message.beginCollapsedGroup();
  }

  message
    .addSpan('Usage example' + (examples.length > 1 ? 's' : ''), { color: 'blue' })
    .newLine();

  for (var i = 0; i < method.examples.length;i++) {
    addCodeTree(message, method.examples[i].code);
  }

  message.endGroup();
}

function addCodeTree(message, codeTree) {
  var children = codeTree.children;
  var lines;
  var child;

  message.beginSpan(highlightjs[codeTree.name]);

  for (var i = 0; i < children.length; i++) {
    child = children[i];

    if (typeof child == 'string') {
      message.addText(child.split('\n').join('\n '));
    } else {
      addCodeTree(message, child);
    }
  }

  message.endSpan();
}

function addError(message, error, method, paramNames) {
  var params = method.params;
  var index;

  if (!paramNames) {
    paramNames = [];
    for (index = 0; index < params.length; index++) {
      paramNames.push(params[index].name);
    }
  }

  message.beginSpan({
    'background-color': '#EEE'
  });

  message.addText(method.name + '(');

  if (error) {
    switch (error.type) {
      case 'less-args':
        message.addText(paramNames.slice(0, error.actual).join(', '));
        if (error.actual > 0) {
          message.addText(', ');
        }
        for (index = 0; index < error.expected; index++) {
          message
            .beginSpan({
              'background-color': 'red',
              padding: '0 5px',
              color: 'white'
            })
            .addText('?')
            .endSpan();
          if (index != error.expected - 1) {
            message.addText(', ');
          }
        }
        message.addText(')');
        message.endSpan();
        message.addText(' - less arguments than the required specified');
        break;
      case 'more-args':
        message.addText(paramNames.slice(0, error.expected).join(', '));
        if (error.expected > 0) {
          message.addText(', ');
        }
        for (index = error.expected; index < error.actual; index++) {
          message.addSpan(paramNames[index], {
            'background-color': 'red',
            'text-decoration': 'line-through',
            color: 'white'
          });
          if (index != error.actual - 1) {
            message.addText(', ');
          }
        }
        message.addText(')');
        message.endSpan();
        message.addText(' - ' + (error.actual - error.expected) + ' unnecessary arguments specified');
        break;
      case 'param':
        for (index = 0; index < paramNames.length; index++) {
          if (method.params[index] == error.param) {
            message.addSpan(paramNames[index], {
              'background-color': 'red',
              color: 'white'
            });
          } else {
            message.addText(paramNames[index]);
          }
          if (index != paramNames.length - 1) {
            message.addText(', ');
          }
        }
        message.addText(')');
        message.endSpan();
        message.addText(' - ' + error.actual + ' specified where ' + error.expected + ' expected');
        break;
    }
  } else {
    message.addText(')');
    message.endSpan();
  }
}

function debugFunc(callback) {
  return function () {
    if (blocks.debug.executing) {
      return;
    }
    blocks.debug.executing = true;
    callback.apply(blocks.debug, blocks.toArray(arguments));
    blocks.debug.executing = false;
  };
}

function checkMethod(method, args) {
  var errors = [];

  errors = errors.concat(checkArgsCount(method, args));
  if (errors.length === 0 || errors[0].type == 'more-args') {
    errors = errors.concat(checkArgsTypes(method, args));
  }

  return errors;
}

function checkArgsCount(method, args) {
  var errors = [];
  var requiredCount = 0;
  var hasArguments = false;
  var params = method.params;
  var param;

  for (var i = 0; i < params.length; i++) {
    param = params[i];
    if (!param.optional) {
      requiredCount++;
    }
    if (param.isArguments) {
      hasArguments = true;
    }
  }

  if (args.length < requiredCount) {
    errors.push({
      type: 'less-args',
      actual: args.length,
      expected: requiredCount
    });
  }
  if (!hasArguments && args.length > params.length) {
    errors.push({
      type: 'more-args',
      actual: args.length,
      expected: params.length
    });
  }

  return errors;
}

function getOptionalParamsCount(params) {
  var count = 0;

  for (var i = 0; i < params.length; i++) {
    if (params[i].optional) {
      count++;
    }
  }

  return count;
}

function checkArgsTypes(method, args) {
  var errors = [];
  var params = method.params;
  var maxOptionals = params.length - (params.length - getOptionalParamsCount(method.params));
  var paramIndex = 0;
  var currentErrors;
  var param;
  var value;

  for (var i = 0; i < args.length; i++) {
    param = params[paramIndex];
    value = args[i];

    if (!param) {
      break;
    }

    if (param.optional) {
      if (maxOptionals > 0) {
        currentErrors = checkType(param, value);
        if (currentErrors.length === 0) {
          maxOptionals -= 1;
          if (!param.isArguments) {
            paramIndex += 1;
          }
        }
      }
    } else {
      errors = errors.concat(checkType(param, value));
      if (!param.isArguments) {
        paramIndex += 1;
      }
    }
  }

  return errors;
}

function checkType(param, value) {
  var unwrapedValue = blocks.unwrap(value);
  var errors = [];
  var types = param.types;
  var satisfied = false;
  var valueType;
  var type;

  for (var i = 0; i < types.length; i++) {
    type = types[i].toLowerCase();
    type = type.replace('...', '');

    if (type == '*') {
      satisfied = true;
      break;
    }

    if (type == 'falsy') {
      if (!unwrapedValue) {
        satisfied = true;
        break;
      } else {
        continue;
      }
    } else if (type == 'truthy') {
      if (unwrapedValue) {
        satisfied = true;
        break;
      } else {
        continue;
      }
    } else if (customTypes[type]) {
      satisfied = customTypes[type](value);
      if (satisfied) {
        break;
      } else {
        continue;
      }
    } else if (blocks.isObservable(value)) {
      valueType = 'blocks.observable()';
    } else {
      valueType = blocks.type(value).toLowerCase();
    }

    if (type === valueType) {
      satisfied = true;
      break;
    } else if (valueType == 'blocks.observable()') {
      valueType = blocks.type(blocks.unwrapObservable(value));
      if (type === valueType) {
        satisfied = true;
        break;
      }
    }
  }

  if (!satisfied) {
    errors.push({
      type: 'param',
      param: param,
      actual: valueType,
      expected: types
    });
  }

  return errors;
}

function addMethodSignature(message, method) {
  var params = method.params;
  var paramNames = [];
  var index;

  message
    .newLine()
    .beginSpan({ 'font-size': '15px', 'font-weight': 'bold' })
    .addText(method.name + '(');

  for (index = 0; index < params.length; index++) {
    paramNames.push(params[index].rawName);
  }
  message.addText(paramNames.join(', ') + ')');
  if (method.returns) {
    message.addText(' returns ' + method.returns.types[0]);
    if (method.returns.description) {

    }
  }

  message.endSpan();

  for (index = 0; index < params.length; index++) {
    message
      .newLine()
      .addText('    ' + params[index].rawName + ' {' + params[index].types.join('|') + '} - ' + params[index].description);
  }

  message.newLine();
}

function examples(method) {
  var examples = method.examples;

  if (examples) {
    console.groupCollapsed('%cUsage examples', 'color: blue;');

    for (var i = 0; i < examples.length; i++) {
      console.log(examples[i].code);
      if (i != examples.length - 1) {
        console.log('-------------------------------');
      }
    }

    console.groupEnd();
  }
}

function params(method) {
  var params = method.params;
  for (var i = 0; i < params.length; i++) {
    console.log('    ' + method.params[i].name + ': ' + method.params[i].description);
  }
}

function ConsoleMessage() {
  if (!ConsoleMessage.prototype.isPrototypeOf(this)) {
    return new ConsoleMessage();
  }
  this._rootSpan = {
    styles: {},
    children: [],
    parent: null
  };
  this._currentSpan = this._rootSpan;
}

ConsoleMessage.Support = (function () {
  // https://github.com/jquery/jquery-migrate/blob/master/src/core.js
  function uaMatch( ua ) {
    ua = ua.toLowerCase();

    var match = /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
      /(webkit)[ \/]([\w.]+)/.exec( ua ) ||
      /(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
      /(msie) ([\w.]+)/.exec( ua ) ||
      ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) ||
      [];

    return {
      browser: match[ 1 ] || "",
      version: match[ 2 ] || "0"
    };
  }
  var browserData = uaMatch(navigator.userAgent);

  return {
    isIE: browserData.browser == 'msie' || (browserData.browser == 'mozilla' && parseInt(browserData.version, 10) == 11)
  };
})();

ConsoleMessage.prototype = {
  beginGroup: function () {
    this._currentSpan.children.push({
      type: 'group',
      parent: this._currentSpan
    });
    return this;
  },

  beginCollapsedGroup: function () {
    this._currentSpan.children.push({
      type: 'groupCollapsed'
    });
    return this;
  },

  endGroup: function () {
    this._currentSpan.children.push({
      type: 'groupEnd',
      parent: this._currentSpan
    });
    return this;
  },

  beginSpan: function (styles) {
    var span = {
      type: 'span',
      styles: styles,
      children: [],
      parent: this._currentSpan
    };
    this._currentSpan.children.push(span);
    this._currentSpan = span;
    return this;
  },

  endSpan: function () {
    this._currentSpan = this._currentSpan.parent || this._currentSpan;
    return this;
  },

  addSpan: function (text, styles) {
    this.beginSpan(styles);
    this.addText(text);
    this.endSpan();
    return this;
  },

  addText: function (message) {
    this._currentSpan.children.push({
      type: 'text',
      message: message,
      parent: this._currentSpan
    });
    return this;
  },

  newLine: function (type) {
    this._currentSpan.children.push({
      type: type || 'log',
      parent: this._currentSpan
    });
    return this;
  },

  addImage: function () {
    (function () {
      var faviconUrl = "http://d2c87l0yth4zbw.cloudfront.net/i/_global/favicon.png",
        css = "background-image: url('" + faviconUrl + "');" +
          "background-repeat: no-repeat;" +
          "display: block;" +
          "background-size: 13px 13px;" +
          "padding-left: 13px;" +
          "margin-left: 5px;",
        text = "Do you like coding? Visit www.spotify.com/jobs";
      if (navigator.userAgent.match(/chrome/i)) {
        console.log(text + '%c', css);
      } else {
        console.log('%c   ' + text, css);
      }
    })();
    return this;
  },

  addElement: function (element) {
    this._currentSpan.children.push({
      type: 'element',
      element: element,
      parent: this._currentSpan
    });
    return this;
  },

  print: function () {
    if (typeof console == 'undefined') {
      return;
    }

    var messages = [this._newMessage()];
    var message;

    this._printSpan(this._rootSpan, messages);

    for (var i = 0; i < messages.length; i++) {
      message = messages[i];
      if (message.text && message.text != '%c' && console[message.type]) {
        Function.prototype.apply.call(console[message.type], console, [message.text].concat(message.args));
      }
    }

    return this;
  },

  _printSpan: function (span, messages) {
    var children = span.children;
    var message = messages[messages.length - 1];

    this._addSpanData(span, message);

    for (var i = 0; i < children.length; i++) {
      this._handleChild(children[i], messages);
    }
  },

  _handleChild: function (child, messages) {
    var message = messages[messages.length - 1];

    switch (child.type) {
      case 'group':
        messages.push(this._newMessage('group'));
        break;
      case 'groupCollapsed':
        messages.push(this._newMessage('groupCollapsed'));
        break;
      case 'groupEnd':
        message = this._newMessage('groupEnd');
        message.text = ' ';
        messages.push(message);
        messages.push(this._newMessage())
        break;
      case 'span':
        this._printSpan(child, messages);
        this._addSpanData(child, message);
        this._addSpanData(child.parent, message);
        break;
      case 'text':
        message.text += child.message;
        break;
      case 'element':
        message.text += '%o';
        message.args.push(child.element);
        break;
      case 'log':
        messages.push(this._newMessage(child.type));
        break;
    }
  },

  _addSpanData: function (span, message) {
    if (!ConsoleMessage.Support.isIE) {
      if (message.text.substring(message.text.length - 2) == '%c') {
        message.args[message.args.length - 1] = this._stylesString(span.styles);
      } else {
        message.text += '%c';
        message.args.push(this._stylesString(span.styles));
      }
    }
  },

  _newMessage: function (type) {
    return {
      type: type || 'log',
      text: '',
      args: []
    };
  },

  _stylesString: function (styles) {
    var result = '';
    for (var key in styles) {
      result += key + ':' + styles[key] + ';';
    }
    return result;
  }
};

var highlightjs = {
  'xml': {},
  'hljs-tag': {

  },
  'hljs-title': {
    color: '#5cd94d'
  },
  'hljs-expression': {
    color: '#7b521e'
  },
  'hljs-variable': {
    color: '#7b521e'
  },
  'hljs-keyword': {},
  'hljs-string': {},
  'hljs-function': {},
  'hljs-params': {},
  'hljs-number': {},
  'hljs-regexp': {},
  'hljs-comment': {
    color: '#888'
  },
  'hljs-attribute': {
    color: '#2d8fd0'
  },
  'hljs-value': {
    color: '#e7635f'
  }
};
