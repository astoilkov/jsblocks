module.exports = function (grunt) {

  grunt.registerTask('combine', function () {
    var core = grunt.file.read('lib/blocks/core.js').replace('@version', grunt.config.get('version'));
    var mvc = grunt.file.read('dist/mvc/blocks-mvc.js');
    var query = grunt.file.read('dist/query/blocks-query.js');

    var node = grunt.file.read('dist/node/blocks-node.js');

    var nodeCode = insertSourceCode(
      core.replace('typeof window !== \'undefined\' ? window : this', 'typeof window !== \'undefined\' && !window.__mock__ ? window : this'),
      [node]);
    grunt.file.write('dist/node/blocks-node.js', nodeCode);


    var jsblocks = insertSourceCode(core, [mvc]);
    var queryOnly = insertSourceCode(core, [query]);

    grunt.file.write('dist/blocks-source.js', jsblocks);
    grunt.file.write('dist/query/blocks-query.js', queryOnly);
  });

  function getSourceCodeWrap(code) {
    return '(function () {\n' + code + '\n})();';
  }

  function insertSourceCode(core, code) {
    var sourceCodeLocation;
    var result = core;

    code.forEach(function (codeBlock) {
      sourceCodeLocation = result.indexOf('// @source-code');
      result = result.substring(0, sourceCodeLocation) + '\n' + getSourceCodeWrap(codeBlock) + result.substring(sourceCodeLocation);
    });

    return result;
  }
};
