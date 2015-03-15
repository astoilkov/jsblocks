module.exports = function (grunt) {
  var requirejsConfig = {};
  var requirejsOptions = {
    baseUrl: 'src',
    out: 'dist/blocks-<%= name %>.js',
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

  // TODO: Remove if node is not created until released
  var names = ['query', 'mvc', 'node'];
  names.forEach(function (name) {
    grunt.config.set('name', name);
    (requirejsConfig[name] = {}).options = grunt.config.process(requirejsOptions);
    grunt.config.set('name', undefined);
  });

  grunt.config.set('requirejs', requirejsConfig);

  grunt.registerTask('build', function () {
    grunt.task.run('requirejs');
  });
};