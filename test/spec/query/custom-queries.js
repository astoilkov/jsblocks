(function () {

  var attributeName = 'data-query';
  var Element = blocks.VirtualElement;

  function fixtures(query, tagName, attributes) {
    tagName = tagName || 'div';
    attributes = attributes || {};
    attributes = {
      id: 'sandbox',
      'data-query': query
    };
    var fixture = $('<' + tagName + '>', attributes);
    setFixtures(fixture);
  }

  function setQuery(query) {
    $('#testElement').attr('data-query', query);
  }

  function query(model) {
    blocks.query(model || {}, document.getElementById('sandbox'));
  }

  function setCustomQuery(object) {
    blocks.queries.custom = object;
  }

  describe('blocks.queries.customQuery', function () {

    beforeEach(function () {
      var fixture = $('<div>', {
        id: 'sandbox'
      });
      fixture.append($('<div>', {
        id: 'testElement'
      }));
      setFixtures(fixture);
    });

    it('shouldnt throw error when the query is empty object', function () {
      setCustomQuery({});

      setQuery('custom("firstParameter", "secondParameter")');

      query();
    });

    it('shouldnt throw error when only preprocess is specified', function () {
      setCustomQuery({
        preprocess: function () {

        }
      });

      setQuery('custom("parameter")');

      query();
    });

    it('shouldnt throw error when only update is specified', function () {
      setCustomQuery({
        update: function () {

        }
      });

      setQuery('custom("update")');

      query();
    });

    it('should call the .preprocess method', function () {
      var isPreprocessCalled = false,
          isUpdateCalled = false;
      setCustomQuery({
        preprocess: function () {
          isPreprocessCalled = true;
        },

        update: function () {
          isUpdateCalled = true;
        }
      });

      setQuery('custom("custom")');

      query();

      expect(isPreprocessCalled).toBe(true);
      expect(isUpdateCalled).toBe(false);
    });

    it('should call the .update method when .preprocess is not specified', function () {
      var isUpdateCalled = false;
      setCustomQuery({
        update: function () {
          isUpdateCalled = true;
        }
      });

      setQuery('custom()');

      query();

      expect(isUpdateCalled).toBe(true);
    });

    it('should call the .update method when observable value changes', function () {
      var isUpdateCalled = false,
          observable = blocks.observable(false);
      setCustomQuery({
        preprocess: function () {

        },

        update: function () {
          isUpdateCalled = true;
        }
      });

      setQuery('custom(observable)');

      query({
        observable: observable
      });

      isUpdateCalled = false;
      observable(true)
      expect(isUpdateCalled).toBe(true);
    });

    it('should call the .update method when observable value changes when there is not .preprocess', function () {
      var isUpdateCalled = false,
          observable = blocks.observable(false);
      setCustomQuery({
        update: function () {
          isUpdateCalled = true;
        }
      });

      setQuery('custom(observable)');

      query({
        observable: observable
      });

      isUpdateCalled = false;
      observable(true)
      expect(isUpdateCalled).toBe(true);
    });

    it('should pass raw values in .preprocess when passRawValues is set to true', function () {
      var expectedValue,
          actualValue = blocks.observable(3);

      setCustomQuery({
        passRawValues: true,

        preprocess: function (value) {
          expectedValue = value;
        },

        update: function (value) {
          expectedValue = value;
        }
      });
      setQuery('custom(value)');

      query({ value: actualValue });

      expect(actualValue).toBe(expectedValue);
    });

    it('should pass raw values in .update when passRawValues is set to true', function () {
      var expectedValue,
          actualValue = blocks.observable(3);

      setCustomQuery({
        passRawValues: true,

        update: function (value) {
          expectedValue = value;
        }
      });
      setQuery('custom(value)');

      query({ value: actualValue });

      expect(actualValue).toBe(expectedValue);
    });

    it('should not pass raw values in .preprocess when passRawValues it not defined', function () {
      var expectedValue,
          actualValue = blocks.observable(3);

      setCustomQuery({
        preprocess: function (value) {
          expectedValue = value;
        }
      });
      setQuery('custom(value)');

      query({ value: actualValue });

      expect(actualValue()).toBe(expectedValue);
    });

    it('should not pass raw values in .update when passRawValues it not defined', function () {
      var expectedValue,
          actualValue = blocks.observable(0);

      setCustomQuery({
        passRawValues: false,

        update: function (value) {
          expectedValue = value;
        }
      });

      setQuery('custom(value)');

      query({ value: actualValue });

      expect(actualValue()).toBe(expectedValue);
    });

    it('should have correct parent and children properties values in .preprocess method', function () {
      $('<ul>').appendTo($('#testElement'));
      $('<p>').appendTo($('#testElement'));

      var isPreprocessCalled = false;

      setCustomQuery({
        preprocess: function () {
          isPreprocessCalled = true;
          expect(this.children().length).toBe(2);
          expect(this.children()[0].tagName()).toBe('ul');
          expect(this.children()[1].tagName()).toBe('p');
          expect(this.parent().tagName()).toBe('div');
        }
      });

      setQuery('custom()');

      query();

      expect(isPreprocessCalled).toBe(true);
    });

    it('should set values to an Element object in .preprocess method', function () {
      $('#testElement').attr('data-unique', 'unique');
      $('#testElement').addClass('first second');
      $('#testElement').css('display', 'none');

      var isPreprocessCalled = false;

      setCustomQuery({
        preprocess: function () {
          isPreprocessCalled = true;
          expect(this.attr('data-unique')).toBe('unique');
          expect(this.attr('class')).toBe('first second');
          expect(this.css('display')).toBe('none');
        }
      });

      setQuery('custom()');

      query();

      expect(isPreprocessCalled).toBe(true);
    });

    it('should not render Element html in .preprocess method', function () {

    });

    it('should manipulate dom element in .update method', function () {
      setCustomQuery({
        update: function () {
          this.style.display = 'none';
        }
      });

      setQuery('custom()');

      query();

      expect($('#testElement')).not.toBeVisible();
    });

    it('should create structure in .preprocess', function () {
      setCustomQuery({
        preprocess: function () {
          var div = new Element('div');
          this.addChild(div);
        }
      });

      setQuery('custom()');

      query();

      expect($('#testElement').children().length).toBe(1);
      expect($('#testElement').children().get(0).tagName.toLowerCase()).toBe('div');
    });

    it('should create structure in .update', function () {
      setCustomQuery({
        update: function () {
          var ul = document.createElement('ul'),
              p = document.createElement('p'),
              li = document.createElement('li');

          ul.appendChild(li);

          this.appendChild(ul);
          this.appendChild(p);
        }
      });

      setQuery('custom()');

      query();

      expect($('#testElement').children().length).toBe(2);
      expect($('#testElement').children().eq(0).children().length).toBe(1);
      expect($('#testElement').children().eq(0).children()[0].tagName).toBe('LI');
      expect($('#testElement').children()[0].tagName).toBe('UL');
      expect($('#testElement').children()[1].tagName).toBe('P');
    });

    it('should remove the element from the dom tree and throw no exception when the inner observed element should have been updated', function () {

    });

    it('should execute query on an Element object in .preprocess method', function () {

    });

    it('should push context and execute query on an Element object in .preprocess method', function () {

    });

    it('should execute query on an dom element in .update method', function () {

    });

    it('should push context and execute query on an dom element in .update method', function () {

    });
  });

})();
