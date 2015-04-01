define(function () {
  function createBrowserEnvObject() {
    var windowObj = createWindowContext();

    return blocks.extend(windowObj, {
      document: createDocumentContext()
    });
  }

  function createDocumentContext() {
    var base = createElementMock();

    return blocks.extend(base, {
      __mock__: true,

      doctype: createElementMock(),

      body: createElementMock(),

      createElement: function (tagName) {
        return createElementMock(tagName);
      }
    });
  }

  function createWindowContext() {
    var timeoutId = 0;
    var windowObj = {
      __mock__: true,

      console: createConsoleMock(),

      history: {
        length: 1,
        state: null,
        back: blocks.noop,
        forward: blocks.noop,
        go: blocks.noop,
        pushState: blocks.noop,
        replaceState: blocks.noop
      },

      location: {
        ancestorOrigins: [],
        assign: blocks.noop,
        hash: '',
        host: '',
        hostname: '',
        href: '',
        origin: '',
        pathname: '',
        protocol: '',
        reload: blocks.noop,
        replace: blocks.noop,
        search: ''
      },

      navigator: {
        appCodeName: 'Mozilla',
        appName: 'Netscape',
        appVersion: '5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.115 Safari/537.36',
        cookieEnabled: true,
        doNotTrack: null,
        //geolocation: {},
        hardwareConcurrency: 8,
        language: 'en-us',
        languages: ['en-US', 'en'],
        maxTouchPoints: 0,
        mimeTypes: [],
        onLine: true,
        platform: 'Win32',
        plugins: [],
        product: 'Gecko',
        productSub: '20030107',
        serviceWorker: {},
        userAgent: 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.115 Safari/537.36',
        vendor: 'Google Inc.',
        vendorSub: ''
        // webkitPersistentStorage: {},
        // webkitTemporaryStorage: {}
      },

      addEventListener: blocks.noop,
      removeEventListener: blocks.noop,

      setTimeout: function () {
        timeoutId += 1;
        return timeoutId;
      },
      clearTimeout: blocks.noop,

      setInterval: function () {
        timeoutId += 1;
        return timeoutId;
      },
      clearInterval: blocks.noop
    };

    windowObj.window = windowObj;

    return windowObj;
  }

  function createElementMock(tagName) {
    return {
      accessKey: '',
      tagName: String(tagName).toLowerCase(),
      getElementsByClassName: function () {
        return [];
      },
      getElementsByTagName: function () {
        return [];
      },
      addEventListener: blocks.noop,
      removeEventListener: blocks.noop,
      contains: function () {
        return true;
      }
    };
  }

  function createConsoleMock() {
    return {
      log: blocks.noop
    };
  }

  return createBrowserEnvObject;
});