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

    describe('blocks.observable.update', function () {
      beforeEach(function () {
        initializeFixtures();
      });

      // BUG
      it('successfully tracks new observables that havent been evaluated in preprocess', function () {
        var condition = blocks.observable(false);
        var className = blocks.observable('Hello');

        setQuery('attr("class", condition() ? className() : "DefaultValue")');

        query({
          condition: condition,
          className: className
        });

        expect($('#testElement')).toHaveAttr('class', 'DefaultValue');

        condition(true);

        expect($('#testElement')).toHaveAttr('class', 'Hello');

        className('Bye');

        expect($('#testElement')).toHaveAttr('class', 'Bye');
      });
    });

    describe('blocks.observable (Primive types) - DOM Manipulations', function () {
      it('blocks.observable.update() updates dom elements', function () {

      });
    });

    describe('blocks.observable (Dependency) - DOM Manipulations', function () {
      beforeEach(function () {
        initializeFixtures();
      });

      it('bug', function () {
        setQuery('html(dependency).setClass("currentClass", shouldSetClass)');

        var model = {
          dependency: blocks.observable(function () {
            return 'Content';
          }),
          shouldSetClass: blocks.observable(true)
        };
        query(model);

        expect($('#testElement')).toHaveClass('currentClass');

        model.shouldSetClass(false);

        expect($('#testElement')).not.toHaveClass('currentClass');
      });

      it('blocks.observable { get: function() {}, set: function() } - updates the dom correctly', function () {
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

        setQuery('html(observable)');

        query({
          observable: observable
        });

        expect($('#testElement')).toHaveHtml('value');

        observable('new value');

        expect($('#testElement')).toHaveHtml('new value');
      });
    });


    describe('blocks.observable (Array) - DOM Manipulations', function () {
      beforeEach(function () {
        var fixture = $('<div>', {
          id: 'sandbox'
        });

        fixture.append($('<ul>', {
          'data-query': 'each(items)',
          id: 'wrapperElement'
        }));

        fixture.children().append($('<li>', {
          id: 'testElement',
          'class': 'testElement'
        }));

        setFixtures(fixture);
      });

      function getItems() {
        return blocks.observable([
            { field: 'Name', value: 'Antonio' },
            { field: 'Age', value: 21 }
        ]);
      }

      it('changing the entire observable value updates the dom correctly', function () {
        var items = getItems();

        setQuery('html(field)');

        query({
          items: items
        });

        items([
          { field: 'Title' },
          { field: 'City' }
        ]);

        expect($('.testElement').length).toBe(2);
        expect($('.testElement').eq(0)).toHaveHtml('Title');
        expect($('.testElement').eq(1)).toHaveHtml('City');
      });

      it('check $index property update', function () {
        var items = getItems();

        setQuery('html("Index: " + $index())');

        query({
          items: items
        });

        items.shift();

        expect($('.testElement').length).toBe(1);
        expect($('.testElement').eq(0)).toHaveHtml('Index: 0');
      });

      it('blocks.observable.push() appends to the dom tree', function () {
        var items = getItems();

        setQuery('setClass(field).html(value)');

        query({
          items: items
        });

        items.push({
          field: 'Additional',
          value: 'Value'
        });

        expect($('.testElement').last()).toHaveClass('Additional');
        expect($('.testElement').last()).toHaveHtml('Value');
      });

      it('blocks.observable.push() appends multiple elements', function () {
        var items = getItems();

        setQuery('setClass(field).html(value)');

        query({
          items: items
        });

        items.push({
          field: 'Additional',
          value: 'Value'
        }, {
          field: 'Additional2',
          value: 'Value2'
        });

        expect($('.testElement').length).toBe(4);
        expect($('.testElement').eq(2)).toHaveClass('Additional');
        expect($('.testElement').eq(2)).toHaveHtml('Value');
        expect($('.testElement').eq(3)).toHaveClass('Additional2');
        expect($('.testElement').eq(3)).toHaveHtml('Value2');
      });

      it('blocks.observable.push() on empty inner element', function () {
        var items = getItems();

        setQuery('setClass(field).html(value)');

        query({
          items: items
        });

        items.pop();
        items.pop();

        items.push({
          field: 'Additional',
          value: 'Value'
        }, {
          field: 'Additional2',
          value: 'Value2'
        });

        expect($('.testElement').length).toBe(2);
        expect($('.testElement').eq(0)).toHaveClass('Additional');
        expect($('.testElement').eq(0)).toHaveHtml('Value');
        expect($('.testElement').eq(1)).toHaveClass('Additional2');
        expect($('.testElement').eq(1)).toHaveHtml('Value2');
      });

      it('blocks.observable.pop() removes the associated element from the dom tree', function () {
        var items = getItems();

        setQuery('setClass(field).html(value)');

        query({
          items: items
        });

        items.pop();
        items.pop();

        expect($('#wrapperElement')).toHaveHtml('');
        expect($('.testElement').length).toBe(0);
      });

      it('blocks.observable.pop() removes associated elements from the dom tree', function () {
        var items = getItems();

        setQuery('setClass(field).html(value)');

        query({
          items: items
        });

        items.push({
          field: 'Additional',
          value: 'Value'
        }, {
          field: 'Additional2',
          value: 'Value2'
        });

        items.pop();
        items.pop();

        expect($('.testElement').length).toBe(2);
        expect($('.testElement').eq(0)).toHaveClass('Name');
        expect($('.testElement').eq(0)).toHaveHtml('Antonio');
        expect($('.testElement').eq(1)).toHaveClass('Age');
        expect($('.testElement').eq(1)).toHaveHtml('21');
      });

      it('blocks.observable.splice() - add', function () {
        var items = getItems();

        setQuery('setClass(field).html(value)');

        query({
          items: items
        });

        items.splice(1, 0, {
          field: 'Additional',
          value: 'Value'
        }, {
          field: 'Additional2',
          value: 'Value2'
        });

        expect($('.testElement').length).toBe(4);
        expect($('.testElement').eq(1)).toHaveClass('Additional');
        expect($('.testElement').eq(1)).toHaveHtml('Value');
        expect($('.testElement').eq(2)).toHaveClass('Additional2');
        expect($('.testElement').eq(2)).toHaveHtml('Value2');
      });

      it('blocks.observable.splice() - remove more than required', function () {
        var items = getItems();

        setQuery('setClass(field).html(value)');

        query({
          items: items
        });

        items.splice(1, 3);

        expect($('.testElement').length).toBe(1);
        expect($('.testElement').eq(0)).toHaveClass('Name');
        expect($('.testElement').eq(0)).toHaveHtml('Antonio');
      });

      it('blocks.observable.splice() - remove', function () {
        var items = getItems();

        setQuery('setClass(field).html(value)');

        query({
          items: items
        });

        items.splice(1, 0, {
          field: 'Additional',
          value: 'Value'
        }, {
          field: 'Additional2',
          value: 'Value2'
        });

        items.splice(1, 1);

        expect($('.testElement').length).toBe(3);
        expect($('.testElement').eq(1)).toHaveClass('Additional2');
        expect($('.testElement').eq(1)).toHaveHtml('Value2');
        expect($('.testElement').last()).toHaveClass('Age');
        expect($('.testElement').last()).toHaveHtml('21');
      });

      it('blocks.observable.splice() - add & remove', function () {
        var items = getItems();

        setQuery('setClass(field).html(value)');

        query({
          items: items
        });

        items.splice(1, 1, {
          field: 'Additional',
          value: 'Value'
        }, {
          field: 'Additional2',
          value: 'Value2'
        });

        expect($('.testElement').length).toBe(3);
        expect($('.testElement').eq(0)).toHaveClass('Name');
        expect($('.testElement').eq(0)).toHaveHtml('Antonio');
        expect($('.testElement').eq(1)).toHaveClass('Additional');
        expect($('.testElement').eq(1)).toHaveHtml('Value');
        expect($('.testElement').eq(2)).toHaveClass('Additional2');
        expect($('.testElement').eq(2)).toHaveHtml('Value2');
      });

      it('blocks.observable.reverse() reveres the dom elements', function () {
        var items = getItems();

        setQuery('setClass(field)');

        query({
          items: items
        });

        items.reverse();

        expect($('.testElement').length).toBe(2);
        expect($('.testElement').eq(0)).toHaveClass('Age');
        expect($('.testElement').eq(1)).toHaveClass('Name');
      });

      it('blocks.observable.sort()', function () {
        var items = blocks.observable([7, 1, 4, 9, 3]);

        setQuery('attr("data-custom-id", $this)');

        query({
          items: items
        });

        items.sort(); // 1, 3, 4, 7, 9

        expect($('.testElement').length).toBe(5);
        expect($('.testElement').eq(0)).toHaveAttr('data-custom-id', '1');
        expect($('.testElement').eq(1)).toHaveAttr('data-custom-id', '3');
        expect($('.testElement').eq(2)).toHaveAttr('data-custom-id', '4');
        expect($('.testElement').eq(3)).toHaveAttr('data-custom-id', '7');
        expect($('.testElement').eq(4)).toHaveAttr('data-custom-id', '9');
      });

      it('blocks.observable.shift()', function () {
        var items = getItems();

        setQuery('setClass(field)');

        query({
          items: items
        });

        items.shift();

        expect($('.testElement').length).toBe(1);
        expect($('.testElement').eq(0)).toHaveClass('Age');
      });

      it('blocks.observable.shift() remove all', function () {
        var items = getItems();

        setQuery('setClass(field)');

        query({
          items: items
        });

        items.shift();
        items.shift();

        expect($('.testElement').length).toBe(0);
        expect($('#wrapperElement')).toHaveHtml('');
      });

      it('blocks.observable.unshift()', function () {
        var items = getItems();

        setQuery('setClass(field)');

        query({
          items: items
        });

        items.unshift({
          field: 'Additional',
          value: 'Value'
        }, {
          field: 'Additional2',
          value: 'Value2'
        });

        expect($('.testElement').length).toBe(4);
        expect($('.testElement').eq(0)).toHaveClass('Additional');
        expect($('.testElement').eq(1)).toHaveClass('Additional2');
      });


      it('blocks.observable.removeAll()', function () {
        var items = getItems();

        setQuery('setClass(field).html(value)');

        query({
          items: items
        });

        items.removeAll();

        expect($('.testElement').length).toBe(0);
        expect($('#wrapperElement')).toHaveHtml('');
      });
    });

    describe('blocks.observable (Array) - not bound to each statement', function () {
      beforeEach(function () {
        var fixture = $('<div>', {
          id: 'sandbox'
        });

        fixture.append($('<input>', {
          type: 'radio',
          id: 'testElement'
        }));

        setFixtures(fixture);
      });

      it('blocks.observable.push()', function () {
        var $wrapper = $('<div>', {
          id: 'eachWrapper',
          'data-query': 'each(items)'
        });
        $wrapper.append($('<span>'));
        $('#sandbox').append($wrapper);

        var items = blocks.observable([2, 3, 4]);

        setQuery('checked(items()[items().length - 1] == 1)');

        query({
          items: items
        });

        expect($('#eachWrapper').children().length).toBe(3);
        expect($('#testElement')).not.toBeChecked();

        items.push(1);

        expect($('#eachWrapper').children().length).toBe(4);
        expect($('#testElement')).toBeChecked();
      });

      it('blocks.observable.sort()', function () {
        var items = blocks.observable([2, 1, 3]);

        setQuery('checked(items()[0] == 1)');

        query({
          items: items
        });

        expect($('#testElement')).not.toBeChecked();

        items.sort();

        expect($('#testElement')).toBeChecked();
      });

      it('blocks.observable.removeAll()', function () {
        var items = blocks.observable([2, 1, 3]);

        setQuery('checked(items().length > 0)');

        query({
          items: items
        });

        expect($('#testElement')).toBeChecked();

        items.removeAll();

        expect($('#testElement')).not.toBeChecked();
      });

      it('blocks.observable.reverse()', function () {
        var items = blocks.observable([2, 1, 3]);

        setQuery('checked(items()[0] == 3)');

        query({
          items: items
        });

        expect($('#testElement')).not.toBeChecked();

        items.reverse();

        expect($('#testElement')).toBeChecked();
      });
    });

    describe('[' + methodName + '] blocks.observable (Array) - does not perform DOM manipulations on elements that do not have each query', function () {
      beforeEach(function () {
        var $fixture = $('<div>', {
          id: 'sandbox'
        });

        $fixture.append($('<div>', {
          id: 'testElement'
        }));

        setFixtures($fixture);

        $('#testElement')
            .append('some content')
            .append($('<div>').append('some more content'));
      });

      function checkTestElementStructure() {
        expect($('#testElement')[0].childNodes.length).toBe(2);
        expect($('#testElement')[0].childNodes[0].nodeValue).toBe('some content');
        expect($('#testElement').children().eq(0)).toHaveHtml('some more content');
      }

      it('blocks.observable.removeAll()', function () {
        var items = blocks.observable([2, 1, 3]);

        setQuery('attr(\'class\', items().length > 0 ? \'hasItems\' : \'noItems\')');

        checkTestElementStructure();

        query({
          items: items
        });

        checkTestElementStructure();
        expect($('#testElement')).toHaveClass('hasItems');

        items.removeAll();

        checkTestElementStructure();
        expect($('#testElement')).toHaveClass('noItems');
        expect($('#testElement')).not.toHaveClass('hasItems');
      });
    });

    describe('blocks.queries.each function (Advanced)', function () {
      it('add operations in table->tr->td structure', function () {
        var fixture = $('<div>', {
          id: 'sandbox'
        });

        var $table = $('<table>', {

        });
        fixture.append($table);

        var $tbody = $('<tbody>', {
          id: 'testElement',
          'data-query': 'each(items)'
        });
        $table.append($tbody);

        var $tr = $('<tr>', {
          'data-query': 'each($root.columns)'
        });
        $tbody.append($tr);

        var $td = $('<td>', {
          'data-query': 'text($parent[$this.field])'
        });
        $tr.append($td);

        setFixtures(fixture);

        function getData() {
          return {
            items: blocks.observable([
                {
                  Name: 'Antonio',
                  Age: 21,
                  Title: 'Developer'
                },
                {
                  Name: 'Mihaela',
                  Age: 26,
                  Title: 'Marketing Specialist'
                }
            ]),
            columns: blocks.observable([
                {
                  field: 'Name'
                },
                {
                  field: 'Age'
                }
            ])
          };
        }

        var model = getData();

        query(model);

        model.columns.splice(0, 0, {
          field: 'Title'
        });

        expect($('#testElement').children().length).toBe(2);
        expect($('#testElement').children().eq(0).children().eq(0)).toHaveHtml('Developer');
        expect($('#testElement').children().eq(1).children().eq(0)).toHaveHtml('Marketing Specialist');

        model.items.splice(0, 0, {
          Name: 'Ludmil',
          Age: 50,
          Title: 'Manager'
        });

        expect($('#testElement').children().length).toBe(3);
        expect($('#testElement').children().eq(0).children().eq(1)).toHaveHtml('Ludmil');
        expect($('#testElement').children().eq(0).children().eq(2)).toHaveHtml('50');
        expect($('#testElement').children().eq(0).children().eq(0)).toHaveHtml('Manager');
        expect($('#testElement').children().eq(1).children().eq(0)).toHaveHtml('Developer');
        expect($('#testElement').children().eq(2).children().eq(0)).toHaveHtml('Marketing Specialist');
      });

      it('add operations in table->tr->td structure with comments', function () {
        var fixture = $('<div>', {
          id: 'sandbox'
        });

        var $table = $('<table>', {

        });
        fixture.append($table);

        var $tbody = $('<tbody>', {
          id: 'testElement',
          'data-query': 'each(items)'
        });
        $table.append($tbody);

        var $tr = $('<tr>', {
          //'data-query': 'each($root.columns)'
        });
        $tbody.append($tr);

        var tr = $tr[0];
        tr.appendChild(document.createComment('blocks each($root.columns)'));

        var $td = $('<td>', {
          'data-query': 'text($parent[$this.field])'
        });
        $tr.append($td);

        tr.appendChild(document.createComment('/blocks'));

        setFixtures(fixture);

        function getData() {
          return {
            items: blocks.observable([{
              Name: 'Antonio',
              Age: 21,
              Title: 'Developer'
            }, {
              Name: 'Mihaela',
              Age: 26,
              Title: 'Marketing Specialist'
            }
            ]),
            columns: blocks.observable([{
              field: 'Name'
            }, {
              field: 'Age'
            }
            ])
          };
        }

        var model = getData();

        query(model);

        model.columns.splice(0, 0, {
          field: 'Title'
        });

        expect($('#testElement').children().length).toBe(2);
        expect($('#testElement').children().eq(0).children().eq(0)).toHaveHtml('Developer');
        expect($('#testElement').children().eq(1).children().eq(0)).toHaveHtml('Marketing Specialist');

        model.items.splice(0, 0, {
          Name: 'Ludmil',
          Age: 50,
          Title: 'Manager'
        });

        expect($('#testElement').children().length).toBe(3);
        expect($('#testElement').children().eq(0).children().eq(1)).toHaveHtml('Ludmil');
        expect($('#testElement').children().eq(0).children().eq(2)).toHaveHtml('50');
        expect($('#testElement').children().eq(0).children().eq(0)).toHaveHtml('Manager');
        expect($('#testElement').children().eq(1).children().eq(0)).toHaveHtml('Developer');
        expect($('#testElement').children().eq(2).children().eq(0)).toHaveHtml('Marketing Specialist');
      });

      it('add operations in table->tbody structure', function () {
        var $fixture = $('<div>', {
          id: 'sandbox'
        });

        var $table = $('<table>', {
          id: 'testElement',
          'data-query': 'each(items)'
        });
        $fixture.append($table);

        var $tbody = $('<tbody>', {

        });
        $table.append($tbody);

        setFixtures($fixture);

        var items = blocks.observable([1, 2, 3]);

        query({
          items: items
        });

        items.push(4, 5);

        expect($('#testElement').children().length).toBe(5);
      });

      it('add operations in table->thead structure', function () {
        var $fixture = $('<div>', {
          id: 'sandbox'
        });

        var $table = $('<table>', {
          id: 'testElement',
          'data-query': 'each(items)'
        });
        $fixture.append($table);

        var $thead = $('<thead>', {

        });
        $table.append($thead);

        setFixtures($fixture);

        var items = blocks.observable([]);

        query({
          items: items
        });

        items.push(4);

        expect($('#testElement').children().length).toBe(1);
      });

      it('add operations in table->tfoot structure', function () {
        var $fixture = $('<div>', {
          id: 'sandbox'
        });

        var $table = $('<table>', {
          id: 'testElement',
          'data-query': 'each(items)'
        });
        $fixture.append($table);

        var $tfoot = $('<tfoot>', {

        });
        $table.append($tfoot);

        setFixtures($fixture);

        var items = blocks.observable([]);

        query({
          items: items
        });

        items.push(4);

        expect($('#testElement').children().length).toBe(1);
      });

      it('add operations for <td> cell', function () {
        var fixture = $('<div>', {
          id: 'sandbox'
        });

        var $table = $('<table>', {
          id: 'testElement'
        });
        fixture.append($table);

        var $tr = $('<tr>', {
          'data-query': 'each(items)'
        });

        $table.append($tr);

        var $td = $('<td>', {
          'class': 'testCell',
          'data-query': 'text($this)'
        });
        $tr.append($td);

        setFixtures(fixture);


        var items = blocks.observable([1, 2, 3]);

        query({
          items: items
        });

        items.push(4, 5);

        expect($('#testElement tr').length).toBe(1);
        expect($('.testCell').length).toBe(5);
        expect($('.testCell').eq(3)).toHaveHtml('4');
        expect($('.testCell').eq(4)).toHaveHtml('5');
      });

      it('add operations for <th> cell', function () {
        var fixture = $('<div>', {
          id: 'sandbox'
        });

        var $table = $('<table>', {
          id: 'testElement'
        });
        fixture.append($table);

        var $tr = $('<tr>', {
          'data-query': 'each(items)'
        });

        $table.append($tr);

        var $td = $('<th>', {
          'class': 'testCell',
          'data-query': 'text($this)'
        });
        $tr.append($td);

        setFixtures(fixture);


        var items = blocks.observable([1, 2, 3]);

        query({
          items: items
        });

        items.push(4, 5);

        expect($('#testElement tr').length).toBe(1);
        expect($('.testCell').length).toBe(5);
        expect($('.testCell').eq(3)).toHaveHtml('4');
        expect($('.testCell').eq(4)).toHaveHtml('5');
      });

      it('add operations for ol->li structure', function () {
        var fixture = $('<div>', {
          id: 'sandbox'
        });

        var $ol = $('<ol>', {
          id: 'testElement',
          'data-query': 'each(items)'
        });
        fixture.append($ol);

        var $li = $('<li>', {
          'class': 'testLi',
          'data-query': 'text($this)'
        });
        $ol.append($li);

        setFixtures(fixture);


        var items = blocks.observable([1, 2, 3]);

        query({
          items: items
        });

        items.push(4, 5);

        expect($('#sandbox ol').length).toBe(1);
        expect($('.testLi').length).toBe(5);
        expect($('.testLi').eq(3)).toHaveHtml('4');
        expect($('.testLi').eq(4)).toHaveHtml('5');
      });

      it('add operations for ul->li structure', function () {
        var fixture = $('<div>', {
          id: 'sandbox'
        });

        var $ul = $('<ul>', {
          id: 'testElement',
          'data-query': 'each(items)'
        });
        fixture.append($ul);

        var $li = $('<li>', {
          'class': 'testLi',
          'data-query': 'text($this)'
        });
        $ul.append($li);

        setFixtures(fixture);


        var items = blocks.observable([1, 2, 3]);

        query({
          items: items
        });

        items.push(4, 5);

        expect($('#sandbox ul').length).toBe(1);
        expect($('.testLi').length).toBe(5);
        expect($('.testLi').eq(3)).toHaveHtml('4');
        expect($('.testLi').eq(4)).toHaveHtml('5');
      });
    });

    describe('blocks.observable (Array) - DOM Manipulations - !!Advanced!! - ', function () {
      beforeEach(function () {
        var fixture = $('<div>', {
          id: 'sandbox'
        });

        fixture.html('<div id="testElement1" data-query="each(items)"><span class="firstName" data-query=\'setClass(FirstName).attr("data-index", $index)\'></span> the best <span class="lastName" data-query="html(LastName)"></span></div>');
        fixture.html(fixture.html() + '<div id="testElement2" data-query="each(items)"><span class="firstName" data-query="setClass(FirstName)" data-index="{{$index}}"></span> the best <span class="lastName">{{LastName}}</span></div>');

        setFixtures(fixture);
      });

      function getItems() {
        return blocks.observable([
            { FirstName: 'FirstName1', LastName: 'LastName1' },
            { FirstName: 'FirstName2', LastName: 'LastName2' }
        ]);
      }

      function expectItems(indexes) {
        var length = indexes.length;

        expect($('#testElement1').children().length).toBe(length * 2);
        expect($('#testElement2').children().length).toBe(length * 2);
        expect($('#testElement1').get(0).childNodes.length).toBe(length * 3);
        expect($('#testElement2').get(0).childNodes.length).toBe(length * 3);

        if (length === 0) {
          expect($('#testElement1')).toHaveHtml('');
          expect($('#testElement2')).toHaveHtml('');
        }

        for (var i = 0; i < length; i++) {
          expect($('#testElement1').find('.firstName').eq(i)).toHaveClass('FirstName' + indexes[i]);
          expect($('#testElement1').find('.firstName').eq(i)).toHaveAttr('data-index', i);
          expect($('#testElement1').find('.lastName').eq(i)).toHaveHtml('LastName' + indexes[i]);
          expect($('#testElement2').find('.firstName').eq(i)).toHaveClass('FirstName' + indexes[i]);
          expect($('#testElement2').find('.firstName').eq(i)).toHaveAttr('data-index', i);
          expect($('#testElement2').find('.lastName').eq(i)).toHaveHtml('LastName' + indexes[i]);
        }
      }

      it('blocks.observable.push() appends multiple elements', function () {
        var items = getItems();

        query({ items: items });

        expectItems([1, 2]);

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

      it('WILD CARD - blocks.observable methods', function () {

      });
    });
  });
})();
