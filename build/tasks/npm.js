module.exports = function (grunt) {
  var packageJSON = {
    name: 'blocks',
    version: grunt.config.get('version'),
    description: 'jsblocks - Better MV-ish Framework',
    main: 'node/blocks-node.js',
    keyword: ['MVC', 'MVVM', 'MVW', 'server rendering', 'filtering', 'sorting', 'paging', 'framework'],
    scripts: {
      'test': 'echo \'Error: no test specified\' && exit 1'
    },
    repository: {
      type: 'git',
      url: 'https://github.com/astoilkov/jsblocks.git'
    },
    author: {
      name: 'Antonio Stoilkov',
      email: 'antonio.stoilkov@gmail.com',
      url: 'http://jsblocks.com'
    },
    license: 'MIT',
    bugs: {
      url: 'https://github.com/astoilkov/jsblocks/issues',
      email: 'support@jsblocks.com'
    },
    homepage: 'https://github.com/astoilkov/jsblocks',
    dependencies: {
      express: "4.14.0",
      parse5: "2.2.1"
    }
  };

  grunt.registerTask('npm', function () {
    grunt.file.recurse('dist', function (abspath, rootdir, subdir, filename) {
      var subFolder = subdir ? subdir + '/' : '';
      subdir = subdir || '';

      if (subdir.indexOf('npm') == -1) {
        grunt.file.write('dist/npm/' + subFolder + filename, grunt.file.read(abspath));
      }
    });
    grunt.file.write('dist/npm/package.json', JSON.stringify(packageJSON, null, 4));
    grunt.file.write('dist/npm/README.md', grunt.file.read('README.md'));
  });
};