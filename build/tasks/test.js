module.exports = function (grunt) {
  var karmaConfig = {
    options: {
      files: [
        // code for testing
        'dist/blocks.js',

        // dependencies
        require.resolve('jquery/dist/jquery.js'),
        //'lib/jquery-1.11.2/jquery-1.11.2.js',
        require.resolve('jasmine-jquery'),
        //'lib/jasmine-jquery-2.2.0/jasmine-jquery.js',
        'test/blocks.testing.js',

        // tests location
        'test/spec/**/*.js'
      ],
      autoWatch: false,
      //browserNoActivityTimeout: 30000,
      // browserDisconnectTimeout
      // browserDisconnectTolerance
      frameworks: ['jasmine'],
      reporters: ['spec'],
      browserConsoleLogOptions: {
        level: "error",
        terminal: false
      }
    },

    test: {
      browsers: ['Chrome', 'Firefox', 'IE11', 'IE10'],
      customLaunchers: {
        IE11: {
          base: 'IE',
          'x-ua-compatible': 'IE=EmulateIE11'
        },
        IE10: {
          base: 'IE',
          'x-ua-compatible': 'IE=EmulateIE10'
        }
      },
      singleRun: true
    },

    coverage: {
      browserConsoleLogOptions: {
        terminal: false
      },
      reporters: ['dots', 'coverage'],
      preprocessors: {
        'dist/blocks.js': ['coverage']
      },
      coverageReporter: {
        type: 'html',
        dir: 'coverage/'
      },
      browsers: ['Firefox'],
    },
    browserstack: {
      browserStack: {
        username: process.env.BROWSERSTACK_USER || process.env.BROWSER_STACK_USER,
        startTunnel: !process.env.BROWSERSTACK_LOCAL_IDENTIFIER,
        tunnelIdentifier: process.env.BROWSERSTACK_LOCAL_IDENTIFIER
      },
      customLaunchers: {},
      reporters: ['spec', 'BrowserStack'],
      browsers: [],
      concurrency: 1,
      singleRun: true
    },

    watch: {
      browsers: ['PhantomJS'],
      background: true
    },
    phantom: {
      browsers: ['PhantomJS'],
      singleRun: true
    },

    chrome: {
      browsers: ['Chrome'],
      singleRun: true
    },

    firefox: {
      browsers: ['Firefox'],
      singleRun: true
    },

    ie: {
      browsers: ['IE11', 'IE10', 'IE9'],
      customLaunchers: {
        IE11: {
          base: 'IE',
          'x-ua-compatible': 'IE=EmulateIE11'
        },
        IE10: {
          base: 'IE',
          'x-ua-compatible': 'IE=EmulateIE10'
        },
        IE9: {
          base: 'IE',
          'x-ua-compatible': 'IE=EmulateIE9'
        },
        IE8: {
          base: 'IE',
          'x-ua-compatible': 'IE=EmulateIE8'
        }
      },
      singleRun: true
    },

    ie9: {
      browsers: ['IE9'],
      customLaunchers: {
        IE9: {
          base: 'IE',
          'x-ua-compatible': 'IE=EmulateIE9'
        }
      },
      singleRun: true
    },

    safari: {
      browsers: ['Safari'],
      singleRun: true
    },

    opera: {
      browsers: ['Opera'],
      singleRun: true
    },


    build: {
      browsers: ['IE', 'ChromeCanary', 'Safari', 'Firefox', 'Chrome', 'PhantomJS'],
      singleRun: true
    }
  };

  require('./browserstack-browsers')(karmaConfig.browserstack);
  
  grunt.config.set('karma', karmaConfig);

  grunt.registerTask('test', function (browser) {
    if (browser) {
      if (browser.toLowerCase() == 'travis') {
        if (process.env.BROWSERSTACK_LOCAL_IDENTIFIER) {
          browser = 'browserstack';
        } else {
          browser = 'firefox';
        }
      }
      grunt.task.run('karma:' + browser);
    } else {
      grunt.task.run('karma:test');
    }
  });
};