(function () {
  var testing = blocks.testing;

  describe('blocks.Application.Collection: ', function () {
    var Application;
    var Products;
    var Remotes;
    var Product;

    beforeEach(function () {
      Application = blocks.Application();
      testing.overrideApplicationStart(Application);

      testing.overrideAjax({
        'Products': function () {
          return testing.createStaticData();
        }
      });

      Product = Application.Model({
        FirstName: Application.Property()
      });

      Products = Application.Collection(Product, {
        options: {
          read: {
            url: 'Products'
          },
          update: {

          },
          destroy: {

          },
          create: {

          }
        },

        customProperty: function () {
          return 'content';
        }
      });

      Remotes = Application.Collection({
        options: {
          read: {

          }
        }
      });

      Application.start();
    });

    afterEach(function () {
      blocks.core.deleteApplication();
      //testing.restoreApplicationStart(Application);
      testing.restoreAjax();
    });

    describe('read()', function () {
      it('returns the collection object', function () {
        var products = Products();
        expect(products.read()).toBe(products);
      });

      it('retrieves all data', function () {
        var products = Products();
        products.read();
        expect(products().length).toBe(2);
        expect(products()[0].FirstName()).toBe('Antonio');
      });

      it('without calling read() data is not selected', function () {
        var products = Products();
        expect(products().length).toBe(0);
      });

      it('repopulates the array with the original items when called', function () {
        var products = Products();
        products.read();
        products.reset(products().filter(function (value) {
          return value.FirstName() != 'Antonio';
        }));
        products.read();
        expect(products().length).toBe(2);
        expect(products()[0].FirstName()).toBe('Antonio');
      });

      it('changes are automatically cleared after read repopulation', function () {
        var products = Products();
        products.read();
        products.add({
          FirstName: 'Test'
        });
        expect(products.hasChanges()).toBe(true);

        products.read();
        expect(products.hasChanges()).toBe(false);
      });

      it('accepts parameters which are passed to the ajax request', function () {

      });

      it('accepts a callback function as last parameter after the additional parameters', function () {

      });

      it('accepts a callback as only parameter', function () {

      });
    });

    describe('clearChanges()', function () {
      it('returns the collection object', function () {
        var products = Products();
        expect(products.clearChanges()).toBe(products);
      });

      it('calls dataSource.clearChanges()', function () {
        // TODO: ....
      });
    });

    describe('hasChanges()', function () {
      it('is observable', function () {
        var products = Products();
        expect(blocks.isObservable(products.hasChanges)).toBe(true);
      });

      it('when no changes hasChanges returns false', function () {
        var products = Products();
        expect(products.hasChanges()).toBe(false);
        products.read();
        expect(products.hasChanges()).toBe(false);
      });

      it('equals dataSource.hasChanges', function () {
        var products = Products();
        expect(products._dataSource.hasChanges).toBe(products.hasChanges);
      });
    });

    describe('sync()', function () {
      it('returns the collection object', function () {
        var products = Products();
        expect(products.sync()).toBe(products);
      });

      it('calls dataSource.sync() method', function () {

      });
    });

    describe('reset()', function () {
      it('reset returns the collection object', function () {
        var products = Products();
        expect(products.reset()).toBe(products);
      });

      it('changes the collection successfully', function () {
        var products = Products();
        products.read();
        expect(products().length).toBe(2);
        products.reset(products().filter(function (value) {
          return value.FirstName() != 'Antonio';
        }));
        expect(products().length).toBe(1);
        expect(products()[0].FirstName()).toBe('Mihaela');
      });

      it('with no parameters clears the entire collection', function () {
        var products = Products();
        products.read();
        products.reset();
        expect(products().length).toBe(0);
      });
    });

    describe('add()', function () {
      it('adding dataItems with different properties does not throw exception', function () {
        var products = Products();
        products.read();

        products.add({
          NonExistentTillNowField: true
        }, {
          AnotherNonExistentFieldTillNow: true
        });
      });
    });

    it('could initialize a initial data', function () {
      var products = Products([{}, {}]);
      expect(products().length).toBe(2);
    });

    it('the initial data is converted to models', function () {
      var products = Products([{ price: 1 }, { price: 2 }, { price: 3 }]);
      var model = products()[0];
      expect(blocks.isFunction(model.dataItem)).toBe(true);
      expect(blocks.isFunction(model.validate)).toBe(true);
      expect(blocks.isFunction(model.isNew)).toBe(true);
      expect(blocks.isFunction(model.sync)).toBe(true);
    });

    it('could initialize a initial data from Application.Collection.Product() type of initialization', function () {
      var products = Products([{}, {}]);
      expect(products().length).toBe(2);
    });

    it('supports custom properties', function () {
      var products = Products();
      expect(products.customProperty()).toBe('content');
    });

    it('methods from an observable are available', function () {

    });

    it('methods from an observable work correctly', function () {

    });

    it('methods from expressions are available', function () {

    });

    it('methods from expressions work correctly', function () {

    });
  });
})();
