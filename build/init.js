module.exports = function (grunt) {
  'use strict';

  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-preprocess');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-notify');

  var pkg = grunt.file.readJSON('package.json')
  grunt.initConfig({
    pkg: pkg,

    version: pkg.version,

    banner: '/*! jsblocks v<%= pkg.version %> | ' +
    '(c) 2014, <%= grunt.template.today("yyyy") %> |' +
    'jsblocks.org/license */',

    watch: {
      compile: {
        files: ['src/**/*.js'],
        tasks: ['compile'],
        options: {
          interrupt: true
        }
      }
    },

    preprocess: {
      debug: {
        src: ['dist/blocks-source.js'],
        dest: 'dist/blocks.js',
        options: {
          context: {
            DEBUG: true,
            SERVER: false
          }
        }
      },

      client: {
        src: 'dist/blocks-source.js',
        options: {
          inline: true,
          context: {
            DEBUG: false,
            SERVER: false
          }
        }
      },

      server: {
        src: 'dist/node/blocks-node.js',
        options: {
          inline: true,
          context: {
            DEBUG: false,
            SERVER: true
          }
        }
      }
    },

    uglify: {
      build: {
        options: {
          sourceMap: true
        },
        files: {
          'dist/blocks.min.js': ['dist/blocks.js'],
          'dist/mvc/blocks-mvc.min.js': ['dist/mvc/blocks-mvc.js'],
          'dist/query/blocks-query.min.js': ['dist/query/blocks-query.js'],
          'dist/query/blocks-query-data.min.js': ['dist/query/blocks-query-data.js']
        }
      }
    },

    notify: {
      build: {
        options: {
          message: 'Build successful'
        }
      }
    },

    jshint: {
      options: {
        jshintrc: true
      },

      source: ['src/**/*.js']
      //test: ['test/spec/**/*.js'],
      //grunt: ['build/**/*.js']
    }
  });

  grunt.loadTasks('build/tasks');

  grunt.registerTask('copy-to-fullstack', function () {
    grunt.file.write('../jsblocks-fullstack-example/node_modules/blocks/blocks.js', grunt.file.read('dist/node/blocks-node.js'));
    grunt.file.write('../jsblocks-fullstack-example/app/js/blocks.js', grunt.file.read('dist/blocks.js'));
  });

  grunt.registerTask('compile', ['build', 'combine', 'preprocess', 'debug', 'notify:build', 'build-tests-definitions', 'copy-to-fullstack']);
  grunt.registerTask('live-compile', ['compile', 'watch:compile']);
  grunt.registerTask('full-build', ['jshint', 'compile', 'uglify', 'test', 'npm', 'bower']);
  grunt.registerTask('default', []);
};
