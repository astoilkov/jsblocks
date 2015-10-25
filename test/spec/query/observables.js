; (function () {

  describe('blocks.observable', function () {
    it('setting an observable value returns the observable itself', function () {
      var observable = blocks.observable('John');

      expect(observable('Doe')).toBe(observable);
    });

    it('unwraps blocks() values', function () {
      var array = [1, 2, 3];
      var observable = blocks.observable(blocks(array));
      expect(observable()).toBe(array);
    });

    it('unwraps observables', function () {
      var array = [1, 2, 3];
      var observable = blocks.observable(blocks.observable(array));
      expect(observable()).toBe(array);
    });

    describe('update()', function () {
      it('does not throw error', function () {
        var observable = blocks.observable();

        spyOn(observable, 'update');

        expect(observable.update).not.toThrow();
      });

      it('returns the observable', function () {
        var observable = blocks.observable(0);

        expect(observable.update()).toBe(observable);
      });

      // updates the elements like
      // info: blocks.observable({ firstName: 'asd' });
      // {{info.firstName}}
      // info.update() - updates the expressions
      // tests for expressions, elements, dependencies, indexes
    });

    describe('toString()', function () {
      it('returns the value', function () {
        var observable = blocks.observable(0);
        expect(observable().toString()).toBe(observable.toString());
      });

      it('returns array value', function () {
        var array = [1, 2, 3];
        var observable = blocks.observable(array);
        expect(observable().toString()).toBe(observable.toString());
        expect(observable.toString()).toBe(array.toString());
      });

      it('summing observable number + number returns number', function () {
        expect(3 + blocks.observable(2)).toBe('32');
      });
    });

    describe('events', function () {
      it('.change() subscribe multiple times', function () {
        var observable = blocks.observable(0);
        var counterA = 0;
        var counterB = 0;

        observable.on('change', function () {
          counterA++;
        });

        observable.on('change', function () {
          counterB++;
        });

        observable(observable() + 1);
        observable(observable() + 1);

        expect(counterA).toBe(2);
        expect(counterB).toBe(2);
      });

      it('change event accepts a context as a second parameter', function () {
        var observable = blocks.observable('');
        var context = {
          value: 'content'
        };
        var isEventFired = false;
        observable.on('change', function () {
          isEventFired = true;
          expect(context.value).toBe('content');
        }, context);

        observable(0);
        expect(isEventFired).toBe(true);
      });

      it('.changing() subscribe multiple times', function () {
        var observable = blocks.observable(0);
        var counterA = 0;
        var counterB = 0;

        observable.on('changing', function () {
          counterA++;
        });

        observable.on('changing', function () {
          counterB++;
        });

        observable(observable() + 1);
        observable(observable() + 1);

        expect(counterA).toBe(2);
        expect(counterB).toBe(2);
      });

      it('changing event accepts a context as a second parameter', function () {
        var observable = blocks.observable('');
        var context = {
          value: 'content'
        };
        var isEventFired = false;
        observable.on('changing', function () {
          isEventFired = true;
          expect(context.value).toBe('content');
        }, context);

        observable(0);
        expect(isEventFired).toBe(true);
      });
    });

    describe('extend()', function () {
      it('does not throw error and calling it without specifying parameters', function () {
        var items = blocks.observable([]).extend();
      });

      it('extending the observable without return a new observable', function () {
        blocks.observable.formatter = function () {
          this.formatValue = blocks.observable();
        };

        var observable = blocks.observable(3);
        var extended = observable.extend('formatter');

        expect(observable).toBe(extended);
        expect(blocks.isObservable(observable.formatValue)).toBe(true);

        blocks.observable.formatter = null;
      });

      it('extending the observable and returning a new one', function () {
        blocks.observable.formatter = function () {
          var result = blocks.observable();
          result.formatValue = blocks.observable();
          return result;
        };

        var observable = blocks.observable(3);
        var extended = observable.extend('formatter');

        expect(observable).not.toBe(extended);
        expect(observable.formatValue).not.toBeDefined();
        expect(blocks.isObservable(extended)).toBe(true);
        expect(blocks.isObservable(extended.formatValue)).toBe(true);

        blocks.observable.formatter = null;
      });

      it('extending the observable and trying to return non observable', function () {
        blocks.observable.formatter = function () {
          var func = function () {

          };
          func.formatValue = blocks.observable();

          return func;
        };

        var observable = blocks.observable();
        var extended = observable.extend('formatter');

        expect(observable).toBe(extended);
        expect(blocks.isObservable(observable.formatValue)).toBe(false);
      });
    });
  });

  describe('blocks.observable (Primitive types) - ', function () {
    it('null', function () {

    });

    it('undefined', function () {

    });

    it('String', function () {
      var stringObservable = blocks.observable('1');

      expect(stringObservable()).toBe('1');
    });

    it('Number', function () {
      var numericObservable = blocks.observable(1);
      var floatObservalble = blocks.observable(1.3);
      var maxValueObservable = blocks.observable(Number.MAX_VALUE);
      var minValueObservable = blocks.observable(Number.MIN_VALUE);
      var positiveInfinityObservable = blocks.observable(Number.POSITIVE_INFINITY);
      var negativeInfinityObservable = blocks.observable(Number.NEGATIVE_INFINITY);
      var notANumberObservable = blocks.observable(Number.NaN);

      expect(numericObservable()).toBe(1);
      expect(floatObservalble()).toBe(1.3);
      expect(maxValueObservable()).toBe(Number.MAX_VALUE);
      expect(minValueObservable()).toBe(Number.MIN_VALUE);
      expect(positiveInfinityObservable()).toBe(Number.POSITIVE_INFINITY);
      expect(negativeInfinityObservable()).toBe(Number.NEGATIVE_INFINITY);
      expect(isNaN(notANumberObservable())).toBe(true);
    });

    it('Boolean', function () {
      var trueObservable = blocks.observable(true);
      var falseObservable = blocks.observable(false);

      expect(trueObservable()).toBe(true);
      expect(falseObservable()).toBe(false);
    });

    it('Boolean(true) successfuly changes value', function () {
      var observable = blocks.observable(true);

      expect(observable()).toBe(true);

      observable(false);

      expect(observable()).toBe(false);
    });

    it('Boolean(false) successfully changes value', function () {
      var observable = blocks.observable(false);

      expect(observable()).toBe(false);

      observable(true);

      expect(observable()).toBe(true);
    });

    it('changing event is fired', function () {
      var observable = blocks.observable('Hello');
      var isEventFired = false;

      observable.on('changing', function () {
        isEventFired = true;
      });

      observable('Bye!');

      expect(isEventFired).toBe(true);
    });

    it('change event is fired', function () {
      var observable = blocks.observable(false);
      var isEventFired = false;

      observable.on('changing', function () {
        isEventFired = true;
      });

      observable(true);

      expect(isEventFired).toBe(true);
    });

    it('changing event is fired (Boolean)', function () {
      var observable = blocks.observable(false),
          isEventFired = false;

      observable.on('changing', function () {
        isEventFired = true;
      });

      observable(true);

      expect(isEventFired).toBe(true);
    });

    it('changing event should not be fired (Boolean)', function () {
      var observable = blocks.observable(true),
          isEventFired = false;

      observable.on('changing', function () {
        isEventFired = true;
      });

      observable(true);

      expect(isEventFired).toBe(false);
    });

    it('changing event should not be fired (Number)', function () {
      var observable = blocks.observable(0),
          isEventFired = false;

      observable.on('changing', function () {
        isEventFired = true;
      });

      observable(0);

      expect(isEventFired).toBe(false);
    });

    it('changing event should not be fired (String)', function () {
      var observable = blocks.observable('One'),
          isEventFired = false;

      observable.on('changing', function () {
        isEventFired = true;
      });

      observable('One');

      expect(isEventFired).toBe(false);
    });

    it('change event is not fired when returning false in changing event', function () {
      var observable = blocks.observable('');
      var isChangingEventFired = false;
      var isChangedEventFired = false;

      observable.on('changing', function () {
        isChangingEventFired = true;
        return false;
      });

      observable.on('change', function () {
        isChangedEventFired = true;
      });

      observable(' ');

      expect(isChangingEventFired).toBe(true);
      expect(isChangedEventFired).toBe(false);
    });

    it('changing event arguments are correct', function () {
      var observable = blocks.observable(0);
      var newValueParameter;
      var oldValueParameter;

      observable.on('changing', function (newValue, oldValue) {
        newValueParameter = newValue;
        oldValueParameter = oldValue;
      });

      observable(1);

      expect(newValueParameter).toBe(1);
      expect(oldValueParameter).toBe(0);
    });

    it('change and changing events are subscribed more than once', function () {
      var observable = blocks.observable(0);
      var numberOfEventCalls = 0;

      observable.on('changing', function () {
        numberOfEventCalls++;
      });

      observable.on('change', function () {
        numberOfEventCalls++;
      });

      observable.on('changing', function () {
        numberOfEventCalls++;
      });

      observable.on('change', function () {
        numberOfEventCalls++;
      });

      observable('');

      expect(numberOfEventCalls).toBe(4);
    });

    it('update function is called', function () {
      var firstName = blocks.observable('Antonio');

      spyOn(firstName, 'update');

      firstName('changed');

      expect(firstName.update).toHaveBeenCalled();
    });
  });

  describe('blocks.observable (Dependency)', function () {
    it('returns the correct value', function () {
      var firstName = blocks.observable('Antonio');
      var lastName = blocks.observable('Stoilkov');
      var fullName = blocks.observable(function () {
        return firstName() + ' ' + lastName();
      });

      expect(fullName()).toBe('Antonio Stoilkov');
    });

    it('this binding equals the context passed', function () {
      var context = {};
      var actualContext;
      var firstName = blocks.observable('Antonio');
      var lastName = blocks.observable('Stoilkov');
      var fullName = blocks.observable(function () {
        actualContext = this;
        return firstName() + ' ' + lastName();
      }, context);

      fullName();
      expect(context).toBe(actualContext);
    });

    it('update is called for the dependency', function () {
      var firstName = blocks.observable('Antonio');
      var lastName = blocks.observable('Stoilkov');
      var fullName = blocks.observable(function () {
        return firstName() + ' ' + lastName();
      });

      spyOn(fullName, 'update');

      firstName('first');

      expect(fullName.update).not.toHaveBeenCalled();

      // dependency should be accessed at least one
      // in order to be added as a dependency in firstName and lastName
      fullName();

      firstName('second');

      expect(fullName.update).toHaveBeenCalled();
    });

    it('update is not called for the not changed observable in the dependency', function () {
      var firstName = blocks.observable('Antonio');
      var lastName = blocks.observable('Stoilkov');
      var fullName = blocks.observable(function () {
        return firstName() + ' ' + lastName();
      });

      spyOn(lastName, 'update');

      firstName('changed');

      expect(lastName.update).not.toHaveBeenCalled();
    });

    // TODO: Fix the problem
    //it('dependencies hierarchy is populated correctly', function () {
    //  var firstName = blocks.observable('John');
    //  var lastName = blocks.observable('Doe');
    //  var description = blocks.observable('description');
    //
    //  var fullName = blocks.observable(function () {
    //    return firstName() + ' ' + lastName();
    //  });
    //
    //  var info = blocks.observable(function () {
    //    return fullName() + ' ' + description();
    //  });
    //
    //  function getDependencies(observable) {
    //    return observable._dependencies;
    //  }
    //
    //  firstName();
    //  lastName();
    //  description();
    //  fullName();
    //  info();
    //
    //
    //  expect(getDependencies(firstName)).toEqual([fullName]);
    //  expect(getDependencies(lastName)).toEqual([fullName]);
    //  expect(getDependencies(description)).toEqual([info]);
    //
    //  expect(getDependencies(fullName)).toEqual([info]);
    //
    //  expect(getDependencies(info)).toEqual(undefined);
    //});
  });

  //http://knockoutjs.com/documentation/computedObservables.html
  describe('blocks.observable (Getter\Setter Dependency)', function () {
    it('getter is executed correctly', function () {
      var observable = blocks.observable({
        get: function () {
          return 'value';
        },
        set: function () {

        }
      });

      expect(observable()).toBe('value');
    });

    it('setter default context', function () {
      var context;
      var observable = blocks.observable({
        get: function () {
          return 'value';
        },
        set: function () {
          context = this;
        }
      });

      observable('just trigger the setter');

      expect(context).toBe(observable);
    });

    it('setter is executed correctly', function () {
      var model = {
        value: 'value'
      };
      var observable = blocks.observable({
        get: function () {
          return this.value;
        },
        set: function (value) {
          this.value = value;
        }
      }, model);

      expect(observable()).toBe('value');

      observable('new value');

      expect(observable()).toBe('new value');
    });

    it('observable.update to have been called', function () {
      var observable = blocks.observable({
        get: function () {
          return 'value';
        },
        set: function (value) {

        }
      });

      spyOn(observable, 'update');

      observable('new value');

      expect(observable.update).toHaveBeenCalled();
    });
  });

  it('can be JSON.stringified', function () {

    var values = [42,  'some string', [1,2,3], {
        a:'some string',
        b: 42,
        c: [1,2,34],
        d: {a: 'hello'},
        e: blocks.observable('that works ?')
      }];

    for (var i = 0; i < values.length; i++) {
      var value = values[i];
      expect(JSON.stringify(value)).toBe(JSON.stringify(blocks.observable(value)));
    }

  });
})();
