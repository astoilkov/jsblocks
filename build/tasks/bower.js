module.exports = function (grunt) {
  var packageJSON = {
    name: 'blocks',
    version: grunt.config.get('version'),
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