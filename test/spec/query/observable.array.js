describe('blocks.observable (Array)', function () {
  it('blocks.observable', function () {
    var value = [1, 2, 3];
    var observable = blocks.observable(value);

    expect(observable()).toBe(value);
    expect(observable()).not.toBe([1, 2, 3]);
  });

  describe('remove()', function () {
    describe('removing event', function () {
      it('is called', function () {
        var observable = blocks.observable([1, 2, 3]);
        var isCalled = false;

        observable.on('removing', function () {
          isCalled = true;
        });
        expect(isCalled).toBe(false);
        observable.remove(3);
        expect(isCalled).toBe(true);
      });

      it('args.type - should have "removing" as value', function () {
        var observable = blocks.observable([1, 2, 3]);
        var type;

        observable.on('removing', function (args) {
          type = args.type;
        });
        observable.remove(2);
        expect(type).toBe('removing');
      });

      it('args.items - all items that will be removed', function () {
        var observable = blocks.observable([1, 2, 3, 1, 4, 3]);
        var items;

        observable.on('removing', function (args) {
          items = args.items;
        });

        observable.remove(3);

        expect(items).toEqual([3]);
      });

      it('args.index - have the index where the removal starts', function () {
        var observable = blocks.observable([1, 2, 3, 1]);
        var startIndex;

        observable.on('removing', function (args) {
          startIndex = args.index;
        });

        observable.remove(3);

        expect(startIndex).toBe(2);
      });
    });

    describe('remove event', function () {
      it('is called', function () {
        var observable = blocks.observable([1, 2, 3]);
        var isCalled = false;

        observable.on('remove', function () {
          isCalled = true;
        });
        expect(isCalled).toBe(false);
        observable.remove(3);
        expect(isCalled).toBe(true);
      });

      it('args.type - should have "remove" as value', function () {
        var observable = blocks.observable([1, 2, 3]);
        var type;

        observable.on('remove', function (args) {
          type = args.type;
        });
        observable.remove(2);
        expect(type).toBe('remove');
      });

      it('args.items - all items that will be removed', function () {
        var observable = blocks.observable([1, 2, 3, 1, 4, 3]);
        var items;

        observable.on('remove', function (args) {
          items = args.items;
        });

        observable.remove(3);

        expect(items).toEqual([3]);
      });

      it('args.index - have the index where the removal starts', function () {
        var observable = blocks.observable([1, 2, 3, 1]);
        var startIndex;

        observable.on('remove', function (args) {
          startIndex = args.index;
        });

        observable.remove(3);

        expect(startIndex).toBe(2);
      });
    });
  });

  describe('removeAll()', function () {
    it('when called without any parameters removes all elements', function () {
      var observable = blocks.observable([1, 2, 3]);

      observable.removeAll();

      expect(observable().length).toBe(0);
    });

    it('returns the observable itself', function () {
      var observable = blocks.observable([1, 2, 3]);

      expect(observable.removeAll()).toBe(observable);
    });

    describe('removing event', function () {
      it('is called', function () {
        var observable = blocks.observable([1, 2, 3]);
        var isCalled = false;

        observable.on('removing', function () {
          isCalled = true;
        });

        expect(isCalled).toBe(false);
        observable.removeAll();
        expect(isCalled).toBe(true);
      });

      it('args.type should have "removing" as value', function () {
        var observable = blocks.observable([1, 2, 3]);
        var type = false;

        observable.on('removing', function (args) {
          type = args.type;
        });

        observable.removeAll();
        expect(type).toBe('removing');
      });

      it('args.items when called without parameters to be filled with all items', function () {
        var observable = blocks.observable([1, 2, 3]);
        var items;

        observable.on('removing', function (args) {
          items = args.items;
        });

        observable.removeAll();
        expect(items).toEqual([1, 2, 3]);
      });

      it('args.index when called without parameters have value 0', function () {
        var observable = blocks.observable([1, 2, 3]);
        var index;

        observable.on('removing', function (args) {
          index = args.index;
        });

        observable.removeAll();

        expect(index).toBe(0);
      });

      it('args.items are single value arrays when called with argument', function () {
        var observable = blocks.observable([1, 1, 2, 3, 1, 1, 1]);
        var itemsArray = [];

        observable.on('removing', function (args) {
          itemsArray.push(args.items);
        });
        observable.removeAll(1);

        expect(itemsArray).toEqual([[1], [1], [1], [1], [1]]);
      });

      it('args.index is the current removed index when called with argument', function () {
        var observable = blocks.observable([1, 1, 2, 3, 1, 1, 1]);
        var itemsArray = [];

        observable.on('remove', function (args) {
          itemsArray.push(args.items);
        });
        observable.removeAll(1);

        expect(itemsArray).toEqual([[1], [1], [1], [1], [1]]);
      });
    });
  });

  describe('concat()', function () {
    it('concats an array', function () {
      var observable = blocks.observable([1, 2, 3]);

      observable.concat([4, 5], [6, 7]);
      expect(observable()[3]).toBe(undefined);
      expect(observable()[5]).toBe(undefined);
      expect(observable()[7]).toBe(undefined);
      expect(observable().length).toBe(3);
    });

    it('have correct return value', function () {
      var observable = blocks.observable([1, 2, 3]);

      var result = observable.concat([4, 5], [6, 7]);
      expect(result[3]).toBe(4);
      expect(result[5]).toBe(6);
      expect(result[7]).toBe(undefined);
      expect(result.length).toBe(7);
    });
  });

  describe('pop()', function () {
    it('reduces the array size by one', function () {
      var observable = blocks.observable(['a', 'b', 'c']);

      observable.pop();

      expect(observable().length).toBe(2);
    });

    it('removes the last value in an array', function () {
      var observable = blocks.observable(['a', 'b', 'c']);

      observable.pop();

      expect(observable()[0]).toBe('a');
      expect(observable()[1]).toBe('b');
      expect(observable()[2]).not.toBeDefined();
    });

    it('does nothting when calling it for an empty array', function () {
      var observable = blocks.observable([]);

      observable.pop();

      expect(observable().length).toBe(0);
    });

    it('does not call removing and remove events when calling it on an empty array', function () {
      var observable = blocks.observable([]);
      var isCalled = false;
      observable.on('removing remove', function () {
        isCalled = true;
      });

      observable.pop();

      expect(isCalled).toBe(false);
    });

    it('returns the removed value', function () {
      var observable = blocks.observable([1, 2, 3]);

      expect(observable.pop()).toBe(3);
    });
  });

  describe('push()', function () {
    it('adds new items to the end of the array', function () {
      var observable = blocks.observable([]);

      observable.push(1);
      observable.push('a');

      expect(observable()[0]).toBe(1);
      expect(observable()[1]).toBe('a');
      expect(observable().length).toBe(2);
    });

    it('returns the length of the array after the insertion', function () {
      var observable = blocks.observable([1, [2], 3]);

      expect(observable.push([1, 2, 3, 6, 7, 9])).toBe(4);
    });
  });

  it('blocks.observable.reverse function', function () {
    var observable = blocks.observable([3, 4, 5]);

    observable.reverse();

    expect(observable()[0]).toBe(5);
    expect(observable()[1]).toBe(4);
    expect(observable()[2]).toBe(3);
    expect(observable().length).toBe(3);
  });

  describe('reverse', function () {
    it('reverses the array values', function () {
      var observable = blocks.observable([1, 2]);

      expect(observable.reverse()[0]).toBe(2);
    });

    it('does nothing when calling it on an empty array', function () {
      var observable = blocks.observable([]);

      observable.reverse();

      expect(observable().length).toBe(0);
    });
  });

  describe('shift()', function () {
    it('removes the first element in the array', function () {
      var observable = blocks.observable([2, 3]);

      observable.shift();

      expect(observable().length).toBe(1);
      expect(observable()[0]).toBe(3);
    });

    it('returns the removed element', function () {
      var observable = blocks.observable([3, 1, 2]);

      expect(observable.shift()).toBe(3);
    });

    it('does nothing when called on empty array', function () {
      var observable = blocks.observable([]);

      expect(observable.shift()).not.toBeDefined();
      expect(observable().length).toBe(0);
    });
  });

  describe('unshift()', function () {
    it('blocks.observable.unshift function (add)', function () {
      var observable = blocks.observable(['c', 'd', 'f']);

      expect(observable.unshift('a', 'b')).toBe(5);
      expect(observable()[0]).toBe('a');
      expect(observable()[1]).toBe('b');
      expect(observable().length).toBe(5);
    });

    it('does nothing when passed no arguments', function () {
      var observable = blocks.observable(['a', 'b', 'c']);

      expect(observable.unshift()).toBe(3);
      expect(observable().length).toBe(3);
    });

    it('blocks.observable.unshift function (call with empty array)', function () {
      var observable = blocks.observable([]);

      expect(observable.unshift()).toBe(0);
      expect(observable()[0]).not.toBeDefined();
      expect(observable().length).toBe(0);
    });
  });

  describe('sort()', function () {
    it('sorts the items in the array', function () {
      var observable = blocks.observable([4, 1, 3]);

      observable.sort();

      expect(observable()[0]).toBe(1);
      expect(observable()[1]).toBe(3);
      expect(observable()[2]).toBe(4);
      expect(observable().length).toBe(3);
    });

    it('sort returns the sorted array', function () {
      var observable = blocks.observable([7, 2]);

      expect(observable.sort()[0]).toBe(2);
      expect(observable.sort()[1]).toBe(7);
    });
  });

  describe('splice()', function () {
    it('removes items from the array', function () {
      var observable = blocks.observable([1, 2, 3]);
      observable.splice(1, 2);

      expect(observable()).toEqual([1]);
    });

    it('removing items from an array returns the removed items', function () {
      var observable = blocks.observable([1, 2, 3]);

      expect(observable.splice(1, 1)).toEqual([2]);
    });

    it('removing supports negative indexes', function () {
      // TODO: Implement
    });

    it('adds items to the array', function () {
      var observable = blocks.observable([1, 2, 3]);
      observable.splice(3, 0, 4, 5);

      expect(observable()).toEqual([1, 2, 3, 4, 5]);
    });

    it('only adding items to the array returns empty array', function () {
      var observable = blocks.observable([1, 2, 3]);

      expect(observable.splice(0, 0, 4, 5)).toEqual([]);
    });

    it('adds items to the end of the array when index is bigger than the length of the array', function () {
      var observable = blocks.observable([1, 2, 3]);

      observable.splice(100, 0, 4, 5);

      expect(observable()).toEqual([1, 2, 3, 4, 5]);
    });

    it('adding supports negative indexes', function () {
      // TODO: Implement
    });

    it('removes and adds items to the array', function () {
      var fruits = blocks.observable(['Banana', 'Orange', 'Apple', 'Mango']);
      fruits.splice(2, 0, 'Lemon', 'Kiwi'); // Banana, Orange, Lemon, Kiwi, Apple, Mango
    });

    describe('events', function () {
      describe('removing event', function () {
        it('is called', function () {
          var observable = blocks.observable([1, 2, 3]);
          var isCalled = false;

          observable.on('removing', function () {
            isCalled = true;
          });

          expect(isCalled).toBe(false);
          observable.splice(1, 1);
          expect(isCalled).toBe(true);
        });

        it('is not called when number of items for deletion are 0', function () {
          var observable = blocks.observable([1, 2, 3]);
          var isCalled = false;

          observable.on('removing', function () {
            isCalled = true;
          });

          observable.splice(1, 0);

          expect(isCalled).toBe(false);
        });

        it('is not called when removing items outside of the array bounds', function () {
          var observable = blocks.observable([1, 2, 3]);
          var isCalled = false;

          observable.on('removing', function () {
            isCalled = true;
          });

          observable.splice(3, 10);

          expect(isCalled).toBe(false);
        });

        it('is not called when adding', function () {
          var observable = blocks.observable([1, 2, 3]);
          var isCalled = false;

          observable.on('removing', function () {
            isCalled = true;
          });

          observable.splice(0, 0, 4, 5);

          expect(isCalled).toBe(false);
        });

        it('args.type - should have "removing" as value', function () {
          var observable = blocks.observable([1, 2, 3]);
          var type;

          observable.on('removing', function (args) {
            type = args.type;
          });
          observable.splice(0, 1);
          expect(type).toBe('removing');
        });

        it('args.items - all items that will be removed', function () {
          var observable = blocks.observable([1, 2, 3, 1, 4, 3]);
          var items;

          observable.on('removing', function (args) {
            items = args.items;
          });

          observable.splice(2, 1);

          expect(items).toEqual([3]);
        });

        it('args.index - have the index where the removal starts', function () {
          var observable = blocks.observable([1, 2, 3, 1]);
          var startIndex;

          observable.on('removing', function (args) {
            startIndex = args.index;
          });

          observable.splice(0, 2);

          expect(startIndex).toBe(0);
        });
      });

      describe('remove event', function () {
        it('is called', function () {
          var observable = blocks.observable([1, 2, 3]);
          var isCalled = false;

          observable.on('remove', function () {
            isCalled = true;
          });
          expect(isCalled).toBe(false);
          observable.splice(1, 1);
          expect(isCalled).toBe(true);
        });

        it('is not called when number of items for deletion are 0', function () {
          var observable = blocks.observable([1, 2, 3]);
          var isCalled = false;

          observable.on('remove', function () {
            isCalled = true;
          });

          observable.splice(1, 0);

          expect(isCalled).toBe(false);
        });

        it('is not called when removing items outside of the array bounds', function () {
          var observable = blocks.observable([1, 2, 3]);
          var isCalled = false;

          observable.on('remove', function () {
            isCalled = true;
          });

          observable.splice(3, 10);

          expect(isCalled).toBe(false);
        });

        it('is not called when adding', function () {
          var observable = blocks.observable([1, 2, 3]);
          var isCalled = false;

          observable.on('remove', function () {
            isCalled = true;
          });

          observable.splice(0, 0, 4, 5);

          expect(isCalled).toBe(false);
        });

        it('args.type - should have "remove" as value', function () {
          var observable = blocks.observable([1, 2, 3]);
          var type;

          observable.on('remove', function (args) {
            type = args.type;
          });
          observable.splice(0, 1);
          expect(type).toBe('remove');
        });

        it('args.items - all items that will be removed', function () {
          var observable = blocks.observable([1, 2, 3, 1, 4, 3]);
          var items;

          observable.on('remove', function (args) {
            items = args.items;
          });

          observable.splice(2, 2);

          expect(items).toEqual([3, 1]);
        });

        it('args.index - have the index where the removal starts', function () {
          var observable = blocks.observable([1, 2, 3, 1]);
          var startIndex;

          observable.on('remove', function (args) {
            startIndex = args.index;
          });

          observable.splice(3, 2);

          expect(startIndex).toBe(3);
        });
      });

      describe('adding event', function () {
        it('is called', function () {
          var observable = blocks.observable([1, 2, 3]);
          var isCalled = false;

          observable.on('adding', function () {
            isCalled = true;
          });
          expect(isCalled).toBe(false);
          observable.splice(1, 0, 1);
          expect(isCalled).toBe(true);
        });

        it('is called when adding items outside of the array bounds', function () {
          var observable = blocks.observable([1, 2, 3]);
          var isCalled = false;

          observable.on('adding', function () {
            isCalled = true;
          });

          observable.splice(10, 0, 4);

          expect(isCalled).toBe(true);
        });

        it('is not called when number of items for adding are 0', function () {
          var observable = blocks.observable([1, 2, 3]);
          var isCalled = false;

          observable.on('adding', function () {
            isCalled = true;
          });

          observable.splice(1, 0);

          expect(isCalled).toBe(false);
        });

        it('is not called when removing', function () {
          var observable = blocks.observable([1, 2, 3]);
          var isCalled = false;

          observable.on('adding', function () {
            isCalled = true;
          });

          observable.splice(0, 1);

          expect(isCalled).toBe(false);
        });

        it('args.type - should have "adding" as value', function () {
          var observable = blocks.observable([1, 2, 3]);
          var type;

          observable.on('adding', function (args) {
            type = args.type;
          });
          observable.splice(0, 0, 1);

          expect(type).toBe('adding');
        });

        it('args.items contains the items that will be added', function () {
          var observable = blocks.observable([1, 2, 3, 1, 4, 3]);
          var items;

          observable.on('adding', function (args) {
            items = args.items;
          });

          observable.splice(1, 0, 1, 2, 3);

          expect(items).toEqual([1, 2, 3]);
        });

        it('args.index - have the index where the removal starts', function () {
          var observable = blocks.observable([1, 2, 3, 1]);
          var startIndex;

          observable.on('adding', function (args) {
            startIndex = args.index;
          });

          observable.splice(3, 0, 1);

          expect(startIndex).toBe(3);
        });
      });

      describe('add event', function () {
        it('is called', function () {
          var observable = blocks.observable([1, 2, 3]);
          var isCalled = false;

          observable.on('add', function () {
            isCalled = true;
          });
          expect(isCalled).toBe(false);
          observable.splice(1, 0, 1);
          expect(isCalled).toBe(true);
        });

        it('is called when adding items outside of the array bounds', function () {
          var observable = blocks.observable([1, 2, 3]);
          var isCalled = false;

          observable.on('add', function () {
            isCalled = true;
          });

          observable.splice(10, 0, 4);

          expect(isCalled).toBe(true);
        });

        it('is not called when number of items for adding are 0', function () {
          var observable = blocks.observable([1, 2, 3]);
          var isCalled = false;

          observable.on('add', function () {
            isCalled = true;
          });

          observable.splice(1, 0);

          expect(isCalled).toBe(false);
        });

        it('is not called when removing', function () {
          var observable = blocks.observable([1, 2, 3]);
          var isCalled = false;

          observable.on('add', function () {
            isCalled = true;
          });

          observable.splice(0, 1);

          expect(isCalled).toBe(false);
        });

        it('args.type - should have "add" as value', function () {
          var observable = blocks.observable([1, 2, 3]);
          var type;

          observable.on('add', function (args) {
            type = args.type;
          });
          observable.splice(0, 0, 1);

          expect(type).toBe('add');
        });

        it('args.items contains the items that will be added', function () {
          var observable = blocks.observable([1, 2, 3, 1, 4, 3]);
          var items;

          observable.on('adding', function (args) {
            items = args.items;
          });

          observable.splice(1, 0, 1, 2, 3);

          expect(items).toEqual([1, 2, 3]);
        });

        it('args.index - have the index where the removal starts', function () {
          var observable = blocks.observable([1, 2, 3, 1]);
          var startIndex;

          observable.on('add', function (args) {
            startIndex = args.index;
          });

          observable.splice(3, 0, 1);

          expect(startIndex).toBe(3);
        });
      });
    });
  });

  describe('slice()', function () {
    it('blocks.observable.slice function', function () {
      var fruits = blocks.observable(['Banana', 'Orange', 'Lemon', 'Apple', 'Mango']);
      var citrus = fruits.slice(1, 3); // Orange, Lemon
      expect(citrus[0]).toBe('Orange');
      expect(citrus[1]).toBe('Lemon');
      expect(citrus.length).toBe(2);
    });

    it('blocks.observable.slice function (only first parameter)', function () {
      var fruits = blocks.observable(['Banana', 'Orange', 'Lemon', 'Apple', 'Mango']);
      var citrus = fruits.slice(1); // Orange, Lemon, Apple, Mango
      expect(citrus[0]).toBe('Orange');
      expect(citrus[1]).toBe('Lemon');
      expect(citrus.length).toBe(4);
    });

    it('blocks.observable.slice function (only first parameter nagative)', function () {
      var fruits = blocks.observable(['Banana', 'Orange', 'Lemon', 'Apple', 'Mango']);
      var citrus = fruits.slice(-3); // Lemon, Apple, Mango
      expect(citrus[0]).toBe('Lemon');
      expect(citrus[1]).toBe('Apple');
      expect(citrus[2]).toBe('Mango');
      expect(citrus.length).toBe(3);
    });

    it('blocks.observable.slice function (with negative values)', function () {
      var fruits = blocks.observable(['Banana', 'Orange', 'Lemon', 'Apple', 'Mango']);
      var myBest = fruits.slice(-3, -1); // Lemon, Apple
      expect(myBest[0]).toBe('Lemon');
      expect(myBest[1]).toBe('Apple');
      expect(myBest.length).toBe(2);
    });

    it('blocks.observable.slice function (observable is not changed)', function () {
      var fruits = blocks.observable(['Banana', 'Orange', 'Lemon', 'Apple', 'Mango']);
      var myBest = fruits.slice(1); // Orange, Lemon, Apple, Mango
      expect(myBest[0]).toBe('Orange');
      expect(myBest[1]).toBe('Lemon');
      expect(myBest[2]).toBe('Apple');
      expect(myBest[3]).toBe('Mango');
      expect(myBest.length).toBe(4);
    });
  });

  describe('join()', function () {
    it('blocks.observable.join function', function () {
      var fruits = blocks.observable(['Banana', 'Orange', 'Apple', 'Mango']);
      var energy = fruits.join(); // Banana, Orange, Apple, Mango
      expect(energy).toBe('Banana,Orange,Apple,Mango');
    });

    it('blocks.observable.join function (with parameter specified)', function () {
      var fruits = blocks.observable(['Banana', 'Orange', 'Apple', 'Mango']);
      var energy = fruits.join(' and '); // Banana and Orange and Apple and Mango
      expect(energy).toBe('Banana and Orange and Apple and Mango');
    });
  });

  // TODO: Should indexOf and lastIndexOf included by default?
  //it('blocks.observable.indexOf function', function () {
  //    var observable = blocks.observable([4, 3, 7, 3, 1, 5, 1]);

  //    expect(observable.indexOf(3)).toBe(1);
  //});

  //it('blocks.observable.lastIndexOf function', function () {
  //    var observable = blocks.observable([4, 3, 7, 3, 1, 5, 1]);

  //    expect(observable.lastIndexOf(3)).toBe(3);
  //});
});