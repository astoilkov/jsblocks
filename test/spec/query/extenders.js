(function () {

  describe('blocks.observable.skip', function () {
    it('using a primitive value', function () {
      var items = blocks.observable([1, 2, 3, 4, 5, 6]).extend('skip', 2);
      expect(items()).toEqual([1, 2, 3, 4, 5, 6]);
      expect(items.view()).toEqual([3, 4, 5, 6]);
    });

    it('using an observable', function () {
      var skipCount = blocks.observable(1);
      var items = blocks.observable([1, 2, 3, 4, 5, 6]).extend('skip', skipCount);
      expect(items()).toEqual([1, 2, 3, 4, 5, 6]);

      expect(items.view()).toEqual([2, 3, 4, 5, 6]);

      skipCount(0);

      expect(items.view()).toEqual([1, 2, 3, 4, 5, 6]);

      skipCount(2);

      expect(items.view()).toEqual([3, 4, 5, 6]);
    });

    it('observable correctly updates the skip', function () {
      var skipCount = blocks.observable(100);
      var items = blocks.observable([1, 2, 3, 4, 5, 6]).extend('skip', skipCount);
      expect(items()).toEqual([1, 2, 3, 4, 5, 6]);
      expect(items.view()).toEqual([]);

      skipCount(0);

      expect(items.view()).toEqual([1, 2, 3, 4, 5, 6]);

      skipCount(100);

      expect(items.view()).toEqual([]);
    });
  });

  describe('blocks.observable.take', function () {
    it('using primitive value', function () {
      var items = blocks.observable([1, 2, 3, 4, 5, 6]).extend('take', 3);
      expect(items()).toEqual([1, 2, 3, 4, 5, 6]);
      expect(items.view()).toEqual([1, 2, 3]);
    });

    it('using observable and updates correctly', function () {
      var takeCount = blocks.observable(1);
      var items = blocks.observable([1, 2, 3, 4, 5, 6]).extend('take', takeCount);
      expect(items()).toEqual([1, 2, 3, 4, 5, 6]);
      expect(items.view()).toEqual([1]);

      takeCount(0);

      expect(items.view()).toEqual([]);

      takeCount(100);

      expect(items.view()).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('provide value bigger than the collection takes all the items', function () {
      var items = blocks.observable([1, 2, 3, 4, 5, 6]).extend('take', 100);
      expect(items()).toEqual([1, 2, 3, 4, 5, 6]);
      expect(items.view()).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });

  describe('blocks.observable.sort', function () {
    it('default sorting', function () {
      var items = blocks.observable([5, 3, 7, 1, 9, 11, 2]).extend('sort');
      expect(items()).toEqual([5, 3, 7, 1, 9, 11, 2]);
      expect(items.view()).toEqual([1, 2, 3, 5, 7, 9, 11]);
    });

    it('sort by field', function () {
      var data = [
        { id: 5 },
        { id: 3 },
        { id: 7 },
        { id: 1 }
      ];
      var items = blocks.observable(data).extend('sort', 'id');

      expect(items()).toEqual(data);
      expect(items.view()).toEqual([
        { id: 1 },
        { id: 3 },
        { id: 5 },
        { id: 7 }
      ]);
    });

    it('', function () {
      var data = [

      ];
    });
  });

  describe('blocks.observable.filter', function () {
    it('filter default by providng observable', function () {
      var filterValue = blocks.observable();
      var items = blocks.observable([]).extend('filter', filterValue);
    });
  });
})();