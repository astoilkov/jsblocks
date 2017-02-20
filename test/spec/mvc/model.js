(function () {
  var testing = blocks.testing;

  describe('blocks.Application.Model: ', function () {
    var Application;

    beforeEach(function () {
      testing.overrideAjax();
      Application = blocks.Application();
      testing.overrideApplicationStart(Application);
    });
    afterEach(function () {
      blocks.core.deleteApplication();
      //testing.restoreApplicationStart(Application);
      testing.restoreAjax();
    });

    it('is defined without errors', function () {
      Application.Model({});
      Application.start();
    });

    it('dataItem is set correctly from constructor', function () {
      var Product = Application.Model();
      Application.start();
      var model = Product({
        id: 0,
        FirstName: 'Antonio'
      });

      expect(model.id).toBe(0);
      expect(model.FirstName).toBe('Antonio');
    });

    it('default Application.Property creates observable values', function () {
      var Product = Application.Model({
        id: Application.Property(),
        FirstName: Application.Property()
      });
      Application.start();
      var model = Product({
        id: 0,
        FirstName: 'Antonio'
      });
      expect(blocks.isObservable(model.id)).toBe(true);
      expect(blocks.isObservable(model.FirstName)).toBe(true);
    });

    it('dataItem() returns an object with all property values', function () {
      var Product = Application.Model({
        id: Application.Property(),
        FirstName: Application.Property()
      });
      Application.start();

      var model = Product({
        id: 0,
        FirstName: 'Antonio'
      });

      var dataItem = model.dataItem();
      expect(dataItem.id).toBe(0);
      expect(dataItem.FirstName).toBe('Antonio');
    });

    describe('validate()', function () {
      it('', function () {
        var Product = Application.Model({
          property: Application.Property(),
          observable: blocks.observable()
        });
        var product = new Product({
          property: 'property',
          observable: 'observable'
        });
        expect(product.validate).not.toThrow();
      });
    });

    describe('reset()', function () {
      it('sets correctly the dataItem after initialization', function () {
        var Product = Application.Model({
          id: Application.Property(),
          FirstName: Application.Property()
        });
        Application.start();
        var model = Product();
        model.reset({
          id: 0,
          FirstName: 'Antonio'
        });
        expect(blocks.isObservable(model.id)).toBe(true);
        expect(blocks.isObservable(model.FirstName)).toBe(true);
      });

      it('after reset not specified values are set to undefined', function () {
        var Product = Application.Model({
          id: Application.Property(),
          FirstName: Application.Property(),
          LastName: Application.Property()
        });
        Application.start();
        var model = Product({
          FirstName: 'Mihaela',
          LastName: 'Stoilkova'
        });

        model.reset({
          id: 0,
          FirstName: 'Antonio'
        });
        expect(blocks.isObservable(model.id)).toBe(true);
        expect(blocks.isObservable(model.FirstName)).toBe(true);
        expect(blocks.isObservable(model.LastName)).toBe(true);
        expect(model.id()).toBe(0);
        expect(model.FirstName()).toBe('Antonio');
        expect(model.LastName()).toBe(undefined);
      });

      it('after reset not specified values are set to their defaultValue', function () {
        var Product = Application.Model({
          id: Application.Property(),
          FirstName: Application.Property(),
          LastName: Application.Property({
            defaultValue: ''
          }),
        });
        Application.start();
        var model = Product({
          FirstName: 'Mihaela',
          LastName: 'Stoilkova'
        });
        model.reset({
          id: 0,
          FirstName: 'Antonio'
        });
        expect(blocks.isObservable(model.id)).toBe(true);
        expect(blocks.isObservable(model.FirstName)).toBe(true);
        expect(blocks.isObservable(model.LastName)).toBe(true);
        expect(model.id()).toBe(0);
        expect(model.FirstName()).toBe('Antonio');
        expect(model.LastName()).toBe('');
      });

      it('after reset without parameters all values are set to undefined or their defaultValue', function () {
        var Product = Application.Model({
          id: Application.Property(),
          FirstName: Application.Property({
            defaultValue: ''
          })
        });
        Application.start();
        var model = Product({
          id: 0,
          FirstName: 'Antonio'
        });

        model.reset();
        expect(blocks.isObservable(model.id)).toBe(true);
        expect(blocks.isObservable(model.FirstName)).toBe(true);
        expect(model.id()).toBe(undefined);
        expect(model.FirstName()).toBe('');
      });

      it('returns the model object', function () {
        var Product = Application.Model({});
        Application.start();
        var model = Product();
        expect(model.reset()).toBe(model);
      });
    });

    describe('isNew()', function () {
      it('returns true when idAttr is not set', function () {
        var Product = Application.Model();
        Application.start();
        var model = Product({
          id: 0,
          FirstName: 'Antonio'
        });
        expect(model.isNew()).toBe(true);
      });

      it('returns true when id have falsy value', function () {
        var Product = Application.Model({
          options: {
            idAttr: 'id'
          }
        });
        Application.start();
        var model = Product({
          id: undefined,
          FirstName: 'Antonio'
        });
        expect(model.isNew()).toBe(true);
      });

      it('returns false when id have 0 as value', function () {
        var Product = Application.Model({
          options: {
            idAttr: 'id'
          }
        });
        Application.start();
        var model = Product({
          id: 0,
          FirstName: 'Antonio'
        });
        expect(model.isNew()).toBe(false);
      });

      it('returns true when id have value equal to the defaultValue', function () {
        var Product = Application.Model({
          id: Application.Property({
            defaultValue: 0
          }),
          options: {
            idAttr: 'id'
          }
        });
        Application.start();
        var model = Product({
          id: 0,
          FirstName: 'Antonio'
        });
        expect(model.isNew()).toBe(true);
      });
    });

    describe('read()', function () {
      // @TODO
    });

    describe('hasChanges()', function () {
      it('is observable', function () {
        var Product = Application.Model({
          options: {
            idAttr: 'id'
          }
        });
        Application.start();
        var model = Product();
        expect(blocks.isObservable(model.hasChanges)).toBe(true);
      });

      it('returns false when item is new', function () {
        var Product = Application.Model({
          options: {
            idAttr: 'id'
          }
        });
        Application.start();
        var model = Product();
        expect(model.hasChanges()).toBe(false);
      });

      it('returns false by default when item is not new', function () {
        var Product = Application.Model({
          options: {
            idAttr: 'id'
          }
        });
        Application.start();
        var model = Product({
          id: 0
        });
        expect(model.hasChanges()).toBe(false);
      });

      it('returns true when making a change', function () {
        var Product = Application.Model({
          options: {
            idAttr: 'id'
          },
          FirstName: Application.Property()
        });
        Application.start();
        var model = Product({
          id: 0,
          FirstName: 'Antonio'
        });
        expect(model.hasChanges()).toBe(false);
        model.FirstName('Mihaela');
        expect(model.hasChanges()).toBe(true);
      });

      it('doest not detect changes when property is not observable', function () {
        var Product = Application.Model({
          options: {
            idAttr: 'id'
          },

          FirstName: Application.Property({
            isObservable: false
          })
        });
        Application.start();
        var model = Product({
          id: 0,
          FirstName: 'Antonio'
        });
        expect(model.hasChanges()).toBe(false);
        model.FirstName('Mihaela');
        expect(model.hasChanges()).toBe(false);
      });
    });

    it('it wraps an value into an observable if it is specified in the constructor', function () {
      var TestConstructor = Application.Model({
       test: blocks.observable()
      });
      var testItem = TestConstructor({test: 1});
      expect(blocks.isObservable(testItem.test)).toBe(true);
      expect(testItem.test()).toBe(1);
    });

    describe('sync()', function () {
      // @TODO
    });
  });
})();
