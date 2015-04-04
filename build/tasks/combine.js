module.exports = function (grunt) {

  grunt.registerTask('combine', function () {
    var core = grunt.file.read('lib/blocks/blocks-core.js').replace('@version', grunt.config.get('version'));
    var jsvalue = grunt.file.read('lib/blocks/value-nocore.js');
    var mvc = grunt.file.read('dist/blocks-mvc.js');
    var query = grunt.file.read('dist/blocks-query.js');

    // TODO: Remove if node is not created until released
    var node = grunt.file.read('dist/blocks-node.js');

    var nodeCode = insertSourceCode(
      core.replace('typeof window !== \'undefined\' ? window : this', 'typeof window !== \'undefined\' && !window.__mock__ ? window : this'),
      [jsvalue, node]);
    grunt.file.write('dist/blocks-node.js', nodeCode);


    var jsblocks = insertSourceCode(core, [jsvalue, mvc]);
    var mvcOnly = insertSourceCode(core, [mvc]);
    var queryOnly = insertSourceCode(core, [query]);
    var queryAndValue = insertSourceCode(core, [jsvalue, query]);

    grunt.file.write('dist/blocks.js', jsblocks);
  });

  function getSourceCodeWrap(code) {
    return '(function () {\n' + code + '\n})();'
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
