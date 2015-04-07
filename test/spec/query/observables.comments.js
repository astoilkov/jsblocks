(function () {
  testModule('blocks.queries.methodName', function (methodName) {
    function initializeFixtures() {
      var fixture = $('<div>', {
        id: 'sandbox'
      });
      fixture.append($('<div>', {
        id: 'testElement'
      }));
      setFixtures(fixture);
    }

    function setQuery(query) {
      $('#testElement').attr('data-query', query);
    }

    function query(model) {
      var queriesCache = {};
      var query;

      if (methodName == 'update') {
        for (query in blocks.queries) {
          if (blocks.queries[query].update && !(query in { 'each': true, 'with': true, 'render': true })) {
            queriesCache[query] = blocks.queries[query].preprocess;
            blocks.queries[query].preprocess = null;
          }
        }
      }

      blocks.query(model || {}, document.getElementById('sandbox'));

      if (methodName == 'update') {
        for (query in blocks.queries) {
          if (queriesCache[query] && !(query in { 'each': true, 'with': true, 'render': true })) {
            blocks.queries[query].preprocess = queriesCache[query];
          }
        }
      }
    }

    //describe('blocks.observable (Array) - not bound to comment each statement', function () {
    //    var model;

    //    beforeEach(function () {
    //        var $fixture = $('<div>', {
    //            id: 'sandbox'
    //        });

    //        var fixture = $fixture[0];

    //        fixture.appendChild(document.createComment('blocks html(items()[items().length - 1])'));
    //        fixture.appendChild(document.createComment('/blocks'));
    //        fixture.appendChild(document.createComment('blocks html(items().length)'));
    //        fixture.appendChild(document.createComment('/blocks'));

    //        setFixtures($fixture);

    //        model = {
    //            items: blocks.observable([91, 77, 103, 4])
    //        };
    //    });

    //    function expectResult() {
    //        expect($('#sandbox')).toHaveText((model.items()[model.items().length - 1] || '').toString() + model.items().length.toString());
    //    }

    //    it('blocks.observable.push()', function () {

    //        query(model);

    //        expectResult();

    //        model.items.push(1);

    //        expectResult();
    //    });

    //    it('blocks.observable.sort()', function () {
    //        query(model);

    //        expectResult();

    //        model.items.sort();

    //        expectResult();
    //    });

    //    it('blocks.observable.removeAll()', function () {
    //        query(model);

    //        expectResult();

    //        model.items.removeAll();

    //        expectResult();
    //    });

    //    it('blocks.observable.reverse()', function () {
    //        query(model);

    //        expectResult();

    //        model.items.reverse();

    //        expectResult();
    //    });
    //});

    describe('blocks.observable (Array) - Comment Manipulations - !!Advanced!! - ', function () {
      beforeEach(function () {
        var $fixture = $('<div>', {
          id: 'sandbox'
        });

        var fixture = $fixture[0];

        fixture.appendChild(document.createComment('blocks each(items)'));
        $fixture.append($('<span>').addClass('firstName').attr('data-query', 'setClass(FirstName)').html('{{$index}}'));
        fixture.appendChild(document.createTextNode(' the best '));
        $fixture.append($('<span>').addClass('lastName').attr('data-query', 'html(LastName)'));
        fixture.appendChild(document.createComment('/blocks'));

        fixture.appendChild(document.createComment('blocks each(items)'));
        $fixture.append($('<span>').addClass('firstName').attr('data-query', 'setClass(FirstName).html($index)'));
        fixture.appendChild(document.createTextNode(' the best '));
        $fixture.append($('<span>').addClass('lastName').attr('data-query', 'html(LastName)'));
        fixture.appendChild(document.createComment('/blocks'));

        setFixtures($fixture);
      });

      function getItems() {
        return blocks.observable([
            { FirstName: 'FirstName1', LastName: 'LastName1' },
            { FirstName: 'FirstName2', LastName: 'LastName2' }
        ]);
      }

      function expectItems(indexes) {
        var length = indexes.length;

        expect($('#sandbox').children().length).toBe(length * 4);

        if (length === 0) {
          expect($('#sandbox')).toHaveText('');
          expect($('#sandbox')).toHaveText('');
        }

        for (var i = 0; i < length; i++) {
          expect($('#sandbox').find('.firstName').eq(i)).toHaveText(i);
          expect($('#sandbox').find('.firstName').eq(i)).toHaveClass('FirstName' + indexes[i]);
          expect($('#sandbox').find('.lastName').eq(i)).toHaveHtml('LastName' + indexes[i]);
          expect($('#sandbox').find('.firstName').eq(i + length)).toHaveText(i);
          expect($('#sandbox').find('.firstName').eq(i + length)).toHaveClass('FirstName' + indexes[i]);
          expect($('#sandbox').find('.lastName').eq(i + length)).toHaveHtml('LastName' + indexes[i]);

          expect($('#sandbox').find('.firstName').get(i).nextSibling.nodeType).toBe(3);
          expect($('#sandbox').find('.lastName').get(i).previousSibling.nodeType).toBe(3);
          expect($('#sandbox').find('.firstName').get(i + length).nextSibling.nodeType).toBe(3);
          expect($('#sandbox').find('.lastName').get(i + length).previousSibling.nodeType).toBe(3);
        }
      }

      //it('check $index property update', function () {
      //    var items = getItems();

      //    setQuery('html('Index: ' + $index)');

      //    query({
      //        items: items
      //    });

      //    items.shift();

      //    expect($('.testElement').length).toBe(1);
      //    expect($('.testElement').eq(0)).toHaveHtml('Index: 0');
      //});

      it('blocks.observable.push() appends multiple elements', function () {
        var items = getItems();
        query({ items: items });

        items.push(
            { FirstName: 'FirstName3', LastName: 'LastName3' },
            { FirstName: 'FirstName4', LastName: 'LastName4' });

        expectItems([1, 2, 3, 4]);
      });

      it('blocks.observable.push() on empty inner element', function () {
        var items = getItems();
        query({ items: items });

        items.removeAll();

        items.push(
            { FirstName: 'FirstName3', LastName: 'LastName3' },
            { FirstName: 'FirstName4', LastName: 'LastName4' });

        expectItems([3, 4]);
      });

      it('blocks.observable.pop() removes the associated element from the dom tree', function () {
        var items = getItems();
        query({ items: items });

        items.pop();

        expectItems([1]);
      });

      it('blocks.observable.pop() removes associated elements from the dom tree', function () {
        var items = getItems();
        query({ items: items });

        items.push({ FirstName: 'FirstName3', LastName: 'LastName3' });
        items.pop();
        items.pop();

        expectItems([1]);
      });

      it('blocks.observable.splice() - add', function () {
        var items = getItems();
        query({ items: items });

        items.splice(1, 0,
            { FirstName: 'FirstName3', LastName: 'LastName3' },
            { FirstName: 'FirstName4', LastName: 'LastName4' });

        expectItems([1, 3, 4, 2]);
      });

      it('blocks.observable.splice() - remove', function () {
        var items = getItems();
        query({ items: items });

        items.splice(1, 10);

        expectItems([1]);
      });

      it('blocks.observable.splice() - add & remove', function () {
        var items = getItems();
        query({ items: items });

        items.splice(1, 3,
            { FirstName: 'FirstName3', LastName: 'LastName3' },
            { FirstName: 'FirstName4', LastName: 'LastName4' });

        expectItems([1, 3, 4]);
      });

      it('blocks.observable.reverse() reveres the dom elements', function () {
        var items = getItems();
        query({ items: items });

        items.push(
            { FirstName: 'FirstName4', LastName: 'LastName4' },
            { FirstName: 'FirstName3', LastName: 'LastName3' });

        items.reverse();

        expectItems([3, 4, 2, 1]);
      });

      it('blocks.observable.sort()', function () {
        var items = getItems();
        query({ items: items });

        items.reverse();

        items.sort(function (a, b) {
          a = a.FirstName;
          b = b.FirstName;
          if (a < b) {
            return -1;
          }
          if (a > b) {
            return 1;
          }
          return 0;
        });

        expectItems([1, 2]);

        items.push(
            { FirstName: 'FirstName4', LastName: 'LastName4' },
            { FirstName: 'FirstName3', LastName: 'LastName3' });

        items.sort(function (a, b) {
          a = a.FirstName;
          b = b.FirstName;
          if (a < b) {
            return -1;
          }
          if (a > b) {
            return 1;
          }
          return 0;
        });

        expectItems([1, 2, 3, 4]);
      });

      it('blocks.observable.shift()', function () {
        var items = getItems();
        query({ items: items });

        items.shift();

        expectItems([2]);
      });

      it('blocks.observable.shift() remove all', function () {
        var items = getItems();
        query({ items: items });

        items.shift();
        items.shift();

        expectItems([]);
      });

      it('blocks.observable.unshift()', function () {
        var items = getItems();
        query({ items: items });

        items.unshift(
            { FirstName: 'FirstName4', LastName: 'LastName4' },
            { FirstName: 'FirstName3', LastName: 'LastName3' });

        expectItems([4, 3, 1, 2]);
      });

      it('blocks.observable.removeAll()', function () {
        var items = getItems();
        query({ items: items });

        items.removeAll();

        expectItems([]);
      });
    });
  });
})();
