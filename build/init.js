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
        src: ['dist/blocks.js'],
        dest: 'dist/blocks-debug.js',
        options: {
          context: {
            DEBUG: true
          }
        }
      },

      production: {
        src: ['dist/blocks.js', 'dist/blocks-node.js'],
        options: {
          inline: true,
          context: {
            DEBUG: false
          }
        }
      }
    },

    uglify: {
      build: {
        files: {
          'dist/min/blocks.min.js': ['dist/blocks.js'],
          'dist/min/blocks-mvc.min.js': ['dist/blocks-mvc.js'],
          'dist/min/blocks-query.min.js': ['dist/blocks-query.js']
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

  grunt.registerTask('compile', ['build', 'combine', 'preprocess', 'debug', 'notify:build', 'build-tests-definitions']);
  grunt.registerTask('live-compile', ['compile', 'watch:compile']);
  grunt.registerTask('full-build', ['jshint', 'compile', 'uglify', 'test', 'npm', 'bower']);
  grunt.registerTask('default', []);
};
