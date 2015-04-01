define([
  '../core',
  './browserVars'
], function (blocks, browserVars) {
  var vm = require('vm');
  var fs = require('fs');
  var esprima = require('esprima');
  var estraverse = require('estraverse');
  var escodegen = require('escodegen');

  function codeReplace(code) {
    var ast = esprima.parse(code);
    var tree = treeNode();
    var current = tree;

    estraverse.traverse(ast, {
      enter: function (node, parent) {
        if (node.type == 'FunctionExpression' ||
          node.type == 'FunctionDeclaration') {
          if (node.type == 'FunctionExpression' && node.id) {
            current.scope[node.id.name] = true;
          }
          current = treeNode(current);

          blocks.each(node.params, function (node) {
            current.scope[node.name] = true;
          });
        } else if (node.type == 'VariableDeclarator') {
          current.scope[node.id.name] = true;
        } else if (node.type == 'Identifier' &&
          parent.type != 'VariableDeclarator' &&
          node.name != 'arguments' &&
          parent.type != 'Property' &&
          parent.type != 'FunctionDeclaration' &&
          parent.type != 'FunctionExpression' &&
          parent.type != 'CatchClause') {
          if (parent.type != 'MemberExpression' || memberExpressionName(parent) == node.name) {
            if (node.name != 'undefined') {
              current.identifiers[node.name] = node;
            }
          }
        }
      },

      leave: function (node) {
        if (node.type == 'FunctionExpression' ||
          node.type == 'FunctionDeclaration') {
          current = current.parent;
        }
      }
    });

    replaceGlobalsInTree(tree);

    return escodegen.generate(ast);
  }

  function treeNode(parent) {
    var node = {
      scope: {},
      children: [],
      parent: parent,
      identifiers: {}
    };

    if (parent) {
      parent.children.push(node);
    }

    return node;
  };

  function memberExpressionName(node) {
    while (node.object.type == 'MemberExpression') {
      node = node.object;
    }
    return node.object.name;
  }

  function replaceGlobalsInTree(tree) {
    replaceGlobals(tree);

    blocks.each(tree.children, function (child) {
      replaceGlobalsInTree(child);
    });
  }

  function replaceGlobals(node) {
    blocks.each(node.identifiers, function (identifierNode, name) {
      var found = false;
      var currentNode = node;

      if (browserVars[name]) {
        found = true;
      } else {
        while (currentNode) {
          if (currentNode.scope[name]) {
            found = true;
          }
          currentNode = currentNode.parent;
        }
      }

      if (!found) {
        identifierNode.name = '__this__context__.' + name;
      }
    });
  }

  function executePageScripts(browserEnv, html, scripts) {
    var code = '';

    blocks.each(scripts, function (script) {
      code += script.code + ';';
    });

    return executeCode(browserEnv, html, code);
  }


  function executeCode(browserEnv, html, code) {
    var context = vm.createContext(browserEnv.getObject());
    var script = vm.createScript(code);

    fs.writeFile('result.js', codeReplace(code));

    blocks.extend(context, {
      server: {
        html: html,
        data: {},
        rendered: '',
        applications: []
      },
      require: require
    });

    script.runInContext(context);

    blocks.each(context.server.applications, function (application) {
      application.start();
    });

    return context.server.rendered;
  }

  return executePageScripts;
});