module.exports = function (grunt) {
  var packageJSON = {
    name: 'jsblocks',
    version: '0.1.0',
    main: 'blocks.js',
    keywords: []
  };

  grunt.registerTask('bower', function () {
    grunt.file.write('dist/bower/package.json', JSON.stringify(packageJSON));
    grunt.file.write('dist/bower/blocks.js', grunt.file.read('dist/blocks-debug.js'));
    //grunt.file.write('dist/bower/blocks-source.js', grunt.file.read('dist/blocks.js'));
    grunt.file.write('dist/bower/blocks.min.js', grunt.file.read('dist/min/blocks.min.js'));
  });
};