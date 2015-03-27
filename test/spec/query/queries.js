
(function () {
  function setQuery(query) {
    $('#testElement').attr('data-query', query);
  }

  function query(model) {
    blocks.query(model || {}, document.getElementById('sandbox'));
  }

  describe('blocks.queries', function () {
    beforeEach(function () {
      var fixture = $('<div>', {
        id: 'sandbox'
      });
      fixture.append($('<button>', {
        id: 'testElement'
      }));
      setFixtures(fixture);
    });

    it('observable used in two queries on the same element updates correctly', function () {
      var value = blocks.observable('first');

      setQuery('html($this).attr(\'class\', $this)');

      query(value);

      value('second');

      expect($('#testElement')).toHaveHtml('second');
      expect($('#testElement')).toHaveAttr('class', 'second');
    });
  });

  describe('blocks.queries.if', function () {
    beforeEach(function () {
      var fixture = $('<div>', {
        id: 'sandbox'
      });
      fixture.append($('<button>', {
        id: 'testElement'
      }));
      setFixtures(fixture);
    });

    it('first query is executed when passed true as value', function () {
      setQuery('if(true, html(true), html(false))');

      query();

      expect($('#testElement')).toHaveHtml('true');
    });

    it('second query is executed when passed false as value', function () {
      setQuery('if (false, html(true), html(false))');

      query();

      expect($('#testElement')).toHaveHtml('false');
    });

    it('query after truthy if is executed', function () {
      setQuery('if(1, html(1), html(0)).html("override"))');

      query();

      expect($('#testElement')).toHaveHtml('override');
    });

    it('query after false if is executed', function () {
      setQuery('if (0, html(1), html(0)).html("override")');

      query();

      expect($('#testElement')).toHaveHtml('override');
    });

    it('first query does not throw error when not specified and should be executed', function () {
      setQuery('if(true)');

      query();

      expect($('#testElement')).toHaveHtml('');
    });

    it('second query does not throw error when not specified and should be executed', function () {
      setQuery('if(false, html(1)');

      query();

      expect($('#testElement')).toHaveHtml('');
    });

    it('observable is updated when used in a if statement', function () { // BUG
      var isChecked = blocks.observable(false);

      setQuery('if(isChecked, html("Checked"), html("Not Checked"))');

      query({
        isChecked: isChecked
      });

      expect($('#testElement')).toHaveHtml('Not Checked');

      isChecked(true);

      expect($('#testElement')).toHaveHtml('Checked');
    });

    it('click handler is attached after if query', function () {
      setQuery('if(null, html(true), html(null)).click(_click)');

      var isClickFired = false;

      query({
        _click: function () {
          isClickFired = true;
        }
      });

      $('#testElement').get(0).click();
      expect(isClickFired).toBe(true);
    });
  });

  describe('blocks.queries.ifnot', function () {
    beforeEach(function () {
      var fixture = $('<div>', {
        id: 'sandbox'
      });
      fixture.append($('<button>', {
        id: 'testElement'
      }));
      setFixtures(fixture);
    });

    it('first query is executed when passed false as value', function () {
      setQuery('ifnot(false, html(true), html(false))');

      query();

      expect($('#testElement')).toHaveHtml('true');
    });

    it('second query is executed when passed true as value', function () {
      setQuery('ifnot (true, html(true), html(false))');

      query();

      expect($('#testElement')).toHaveHtml('false');
    });

    it('query after truthy ifnot is executed', function () {
      setQuery('ifnot(1, html(1), html(0)).html("override"))');

      query();

      expect($('#testElement')).toHaveHtml('override');
    });

    it('query after false ifnot is executed', function () {
      setQuery('ifnot (0, html(1), html(0)).html("override")');

      query();

      expect($('#testElement')).toHaveHtml('override');
    });

    it('first query does not throw error when not specified and should be executed', function () {
      setQuery('ifnot(false)');

      query();

      expect($('#testElement')).toHaveHtml('');
    });

    it('second query does not throw error when not specified and should be executed', function () {
      setQuery('ifnot(true, html(1)');

      query();

      expect($('#testElement')).toHaveHtml('');
    });

    it('click handler is attached after if query', function () {
      setQuery('ifnot(null, html(true), html(null)).click(_click)');

      var isClickFired = false;

      query({
        _click: function () {
          isClickFired = true;
        }
      });

      $('#testElement').get(0).click();
      expect(isClickFired).toBe(true);
    });
  });

  describe('blocks.queries.each', function () {
    beforeEach(function () {
      var fixture = $('<div>', {
        id: 'sandbox'
      });

      fixture.append($('<ul>', {
        'data-query': 'each(items)',
        id: 'wrapperElement'
      }));

      fixture.children().append($('<li>', {
        id: 'testElement'
      }));

      setFixtures(fixture);
    });

    it('does not throw error when passing observable with undefined value', function () {
      query({
        items: blocks.observable()
      });

      expect($('#wrapperElement').children().length).toBe(0);
    });

    it('renders the correct number of elements by providing an Array', function () {
      query({
        items: [1, 2, 3, true, false, null, undefined]
      });

      expect($('#wrapperElement').children().length).toBe(7);
    });

    it('renders the correct number of elements by providing an Object', function () {
      query({
        items: {
          first: 1,
          second: false,
          third: undefined,
          fourth: null,
          fifth: 0
        }
      });

      expect($('#wrapperElement').children().length).toBe(5);
    });

    it('correctly binds the objects from an Array', function () {
      setQuery('html($this)');

      query({
        items: ['hello', 'world']
      });

      expect($('#wrapperElement').children().eq(0)).toHaveHtml('hello');
      expect($('#wrapperElement').children().eq(1)).toHaveHtml('world');
    });

    it('correctly binds the objects from an Object', function () {
      setQuery('html(text)');

      query({
        items: {
          first: {
            text: 'hello'
          },
          second: {
            text: 'world'
          }
        }
      });

      expect($('#wrapperElement')).toContainHtml('hello');
      expect($('#wrapperElement')).toContainHtml('world');
    });

    it('correctly binds to observable array', function () {
      setQuery('setClass($this, true)');

      query({
        items: blocks.observable(['first', 'second'])
      });

      expect($('#wrapperElement').children().eq(0)).toHaveClass('first');
      expect($('#wrapperElement').children().eq(1)).not.toHaveClass('first');
      expect($('#wrapperElement').children().eq(1)).toHaveClass('second');
    });

    it('items are created corretly', function () {

      setQuery('html($this)');

      var items = blocks.observable([1, 2, 3]);

      query({
        items: items
      });

      items.splice(0, 0, 4, 5);

      expect($('#wrapperElement').children().eq(0)).toHaveHtml('4');
      expect($('#wrapperElement').children().eq(1)).toHaveHtml('5');
    });

    // BUG
    it('does not query the html when a empty array is passed', function () {

      setQuery('html(title)');

      var items = blocks.observable([]);

      query({
        items: items
      });

      expect(true).toBe(true); // just not to throw error
    });

    // http://knockoutjs.com/documentation/foreach-binding.html
    // afterRender/afterAdd/beforeRemove/beforeMove/afterMove
    //it('fail - events', function () {
    //    expect(true).toBe(false);
    //});
  });

  describe('blocks.queries.render', function () {
    beforeEach(function () {
      var fixture = $('<div>', {
        id: 'sandbox'
      });
      fixture.append($('<div id="wrapper" data-query="each([$this])">'));
      fixture.children().append($('<div>', {
        id: 'testElement'
      }));
      fixture.children().children().append($('<span>', {
        id: 'childElement'
      }));
      setFixtures(fixture);
    });

    it('renders element and its children when first parameter set to true', function () {
      setQuery('render(true)');

      query();

      expect($('#testElement')).toExist();
      expect($('#childElement')).toExist();
    });

    it('does not render itself and its children', function () {
      setQuery('render(false)');

      query();

      expect($('#testElement')).not.toExist();
      expect($('#childElement')).not.toExist();
    });


    it('does not render when null is passed', function () {
      setQuery('render(null)');

      query();

      expect($('#testElement')).not.toExist();
      expect($('#childElement')).not.toExist();
    });

    it('does not render when undefined is passed', function () {
      setQuery('render(undefined)');

      query();

      expect($('#testElement')).not.toExist();
      expect($('#childElement')).not.toExist();
    });

    it('produces an empty html when the render(false) is set to the only child element', function() {
      setQuery('render(false)');

      query();

      expect($('#wrapper')).toHaveHtml('');
    });

    it('when observable with value true is passed the element is rendered and switching the value to false hides it', function () {
      var render = blocks.observable(true);
      setQuery('render(render)');

      query({
        render: render
      });

      expect($('#testElement')).toExist();
      expect($('#childElement')).toExist();
      expect($('#testElement')).toBeVisible();

      render(false);

      expect($('#testElement')).not.toBeVisible();

      render(true);

      expect($('#testElement')).toBeVisible();
    });

    it('when observable with value false the children are not rendered and then setting the value to true the children are rendered', function () {
      var render = blocks.observable(false);
      setQuery('render(render)');

      query({
        render: render
      });

      expect($('#testElement')).toExist();
      expect($('#testElement')).not.toBeVisible();
      expect($('#childElement')).not.toExist();

      render(true);

      expect($('#testElement')).toExist();
      expect($('#testElement')).toBeVisible();
      expect($('#childElement')).toExist();

      render(false);

      expect($('#testElement')).not.toBeVisible();
      expect($('#childElement')).toExist();
    });

    it('HTML rendered later updates correctly when observable changes', function () {
      var render = blocks.observable(false);
      var value = blocks.observable('initial');

      setQuery('render(render)');

      $('#childElement').attr('data-query', 'setClass(value)');
      $('#childElement').html('{{value}}');


      query({
        render: render,
        value: value
      });

      render(true);

      expect($('#childElement')).toHaveText('initial');
      expect($('#childElement')).toHaveClass('initial');

      value('updated');

      expect($('#childElement')).toHaveText('updated');
      expect($('#childElement')).toHaveClass('updated');
    });
  });

  describe('blocks.queries.define', function () {
    beforeEach(function () {
      var fixture = $('<div>', {
        id: 'sandbox'
      });
      fixture.append($('<div>', {
        id: 'testElement'
      }));
      setFixtures(fixture);
    });

    it('defines a new property', function () {
      setQuery('define("products", data).html(products[0])');

      query({
        data: [1, 2, 3]
      });

      expect($('#testElement')).toHaveHtml('1');
    });

    it('defined properties are available even after context change', function () {
      setQuery('define("products", data).with(data).html(products[1])');

      query({
        data: [1, 2, 3]
      });

      expect($('#testElement')).toHaveHtml('2');
    });

    it('defined property is available only for current and child elements', function () {
      setQuery('define("products", data)');

      $('<div>')
          .attr('id', 'neighbour')
          .attr('data-query', 'html(products)')
          .appendTo($('#testElement').parent());

      var func = blocks.partial(query, {
        data: [1, 2, 3]
      });
      expect(func).toThrow();
    });

    it('does not overrides a parent property', function () {
      setQuery('define("products", 3).html(products)');

      query({
        products: 1
      });

      expect($('#testElement')).toHaveHtml('1');
    });

    it('could access defined property when there is a property with the same name in the current context', function () {
      setQuery('define("products", 3).html($context.products)');

      query({
        products: 1
      });

      expect($('#testElement')).toHaveHtml('3');
    });

    it('overriden property is available only current and child elements', function () {
      setQuery('define("products", data)');

      $('<div>')
          .attr('id', 'neighbour')
          .attr('data-query', 'html(products)')
          .appendTo($('#testElement').parent());

      query({
        products: 1,
        data: [1, 2, 3]
      });

      expect($('#neighbour')).toHaveHtml('1');
    });
  });

  describe('blocks.queries.with', function () {
    beforeEach(function () {
      var fixture = $('<div>', {
        id: 'sandbox'
      });
      fixture.append($('<div>', {
        id: 'testElement'
      }));
      setFixtures(fixture);
    });

    it('successfully changes context', function () {
      setQuery('with(obj).html(value)');

      query({
        obj: {
          value: 1
        }
      });

      expect($('#testElement')).toHaveHtml('1');
    });

    it('context is available only for current and child elements', function () {
      setQuery('with(obj)');

      $('<div>')
          .attr('id', 'neighbour')
          .attr('data-query', 'html(value)')
          .appendTo($('#testElement').parent());

      var func = blocks.partial(query, {
        obj: {
          value: 'content'
        }
      });

      expect(func).toThrow();
    });

    it('it could define the value with name', function () {
      setQuery('with(obj, "person").html(person.FirstName)');

      query({
        obj: {
          FirstName: 'Antonio',
          LastName: 'Stoilkov'
        }
      });

      expect($('#testElement')).toHaveHtml('Antonio');
    });

    it('defining property does not stop to change the context', function () {
      setQuery('with(obj, "person").html(LastName)');

      query({
        obj: {
          FirstName: 'Antonio',
          LastName: 'Stoilkov'
        }
      });

      expect($('#testElement')).toHaveHtml('Stoilkov');
    });

    it('defined properties are availabe in child contexts', function () {
      setQuery('with(obj, "person")');

      $('#testElement')
          .append($('<div>')
                  .attr('data-query', 'with(info)')
                  .append($('<div>').attr('id', 'testChild').attr('data-query', 'html(person.FirstName)')));

      query({
        obj: {
          FirstName: 'Antonio',
          LastName: 'Stoilkov',
          info: {

          }
        }
      });

      expect($('#testChild')).toHaveHtml('Antonio');
    });

    it('queries with different queries on the same element are executed correctly', function () {
      setQuery('setClass(name, selected).with(obj).setClass(name, selected)');

      var outerSelected = blocks.observable(true);
      var innerSelected = blocks.observable(true);
      query({
        name: 'outer',
        selected: outerSelected,
        obj: {
          name: 'inner',
          selected: innerSelected
        }
      });

      expect($('#testElement')).toHaveClass('outer');
      expect($('#testElement')).toHaveClass('inner');

      outerSelected(false);

      expect($('#testElement')).not.toHaveClass('outer');
      expect($('#testElement')).toHaveClass('inner');

      innerSelected(false);

      expect($('#testElement')).not.toHaveClass('outer');
      expect($('#testElement')).not.toHaveClass('inner');

      innerSelected(true);

      expect($('#testElement')).not.toHaveClass('outer');
      expect($('#testElement')).toHaveClass('inner');

      outerSelected(true);

      expect($('#testElement')).toHaveClass('outer');
      expect($('#testElement')).toHaveClass('inner');
    });
  });

  describe('blocks.queries.options', function () {
    beforeEach(function () {
      var fixture = $('<div>', {
        id: 'sandbox'
      });
      fixture.append($('<select>', {
        id: 'testElement'
      }));
      setFixtures(fixture);
    });

    it('creates by specifying an array', function () {
      setQuery('options(items)');

      query({
        items: [1, 2, 3]
      });

      expect($('#testElement').children().length).toBe(3);
      expect($('#testElement').children().eq(0)).toHaveText('1');
      expect($('#testElement').children().eq(0)).toHaveValue('1');
      expect($('#testElement').children().eq(1)).toHaveText('2');
      expect($('#testElement').children().eq(1)).toHaveValue('2');
      expect($('#testElement').children().eq(2)).toHaveText('3');
      expect($('#testElement').children().eq(2)).toHaveValue('3');
    });

    it('removes elements without roles and keeps the ones with roles', function () {
      setQuery('options(items)');

      $('#testElement').append($('<option>').text('Random'));
      $('#testElement').append($('<option>').attr('data-role', 'header').text('Choose...'));
      $('#testElement').append($('<option>').attr('data-role', 'footer').text('None of the above'));
      $('#testElement').append($('<option>').text('Random'));

      query({
        items: ['first', 'second']
      });

      expect($('#testElement').children().length).toBe(4);
      expect($('#testElement').children().eq(0)).toHaveText('Choose...');
      expect($('#testElement').children().eq(0)).toHaveValue('Choose...');
      expect($('#testElement').children().eq(1)).toHaveText('first');
      expect($('#testElement').children().eq(1)).toHaveValue('first');
      expect($('#testElement').children().eq(2)).toHaveText('second');
      expect($('#testElement').children().eq(2)).toHaveValue('second');
      expect($('#testElement').children().eq(3)).toHaveText('None of the above');
      expect($('#testElement').children().eq(3)).toHaveValue('None of the above');
    });

    it('creates by specifying an text and value options', function () {
      setQuery('options(items, { text: \'Name\', value: \'Id\' })');

      query({
        items: [{
          Name: 'Antonio',
          Id: 1
        }, {
          Name: 'Mihaela',
          Id: 2
        }]
      });

      expect($('#testElement').children().length).toBe(2);
      expect($('#testElement').children().eq(0)).toHaveText('Antonio');
      expect($('#testElement').children().eq(0)).toHaveValue('1');
      expect($('#testElement').children().eq(1)).toHaveText('Mihaela');
      expect($('#testElement').children().eq(1)).toHaveValue('2');
    });

    it('successfully creates a caption', function () {
      setQuery('options(items, { caption: "Choose..." })');

      query({
        items: [0, 1, 2]
      });

      expect($('#testElement').children().length).toBe(4);
      expect($('#testElement').children().eq(0)).toHaveText('Choose...');
      expect($('#testElement').children().eq(0)).toHaveValue('Choose...');
      expect($('#testElement').children().eq(1)).toHaveText('0');
      expect($('#testElement').children().eq(1)).toHaveValue('0');
      expect($('#testElement').children().eq(2)).toHaveText('1');
      expect($('#testElement').children().eq(2)).toHaveValue('1');
      expect($('#testElement').children().eq(3)).toHaveText('2');
      expect($('#testElement').children().eq(3)).toHaveValue('2');
    });

    it('successfully creates empty caption', function () {
      setQuery('options(items, { caption: "" })');

      query({
        items: []
      });


      expect($('#testElement').children().length).toBe(1);
      expect($('#testElement').children().eq(0)).toHaveText('');
      expect($('#testElement').children().eq(0)).toHaveValue('');
    });

    it('successfully updates when observable adds a new item', function () {
      var items = blocks.observable(['first', 'second']);
      setQuery('options(items)');

      query({
        items: items
      });

      expect($('#testElement').children().length).toBe(2);
      expect($('#testElement').children().eq(0)).toHaveText('first');
      expect($('#testElement').children().eq(0)).toHaveValue('first');
      expect($('#testElement').children().eq(1)).toHaveText('second');
      expect($('#testElement').children().eq(1)).toHaveValue('second');

      items.push('third');

      expect($('#testElement').children().length).toBe(3);
      expect($('#testElement').children().eq(0)).toHaveText('first');
      expect($('#testElement').children().eq(0)).toHaveValue('first');
      expect($('#testElement').children().eq(1)).toHaveText('second');
      expect($('#testElement').children().eq(1)).toHaveValue('second');
      expect($('#testElement').children().eq(2)).toHaveText('third');
      expect($('#testElement').children().eq(2)).toHaveValue('third');
    });

    it('successfully updates when adding to an observable value and captions is specified', function () {
      var items = blocks.observable([{
        Id: 0,
        Name: 'Antonio'
      }, {
        Id: 2,
        Name: 'Mihaela'
      }]);

      setQuery('options(items, options)');

      query({
        items: items,
        options: {
          caption: 'Select name',
          text: 'Name',
          value: 'Id'
        }
      });

      expect($('#testElement').children().length).toBe(3);
      expect($('#testElement').children().eq(0)).toHaveText('Select name');
      expect($('#testElement').children().eq(0)).toHaveValue('Select name');
      expect($('#testElement').children().eq(1)).toHaveText('Antonio');
      expect($('#testElement').children().eq(1)).toHaveValue('0');
      expect($('#testElement').children().eq(2)).toHaveText('Mihaela');
      expect($('#testElement').children().eq(2)).toHaveValue('2');

      items.splice(0, 1, {
        Name: 'New Name',
        Id: 1
      });

      expect($('#testElement').children().length).toBe(3);
      expect($('#testElement').children().eq(0)).toHaveText('Select name');
      expect($('#testElement').children().eq(0)).toHaveValue('Select name');
      expect($('#testElement').children().eq(1)).toHaveText('New Name');
      expect($('#testElement').children().eq(1)).toHaveValue('1');
      expect($('#testElement').children().eq(2)).toHaveText('Mihaela');
      expect($('#testElement').children().eq(2)).toHaveValue('2');
    });
  });

  describe('blocks.queries.template', function () {
    beforeEach(function () {
      var $fixture = $('<div>', {
        id: 'sandbox'
      });

      $fixture.append($('<div>', {
        id: 'testElement'
      }));

      $fixture.append($('<script>').attr('type', 'text/blocks-template').attr('id', 'testTemplate'));

      setFixtures($fixture);
    });

    function setTemplate(scriptText) {
      $('#testTemplate').get(0).text = scriptText;
    }

    it('accepts string as template', function () {
      setQuery('template(templateString)');

      query({
        templateString: '{{content}}',
        content: 'some content'
      });

      expect($('#testElement')).toHaveText('some content');
    });

    it('accepts an element id as parameter', function () {
      setTemplate('{{$this}}');

      setQuery('template("testTemplate")');

      query('some content');

      expect($('#testElement')).toHaveText('some content');
    });

    it('accepts an element as parameter', function () {
      setTemplate('{{$this}}');

      setQuery('template(testTemplate)');

      query('some content');

      expect($('#testElement')).toHaveText('some content');
    });

    it('accepts a jQuery element as parameter', function () {
      setTemplate('{{$this.content}}');

      setQuery('template($testTemplate)');

      query({
        $testTemplate: $('#testTemplate'),
        content: 'some content'
      });

      expect($('#testElement')).toHaveText('some content');
    });

    it('overrides any existent content', function () {
      $('#testElement').html('some content');

      setQuery('template("overrides")');

      query();

      expect($('#testElement')).toHaveHtml('overrides');
    });

    it('does not override content when template value is not defined', function () {
      $('#testElement').html('some content');

      setQuery('template(undefined)');

      query();

      expect($('#testElement')).toHaveHtml('some content');
    });

    it('successfully updates observables in a template', function () {
      var items = blocks.observable([1, 2, 3]);

      setTemplate('<ul data-query="each(items)"><li>{{$this}}</li></ul>');

      setQuery('template(testTemplate)');

      query({
        items: items
      });

      var $ul = $('#testElement').children().eq(0);

      expect($ul.children().length).toBe(3);

      items.push(5, 6);

      expect($ul.children().length).toBe(5);
      expect($ul.children().eq(0)).toHaveText(1);
      expect($ul.children().eq(1)).toHaveText(2);
      expect($ul.children().eq(2)).toHaveText(3);
      expect($ul.children().eq(3)).toHaveText(5);
      expect($ul.children().eq(4)).toHaveText(6);
    });
  });

  describe('blocks.queries.on', function () {
    beforeEach(function () {
      var $fixture = $('<div>', {
        id: 'sandbox'
      });

      $fixture.append($('<div>', {
        id: 'testElement'
      }));

      $fixture.append($('<script>').attr('type', 'text/blocks-template').attr('id', 'testTemplate'));

      setFixtures($fixture);
    });

    it('successfully subscribes to a click event and calls the callback', function () {
      var event = 'click';
      var calledTimes = 0;
      var callback = function () {
        calledTimes++;
      };
      setQuery('on(event, callback)');

      query({
        event: event,
        callback: callback
      });

      expect(calledTimes).toBe(0);

      $('#testElement').click();

      expect(calledTimes).toBe(1);
    });

    it('click() callback is fired successfully', function () {
      var calledTimes = 0;
      var callback = function () {
        calledTimes++;
      };
      setQuery('click(callback)');

      query({
        callback: callback
      });

      expect(calledTimes).toBe(0);

      $('#testElement').click();

      expect(calledTimes).toBe(1);
    });

    it('successfully subscribes to multiple events', function () {
      var events = 'mousedown mouseup click';
      var calledTimes = 0;
      var callback = function () {
        calledTimes++;
      };
      setQuery('on(event, callback)');

      query({
        event: events,
        callback: callback
      });

      expect(calledTimes).toBe(0);

      $('#testElement').click();

      expect(calledTimes).toBe(1);
    });

    it('successfully subscribes to multiple events (click at the begining)', function () {
      var events = 'click mousedown';
      var calledTimes = 0;
      var callback = function () {
        calledTimes++;
      };
      setQuery('on(event, callback)');

      query({
        event: events,
        callback: callback
      });

      expect(calledTimes).toBe(0);

      $('#testElement').click();

      expect(calledTimes).toBe(1);
    });

    it('event is successfully passed', function () {
      var callbackEvent;
      var callback = function (e) {
        callbackEvent = e;
      };

      setQuery('click(callback)');

      query({
        callback: callback
      });

      $('#testElement').click();

      expect(blocks.isElement(callbackEvent.target)).toBe(true);
    });

    it('successfully pass additional argument', function () {
      var calledTimes = 0;
      var callbackArgs;
      var callback = function (e, args) {
        calledTimes++;
        callbackArgs = args;
      };
      setQuery('click(callback, args)');

      query({
        callback: callback,
        args: [1, 2, 3]
      });

      expect(calledTimes).toBe(0);

      $('#testElement').click();

      expect(calledTimes).toBe(1);
      expect(callbackArgs).toEqual([1, 2, 3]);
    });
  });

  describe('blocks.queries (Events)', function () {
    var events = ['click', 'dblclick', 'mousedown', 'mouseup', 'mouseover', 'mousemove', 'mouseout', // Mouse
                  'select', 'change', 'submit', 'reset', 'focus', 'blur', // HTML form
                  'keydown', 'keypress', 'keyup']; // Keyboard

    blocks.each(events, function (eventName) {
      beforeEach(function () {
        var fixture = $('<div>', {
          id: 'sandbox'
        });
        fixture.append($('<div>', {
          id: 'testElement'
        }));
        setFixtures(fixture);
      });

      it('blocks.queries.' + eventName + ' is defined', function () {
        expect(blocks.queries[eventName].preprocess == null).toBe(true);
        expect(blocks.queries[eventName].update).toBeDefined();
      });

      it('blocks.queries.' + eventName + ' does not throw exception', function () {
        setQuery(eventName + '(handler)');

        function performQuery() {
          query({
            handler: function () {

            }
          });
        }

        expect(performQuery).not.toThrow();
      });
    });
  });

})();
