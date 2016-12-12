module.exports = function (grunt) {
  var esprima = require('esprima');
  var escodegen = require('escodegen');
  var estrvarse = require('estraverse');
  var definedModuleNames = {};
  var requirejsConfig = {};
  var requirejsOptions = {
    baseUrl: 'src',
    out: 'dist/<%= name %>/blocks-<%= name %>.js',
    include: ['<%= name %>.js'],
    optimize: 'none',
    skipSemiColonInsertion: true,
    onBuildWrite: function (name, path, contents) {
     var rdefineEnd = /\}\);[^}\w]*$/;

      if (/.\/var\//.test(path)) {
        contents = contents
          .replace(/define\([\w\W]*?return/, '    var ' + (/var\/([\w-]+)/.exec(name)[1]) + ' =')
          .replace(rdefineEnd, '');

      } else {
        contents = contents
          .replace(/\/\*\s*ExcludeStart\s*\*\/[\w\W]*?\/\*\s*ExcludeEnd\s*\*\//ig, '')
          .replace(/\/\/\s*BuildExclude\n\r?[\w\W]*?\n\r?/ig, '');
        var ast = esprima.parse(contents, {
          tokens: true,
          comment: true,
          range: true
        });

        estrvarse.attachComments(ast, ast.comments, ast.tokens);

        if (ast.body[0].expression.callee.name == 'define') {
          var moduleExpression = findModuleExpressionArgument(ast.body[0].expression.arguments);
          if (!moduleExpression || !moduleExpression.body.body[0] || moduleExpression.body.body[0].type == 'ReturnStatement') {
            // Null out empty define statements e.g. define(['./query/ready', '...'])
            // and expresions without an expression or only an return statement e.g. define([], function () { return blocks; })
            contents = '';
          } else {
            var moduleName;
            try {
              moduleName = findModuleExportIdentifier(moduleExpression.body.body) || /\/(\w+).?j?s?$/.exec(name)[1];
            } catch(e) {}
            if (moduleName && definedModuleNames[moduleName] && definedModuleNames[moduleName] != path) {
              grunt.fail.warn('[NamingConflict]: Module ' + path + ' tried to define ' + moduleName + ' which is already defined by ' + definedModuleNames[moduleName] + ' !');
            } else if (moduleName){
              definedModuleNames[moduleName] = path;
            }
            ast =  wrapModuleAst(moduleExpression, moduleName);
            contents = escodegen.generate(ast, {
              format: {
                indent: {
                  style: '  ',
                  base: 0,
                  adjustMultilineComment: true
                }
              },
              comment: true
            });
          }
        }
       /* contents = contents
          .replace(/\s*return\s+[^\}]+(\}\);[^\w\}]*)$/, '$1')
          // Multiple exports
          .replace(/\s*exports\.\w+\s*=\s*\w+;/g, '');

        // Remove define wrappers, closure ends, and empty declarations
        contents = contents
          .replace(/define\([^{]*?{/, '')
          .replace(rdefineEnd, '');

        // Remove anything wrapped with
        // /* ExcludeStart */ /* ExcludeEnd */
        // or a single line directly after a // BuildExclude comment

        // Remove empty definitions
      /*  contents = contents
          .replace(/define\(\[[^\]]+\]\)[\W\n]+$/, '');*/

      }

      return contents;
    }
  };

  function findModuleExportIdentifier (module) {
    for (var i = module.length -1 ; i >= 0; i--) {
      var expression = module[i];
      if (expression.type == 'ReturnStatement') {
        return expression.argument.name;
      }
    }
   throw new Error('No return statement');
  }

  function findModuleExpressionArgument(args) {
    for (var i in args) {
      var arg = args[i];
      if (arg.type == 'FunctionExpression') {
        return arg;
      }
    }
  }


  function wrapModuleAst (node, exportName) {
      var wrapedModule;
      var bodyNode;
      if (exportName) {
        wrapedModule = esprima.parse('var ' + exportName + ' = (function () { })();');
        bodyNode = wrapedModule.body[0].declarations[0].init.callee.body;
      } else {
        wrapedModule = esprima.parse('(function () { })();');
        bodyNode = wrapedModule.body[0].expression.callee.body;
      }
      // insert body of the original "define"-function to the
      bodyNode.body = node.body.body;
      return wrapedModule;
  }

  var names = ['query', 'node'];
  names.forEach(function (name) {
    grunt.config.set('name', name);
    (requirejsConfig[name] = {}).options = grunt.config.process(requirejsOptions);
    grunt.config.set('name', undefined);
  });

  var blocksConfig = requirejsConfig['blocks-source'] =  {};
  blocksConfig.options = grunt.config.process(requirejsOptions);
  blocksConfig.options.include = ['blocks.js'];
  blocksConfig.options.out = 'dist/blocks-source.js';

  grunt.config.set('requirejs', requirejsConfig);

  grunt.registerTask('build', function () {
    var tasks = [];
    for (var i = 0; i < arguments.length; i++) {
      tasks.push('requirejs:' + arguments[i]);
    }
    grunt.task.run(tasks.length ? tasks : 'requirejs');
  });
};