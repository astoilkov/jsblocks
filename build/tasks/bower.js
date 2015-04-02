module.exports = function (grunt) {
  var bowerJSON = {
    name: 'blocks',
    version: grunt.config.get('version'),
    main: 'dist/blocks.js',
    license: 'MIT',
    author: {
      name: 'Antonio Stoilkov',
      email: 'antonio.stoilkov@gmail.com',
      url: 'http://jsblocks.com'
    },
    ignore: [
      'build',
      'examples',
      'lib',
      'node_modules',
      'src',
      'test',
      '*.gitignore',
      'Gruntile.js',
      'package.json',
      'dist/npm'
    ],
    keywords: []
  };

  grunt.registerTask('bower', function () {
    grunt.file.write('bower.json', JSON.stringify(bowerJSON, null, 4));
  });
};