/*
 * Config object for easier adding browsers.
 * structure: 
 * {
 * 	platform: {
 * 		plattformVersion: {
 * 	  	browsername: [browserVersion]
 * 	  }
 * 	}
 * }
 *
 * e.g.:
 * {
 *  'Windows': {
 *  	 7: {
 *  	   "ie": ["9.0", "10.0", "11.0"]
 *  	 }
 *   }
 * }
 */
var browsers = {
	'Windows': {
		7: {
			ie: ['9.0', '10.0', '11.0'],
			firefox: ['50.0', '51.0', '52.0'],
			chrome: ['55.0', '56.0', '57.0']
		},
		'8.1': {
			opera: ['12.16'],
			chrome: ['57.0'],
			firefox: ['52.0'],
			ie: ['11.0']
		},
		10: {
			chrome: ['57.0'],
			firefox: ['52.0'],
			edge: ['13.0', '14.0']
		}
	},
	'OS X': {
		'Yosemite': {
			chrome: ['55.0', '56.0', '57.0'],
			opera: ['12.15'],
			firefox: ['50.0', '51.0', '52.0'],
			safari: ['8.0']
		},
		'El Capitan': {
			safari: ['9.1'],
			chrome: ['57.0'],
			firefox: ['52.0'],
		},
		'Sierra': {
			safari: ['10.0'],
			chrome: ['57.0'],
			firefox: ['52.0'],
		}
	},
	ios: {
		'8.3': {
			'iphone': [null],
			'ipad': [null]
		},
		'9.1': {
			'iphone': [null],
			'ipad': [null]
		}
	},
	android: {
		// Commented out 'till bugs are fixed. Debugging in the failing stock browser isn't that easy.
		/*'4.4': {
			android: [null]
		},*/
		'5.0': {
			android: [null]
		},
	}
};

module.exports = function (config) {
	for (var os in browsers) {
		for (var os_version in browsers[os]) {
			for (var browser in browsers[os][os_version]) {
				for (var i = 0; i < browsers[os][os_version][browser].length; i++) {
					var browser_version = browsers[os][os_version][browser][i];
					var browser_name = os.replace(' ','') + '_' + os_version + '_' + browser + '_' + browser_version;
					config.customLaunchers[browser_name] = {
						base: 'BrowserStack',
						browser: browser,
						browser_version: browser_version,
						os: os,
						os_version: os_version
					};
					config.browsers.push(browser_name);
				}
			}
		}
	}
};
