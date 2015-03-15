(function () {
  var testing = blocks.testing;

  describe('blocks.Application: ', function () {
    var Application;
    beforeEach(function () {
      Application = blocks.Application();
      testing.overrideApplicationStart(Application);
    });
    afterEach(function () {
      blocks.core.deleteApplication();
      //testing.restoreApplicationStart(Application);
    });

    it('baseUrl is set correctly', function () {
      blocks.core.deleteApplication();
      Application = blocks.Application({
        options: {
          baseUrl: 'test'
        }
      });
      testing.overrideApplicationStart(Application);
      expect(Application.options.baseUrl).toBe('test');
      expect(Application.options.history).toBe(true);
    });

    it('propertyDefaultOptions exists', function () {
      expect(Application.Property.Defaults).toBeDefined();
    });

    it('options exists', function () {
      expect(Application.options).toBeDefined();
    });

    it('collectionDefaultOptions exists', function () {
      expect(Application.Collection.Defaults).toBeDefined();
    });

    it('viewDefaultOptions exists', function () {
      expect(Application.View.Defaults).toBeDefined();
    });

    it('application does not raise errors when start() is called more than once', function () {
      Application.start();
      Application.start();
      Application.start();
    });
  });

})();
