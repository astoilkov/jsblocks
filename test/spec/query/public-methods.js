(function (undefined) {

  function initializeFixtures(tagName, attributes) {
    tagName = tagName || 'div';
    attributes = attributes || {};
    var fixture = $('<div>', {
      id: 'sandbox'
    });
    fixture.append($('<' + tagName + '>', blocks.extend({
      id: 'testElement'
    }, attributes)));
    setFixtures(fixture);
  }

  function query(model) {
    blocks.query(model || {}, document.getElementById('sandbox'));
  }

  describe('blocks.unwrapObservable()', function () {
    it('should return the same value when the value passed is not an observable', function () {
      var result = blocks.unwrapObservable(32);
      expect(result).toBe(32);
    });

    it('should return null when null is passed', function () {
      var result = blocks.unwrapObservable(null);
      expect(result).toBe(null);
    });

    it('should return undefined when undefined is passed', function () {
      var result = blocks.unwrapObservable(undefined);
      expect(result).toBe(undefined);
    });

    it('should return the observable value when an observable is passed', function () {
      var result = blocks.unwrapObservable(blocks.observable(0));
      expect(result).toBe(0);
    });

    it('should return the function result when the observable is a function', function () {
      var func = function () {
        return 0;
      },
          result = blocks.unwrapObservable(blocks.observable(func));
      expect(result).toBe(0);
    });

    it('should return empty string when the observable is empty string', function () {
      var result = blocks.unwrapObservable(blocks.observable(''));
      expect(result).toBe('');
    });

    it('should return null when the observable value is null', function () {
      var result = blocks.unwrapObservable(blocks.observable(null));
      expect(result).toBe(null);
    });

    it('should return undefined when the observable value is undefined', function () {
      var result = blocks.unwrapObservable(blocks.observable(undefined));
      expect(result).toBe(undefined);
    });

    it('should return the original object when __identity__ value is supplied', function () {
      var obj = { __identity__: 'observable' };
      var result = blocks.unwrapObservable(obj);
      expect(result).toBe(obj);
    });
  });

  describe('blocks.isObservable()', function () {
    it('isObservable() = true (Primitive types)', function () {
      expect(blocks.isObservable(blocks.observable(3))).toBe(true);
      expect(blocks.isObservable(blocks.observable(null))).toBe(true);
      expect(blocks.isObservable(blocks.observable(undefined))).toBe(true);
      expect(blocks.isObservable(blocks.observable(true))).toBe(true);
      expect(blocks.isObservable(blocks.observable(false))).toBe(true);
      expect(blocks.isObservable(blocks.observable(new Date()))).toBe(true);
      expect(blocks.isObservable(blocks.observable(new Object()))).toBe(true);
      expect(blocks.isObservable(blocks.observable({}))).toBe(true);
    });

    it('isObservable() = true (Dependency)', function () {
      expect(blocks.isObservable(blocks.observable(function () {
        return 1 + 3;
      }))).toBe(true);
    });

    it('isObservable() = true (Array)', function () {
      expect(blocks.isObservable(blocks.observable(new Array()))).toBe(true);
      expect(blocks.isObservable(blocks.observable([]))).toBe(true);
    });

    it('object is not an observable', function () {
      expect(blocks.isObservable({})).toBe(false);
      expect(blocks.isObservable(new Object())).toBe(false);
      expect(blocks.isObservable({
        __identity__: 'value',
        _isDependencyObservable: true
      })).toBe(false);
    });

    it('array is not an observable', function () {
      expect(blocks.isObservable([])).toBe(false);
      expect(blocks.isObservable(new Array())).toBe(false);
    });

    it('date is not an observable', function () {
      expect(blocks.isObservable(new Date())).toBe(false);
    });

    it('number is not an observable', function () {
      expect(blocks.isObservable(3)).toBe(false);
      expect(blocks.isObservable(3.14)).toBe(false);
    });

    it('string is not an observable', function () {
      expect(blocks.isObservable('')).toBe(false);
      expect(blocks.isObservable(new String())).toBe(false);
      expect(blocks.isObservable('__blocks.observable__')).toBe(false);
    });

    it('passing null or undefined returns false', function () {
      expect(blocks.isObservable(null)).toBe(false);
      expect(blocks.isObservable(undefined)).toBe(false);
    });

  });

  describe('blocks.dataItem()', function () {
    it('returns null when null or undefined is passed', function () {
      expect(blocks.dataItem(null)).toBe(null);
      expect(blocks.dataItem(undefined)).toBe(null);
    });

    it('returns null when nothing is passed', function () {
      expect(blocks.dataItem()).toBe(null);
    });

    it('returns null when empty plain object is passed', function () {
      expect(blocks.dataItem({})).toBe(null);
    });

    it('supports passing a jQuery object', function () {
      initializeFixtures();

      $('#testElement').attr('data-query', 'with(context)');

      $('<div>').appendTo($('#testElement')).append($('<div class="testElement"></div>'));

      var context = {};
      query({
        context: context
      });

      expect(blocks.dataItem($('.testElement'))).toBe(context);
    });
  });

  describe('blocks.context()', function () {
    it('returns null when null or undefined is passed', function () {
      expect(blocks.context(null)).toBe(null);
      expect(blocks.context(undefined)).toBe(null);
    });

    it('returns null when nothing is passed', function () {
      expect(blocks.context()).toBe(null);
    });

    it('returns null when empty plain object is passed', function () {
      expect(blocks.context({})).toBe(null);
    });

    it('supports passing a jQuery object', function () {
      initializeFixtures();

      $('#testElement').attr('data-query', 'with(context)');

      $('<div>').appendTo($('#testElement')).append($('<div class="testElement"></div>'));

      var context = {};
      query({
        context: context
      });

      expect(blocks.context($('.testElement')).$this).toBe(context);
    });
  });

  describe('blocks.domQuery()', function () {

  });
})();