describe('blocks.Application.Property: ', function () {
  var testing = blocks.testing;
  var Application;

  //propertyDefaultOptions: {
  //        defaultValue: '',
  //        isObservable: true,
  //        field: NULL,
  //        changing: NULL,
  //        change: NULL,
  //        value: NULL, // value: function () { this.FirstName + this.LastName }

  //        validateOnChange: false,
  //        maxErrors: 1,
  //        validateInitially: false
  //}

  beforeEach(function () {
    Application = blocks.Application();
    testing.overrideApplicationStart(Application);
  });

  afterEach(function () {
    blocks.core.deleteApplication();
    //testing.restoreApplicationStart(Application);
  });

  describe('extend()', function () {
    blocks.observable.alwaysnumber = function () {
      var _this = this;

      this.on('changing', function (newValue) {
        if (typeof newValue != 'number') {
          newValue = parseInt(newValue, 10);
          if (!blocks.isNaN(newValue)) {
            _this(newValue);
          }
          return false;
        }
      });
    };

    blocks.observable.functioncaller = function (func) {
      this.on('changing', function () {
        func();
      });
    };

    it('extend correctly applies it on the observable', function () {
      var Product = Application.Model({
        age: Application.Property({
          defaultValue: 3
        }).extend('alwaysnumber')
      });
      Application.start();
      var product = Product();
      product.age('5');
      expect(product.age()).toBe(5);
    });

    it('extend supports chaining', function () {
      var isCalled = false;

      var Product = Application.Model({
        age: Application.Property({
          defaultValue: 3
        }).extend('alwaysnumber')
        .extend('functioncaller', function () {
          isCalled = true;
        })
      });

      Application.start();

      var product = Product();

      product.age('5');
      expect(product.age()).toBe(5);
      expect(isCalled).toBe(true);
    });
  });

  it('by default it returns the model or collection', function () {
    var Product = Application.Model({
      age: Application.Property()
    });
    Application.start();
    var product = Product();
    expect(product.age(5)).toBe(product.age);
  });

  it('property without options does not throw error', function () {
    var Product = Application.Model({
      FirstName: Application.Property()
    });
    Application.start();

    // create a product instance
    Product();
  });


  it('changing Application.Property.Defaults affects the default property options', function () {
    Application.Property.Defaults.set('isObservable', false);
    var Product = Application.Model({
      FirstName: Application.Property()
    });
    Application.start();
    var model = Product();
    expect(blocks.isObservable(model.FirstName)).toBe(false);
  });

  it('changing Application.Property.Defaults affects the default property options (without defining the Property)', function () {
    Application.Property.Defaults.set('isObservable', false);
    var Product = Application.Model({});
    Application.start();
    var model = Product({
      FirstName: 'Antonio'
    });
    expect(blocks.isObservable(model.FirstName)).toBe(false);
  });

  it('property is observable by default', function () {
    var Product = Application.Model({
      FirstName: Application.Property()
    });
    Application.start();
    var model = Product();
    expect(blocks.isObservable(model.FirstName)).toBe(true);
  });

  it('property is not observable when isObservable is set to false', function () {
    var Product = Application.Model({
      FirstName: Application.Property({
        isObservable: false
      })
    });
    Application.start();
    var model = Product();
    expect(blocks.isObservable(model.FirstName)).toBe(false);
  });

  it('defaultValue is undefined', function () {
    var Product = Application.Model({
      FirstName: Application.Property()
    });
    Application.start();
    var model = new Product();
    expect(model.FirstName()).toBe(undefined);
  });

  it('defaultValue=null makes the default value to null', function () {
    var Product = Application.Model({
      FirstName: Application.Property({
        defaultValue: null
      })
    });
    Application.start();
    var model = Product();
    expect(model.FirstName()).toBe(null);
  });

  it('defaultValue=(blank) makes the default value to (blank)', function () {
    var Product = Application.Model({
      FirstName: Application.Property({
        defaultValue: '(blank)'
      })
    });
    Application.start();
    var model = Product();
    expect(model.FirstName()).toBe('(blank)');
  });

  it('value is extracted based on the property key', function () {
    var Product = Application.Model({
      FirstName: Application.Property()
    });
    Application.start();
    var model = Product({
      FirstName: 'Antonio'
    });
    expect(model.FirstName()).toBe('Antonio');
  });

  it('value is extracted based on the field option', function () {
    var Product = Application.Model({
      firstName: Application.Property({
        field: 'FirstName'
      })
    });
    Application.start();
    var model = Product({
      FirstName: 'Antonio'
    });
    expect(model.firstName()).toBe('Antonio');
  });

  it('changing event is not fired when value is not changed', function () {
    var isEventFired = false;
    var Product = Application.Model({
      FirstName: Application.Property({
        changing: function () {
          isEventFired = true;
        }
      })
    });
    Application.start();
    var model = Product({
      FirstName: 'Antonio'
    });
    model.FirstName();
    expect(isEventFired).toBe(false);
  });

  it('changing event is fired when value is changed', function () {
    var isEventFired = false;
    var Product = Application.Model({
      FirstName: Application.Property({
        changing: function () {
          isEventFired = true;
        }
      })
    });
    Application.start();
    var model = Product({
      FirstName: 'Antonio'
    });
    model.FirstName('Mihaela');
    expect(isEventFired).toBe(true);
  });

  it('changing event is fired with the correct arguments', function () {
    var newValue;
    var oldValue;

    var Product = Application.Model({
      FirstName: Application.Property({
        changing: function (a, b) {
          newValue = a;
          oldValue = b;
        }
      })
    });
    Application.start();
    var model = Product({
      FirstName: 'Antonio'
    });
    model.FirstName('Mihaela');
    expect(newValue).toBe('Mihaela');
    expect(oldValue).toBe('Antonio');
  });

  it('changing event this points to the model object', function () {
    var that;
    var Product = Application.Model({
      FirstName: Application.Property({
        changing: function () {
          that = this;
        }
      })
    });
    Application.start();
    var model = Product({
      FirstName: 'Antonio'
    });
    model.FirstName('Mihaela');
    expect(that).toBe(model);
  });

  it('change event is fired with the correct arguments', function () {
    var newValue;
    var oldValue;

    var Product = Application.Model({
      FirstName: Application.Property({
        change: function (a, b) {
          newValue = a;
          oldValue = b;
        }
      })
    });
    Application.start();
    var model = Product({
      FirstName: 'Antonio'
    });
    model.FirstName('Mihaela');
    expect(newValue).toBe('Mihaela');
    expect(oldValue).toBe('Antonio');
  });

  it('change event this points to the model object', function () {
    var that;
    var Product = Application.Model({
      FirstName: Application.Property({
        change: function () {
          that = this;
        }
      })
    });
    Application.start();
    var model = Product({
      FirstName: 'Antonio'
    });
    model.FirstName('Mihaela');
    expect(that).toBe(model);
  });

  it('property could define a dependency value', function () {
    var Product = Application.Model({
      FirstName: Application.Property(),
      LastName: Application.Property(),
      FullName: Application.Property({
        value: function () {
          return this.FirstName() + ' ' + this.LastName();
        }
      })
    });
    Application.start();
    var model = Product({
      FirstName: 'Antonio',
      LastName: 'Stoilkov'
    });
    expect(model.FullName()).toBe('Antonio Stoilkov');
  });

  it('property could define a getter/setter', function () {
    var Product = Application.Model({
      FirstName: Application.Property(),
      LastName: Application.Property(),
      FullName: Application.Property({
        value: {
          get: function () {
            return this.FirstName() + ' ' + this.LastName();
          },
          set: function (value) {
            var values = value.split(' ');
            this.FirstName(values[0]);
            this.LastName(values[1]);
          }
        }
      })
    });
    Application.start();
    var model = Product({
      FirstName: 'Antonio',
      LastName: 'Stoilkov'
    });
    expect(model.FullName()).toBe('Antonio Stoilkov');
    model.FullName('Mihaela Stoilkova');
    expect(model.FullName()).toBe('Mihaela Stoilkova');
    expect(model.FirstName()).toBe('Mihaela');
    expect(model.LastName()).toBe('Stoilkova');
  });
});
