module.exports = function (grunt) {
  var blocks = require('blocks');
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
        contents = contents
          .replace(/\/\*\s*ExcludeStart\s*\*\/[\w\W]*?\/\*\s*ExcludeEnd\s*\*\//ig, '')
          .replace(/\/\/\s*BuildExclude\n\r?[\w\W]*?\n\r?/ig, '');

        // Remove empty definitions
        contents = contents
          .replace(/define\(\[[^\]]+\]\)[\W\n]+$/, '');
      }

      return contents;
    }
  };

  var names = ['query', 'mvc', 'node'];
  names.forEach(function (name) {
    grunt.config.set('name', name);
    (requirejsConfig[name] = {}).options = grunt.config.process(requirejsOptions);
    grunt.config.set('name', undefined);
  });

  grunt.config.set('requirejs', requirejsConfig);

  grunt.registerTask('build', function () {
    var tasks = [];
    for (var i = 0; i < arguments.length; i++) {
      tasks.push('requirejs:' + arguments[i])
    }
    grunt.task.run(tasks.length ? tasks : 'requirejs');
  });
};