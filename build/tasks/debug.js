module.exports = function (grunt) {
  var esprima = require('esprima');
  var escodegen = require('escodegen');
  var parse5 = require('parse5');
  var hljs = require('highlight.js');
  var blocks = require('../../dist/blocks');
  var API = require('../blocks-api-parser');

  grunt.registerTask('debug', function () {
    var code = grunt.file.read('dist/blocks-debug.js');
    var queries = {};
    var parsed = API().parse(code, {
      onparse: function (data, node) {
        if (data.examples) {
          blocks.each(data.examples, function (example) {
            var root = {
              name: '',
              children: []
            };
            var current = root;
            var parents = [];
            var parser = new parse5.SimpleApiParser({
              startTag: function (tagName, attrs) {
                var node = {
                    name: attrs[0].value,
                    children: []
                };
                parents.push(current);
                current.children.push(node);
                current = node;
              },

              endTag: function () {
                current = parents.pop();
              },

              text: function (text) {
                current.children.push(text);
              }
            });
            parser.parse(hljs.highlightAuto(example.code, [example.language]).value);
            example.code = root;
          });
        }

        if (data.memberof && data.memberof.indexOf('blocks.queries') == 0) {
          queries[data.name] = data;
          return;
        }

        if (!node) {
          return;
        }
        var func;
        if (node.expression && node.expression.right && node.expression.right.type == 'FunctionExpression') {
          func = node.expression.right;
        } else if (node.value && node.value.type == 'FunctionExpression') {
          func = node.value;
        }
        if (func) {
          // FunctionExpression.BlockStatement.body(Array)
          var funcBody = func.body.body;

          esprima.parse('blocks.debug.checkArgs && blocks.debug.checkArgs(' + toValueString(data) + ', Array.prototype.slice.call(arguments))').body.forEach(function (chunk) {
            funcBody.unshift(chunk);
          });
        }
      }
    });
    //var code = escodegen.generate(parsed.parseTree(), {
    //  format: {
    //    indent: {
    //      style: '  ',
    //      base: 0,
    //      adjustMultilineComment: true
    //    }
    //  },
    //  comment: true
    //});

    var code = grunt.file.read('dist/blocks-debug.js');

    code = insertSourceCode(code, grunt.file.read('lib/blocks/jsdebug.js'));
    code = insertSourceCode(code, 'blocks.debug.queries = ' + toValueString(queries));

    grunt.file.write('dist/blocks-debug.js', code);
  });

  function insertSourceCode(baseCode, insertCode) {
    var sourceCodeLocation;
    var result = baseCode;

    sourceCodeLocation = result.indexOf('// @source-code');
    result = result.substring(0, sourceCodeLocation) + '\n' + getSourceCodeWrap(insertCode) + result.substring(sourceCodeLocation);

    return result;
  }

  function getSourceCodeWrap(code) {
    return '(function () {\n' + code + '\n})();'
  }

  function toValueString(value, options) {
    options = blocks.extend({}, {
      html: false,
      json: false,
      code: true,
      tab: 2,
      softTabs: true,
      tabify: true,
      maxDepth: Number.MAX_VALUE
    }, options);

    var quote = getQuote(options);
    var result;
    var size;

    if (options.json) {
      options.code = true;
    }

    if (options.tabify === true) {
      options.tabify = options.tab;
    } else {
      options.tabify += options.tab;
    }

    options.maxDepth -= 1;

    if (value === null) {
      result = 'null';
    } else if (value === undefined) {
      result = 'undefined';
    } else if (blocks.isBoolean(value)) {
      return value.valueOf() ? 'true' : 'false';
    } else if (blocks.isString(value)) {
      if (options.code || options.json) {
        value = value.replace(/(\r\n|\n|\r)/gm, '\\n');
      } else if (options.html) {
        value = value.replace(/(\r\n|\n|\r)/gm, '<br />');
      }

      if (options.code) {
        if (options.quotes == 'double') {
          return quote + value.replace(/"/g, '\"') + quote;
        } else {
          return quote + value.replace(/'/g, '\\\'') + quote;
        }
      }

      return value;
    } else if (blocks.isNaN(value)) {
      result = 'NaN';
    } else if (blocks.isDate(value)) {
      if (options.code) {
        return 'new Date(' + quote + value.toString() + quote + ')';
      } else {
        return value.toString();
      }
    } else if (blocks.isFunction(value)) {
      result = value.toString();
    } else if (blocks.isRegExp(value)) {
      var flags = '';
      if (value.global) {
        flags += 'g';
      }
      if (value.ignoreCase) {
        flags += 'i';
      }
      if (value.multiline) {
        flags += 'm';
      }
      result = '/' + value.source + '/' + flags;
    } else if (blocks.isNumber(value)) {
      result = value.toString();
    } else if (blocks.isArray(value)) {
      if (options.maxDepth < 0) {
        return '[ /* Inner values are hidden */ ]';
      }
      result = '[';
      blocks.each(value, function (item, index) {
        result += toValueString(item, options);
        if (index != value.length - 1) {
          result += ', ';
        }
      });
      result += ']';
    } else if (blocks.isObject(value)) {
      if (options.maxDepth < 0) {
        return '{ /* Inner values are hidden */ }';
      }

      size = blocks.size(value);
      result = '{';

      if (size > 1) {
        result += '\n';
      } else {
        result += ' ';
      }

      blocks.each(value, function (item, key) {
        if (options.tabify && size > 1) {
          result += blocks.repeat(' ', options.tabify);
        }

        result += getObjectKey(key, options) + ': ' + toValueString(item, options);
        if (size > 1) {
          result += ',\n';
        } else {
          result += ', ';
        }
      });

      if (result.length > 4) {
        result = result.substring(0, result.length - 2);
      }

      if (size > 1) {

        result += '\n' + blocks.repeat(' ', options.tabify - options.tab);
      } else {
        result += ' ';
      }

      result += '}';
    }
    return result;
  }

  function getQuote(options) {
    if (options.quotes == 'double') {
      return '"';
    } else {
      return '\'';
    }
  }

  var keywords = [
    "break", "do", "instanceof", "typeof", "case", "else", "var", "catch", "finally", "return", "void", "continue",
    "for", "switch", "while", "debugger", "function", "this", "with", "default", "if", "throw", "delete", "in", "try",
    "class", "enum", "extends", "super", "const", "export", "import", "implements", "let", "private", "public",
    "yield", "interface", "package", "protected", "static", "null", "undefined", "true", "false", "new"
  ];
  var keywordsKeys = {};
  for (var i = 0; i < keywords.length; i++) {
    keywordsKeys[keywords[i]] = true;
  }

  function getObjectKey(key, options) {
    var objectKeyRegExp = /^[$_\w][\w0-9]+$/;

    if (options.json) {
      return '"' + key + '"';
    }
    if (!objectKeyRegExp.test(key) || keywordsKeys[key]) {
      if (options.quotes == 'double') {
        return '"' + key + '"';
      } else {
        return '\'' + key + '\'';
      }
    }
    return key;
  }
};