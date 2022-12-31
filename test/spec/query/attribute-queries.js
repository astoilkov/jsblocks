(function () {
  testModule('blocks.queries.methodName', function (methodName) {
    function isPreprocess() {
      return methodName === 'preprocess';
    }

    function initializeFixtures(tagName, attributes) {
      tagName = tagName || 'div';
      attributes = attributes || {};
      var fixture = $('<div>', {
        id: 'sandbox',
        'data-query': 'each([$this])'
      });
      fixture.append($('<' + tagName + '>', blocks.extend({
        id: 'testElement'
      }, attributes)));
      setFixtures(fixture);
    }

    function query(model) {
      if (methodName == 'update') {
        var queriesCache = {};
        for (var query in blocks.queries) {
          if (blocks.queries[query].update && !(query in { 'each': true, 'with': true, 'render': true })) {
            queriesCache[query] = blocks.queries[query].preprocess;
            blocks.queries[query].preprocess = null;
          }
        }
      }

      blocks.query(model || {}, document.getElementById('sandbox'));

      if (queriesCache) {
        for (var query in blocks.queries) {
          if (queriesCache[query] && !(query in { 'each': true, 'with': true, 'render': true })) {
            blocks.queries[query].preprocess = queriesCache[query];
          }
        }
      }
    }

    function setQuery(query) {
      $('#testElement').attr('data-query', query);
    }

    describe('blocks.queries.setClass.' + methodName + ' function', function () {
      beforeEach(function () {
        initializeFixtures();
      });

      it('should be called', function () {
        spyOn(blocks.queries.setClass, methodName);

        setQuery('setClass(\'setClass\')');

        query({});

        expect(blocks.queries.setClass[methodName]).toHaveBeenCalled();
        expect(blocks.queries.setClass[methodName]).toHaveBeenCalledWith('setClass');
      });

      it('should have "first" class attribute value', function () {
        setQuery('setClass(\'first\')');
        query({ first: 'className' });

        expect($('#testElement')).toHaveAttr('class', 'first');
      });

      it('should have "first second" class attribute value', function () {
        setQuery('setClass(\'first\').setClass(first)');

        query({ first: 'second' });

        expect($('#testElement')).toHaveAttr('class', 'first second');
      });

      it('should set the element class attribute', function () {
        setQuery('setClass(className)');
        query({ className: 'className' });

        expect($('#testElement')).toHaveClass('className');
      });

      it('should append to the element class attribute', function () {
        $('#testElement').addClass('firstClass');
        setQuery('setClass(name, true)');
        query({ 'name': 'secondClass' });

        expect($('#testElement')).toHaveClass('firstClass');
        expect($('#testElement')).toHaveClass('secondClass');
      });

      it('should remove a class from the element', function () {
        $('#testElement').addClass('firstClass').addClass('secondClass');
        setQuery('setClass(\'firstClass\', false)');
        query();

        expect($('#testElement')).not.toHaveClass('firstClass');
        expect($('#testElement')).toHaveClass('secondClass');
      });

      it('should not set class for undefined', function () {
        setQuery('setClass(undefined)')
        query();

        expect($('#testElement')).not.toHaveAttr('class');
      });

      it('should not set class for undefined (two parameters)', function () {
        setQuery('setClass(undefined, undefined)')
        query();

        expect($('#testElement')).not.toHaveAttr('class');
      });

      it('should not set class for null', function () {
        setQuery('setClass(null)')
        query();

        expect($('#testElement')).not.toHaveAttr('class');
      });

      it('should not set class for null (two parameters)', function () {
        setQuery('setClass(null, null)')
        query();

        expect($('#testElement')).not.toHaveAttr('class');
      });

      it('should append multiple class names by providing an Array', function () {
        $('#testElement').addClass('class1');
        setQuery('setClass(classesCollection)');
        query({
          classesCollection: ['class2', 'class3', 'class4']
        });
        expect($('#testElement')).toHaveClass('class1');
        expect($('#testElement')).toHaveClass('class2');
        expect($('#testElement')).toHaveClass('class3');
        expect($('#testElement')).toHaveClass('class4');
      });

      it('should remove multiple class names by providing an Array', function () {
        $('#testElement').addClass('class2').addClass('class3');
        setQuery('setClass(classesCollection, false)');
        query({
          classesCollection: ['class1', 'class2', 'class3', 'class4']
        });
        expect($('#testElement')).not.toHaveClass('class1');
        expect($('#testElement')).not.toHaveClass('class2');
        expect($('#testElement')).not.toHaveClass('class3');
        expect($('#testElement')).not.toHaveClass('class4');
      });

      it('should append multiple class names by providing a space delimited String', function () {
        $('#testElement').addClass('class1');
        setQuery('setClass(classesCollection)');
        query({
          classesCollection: 'class2 class3 class4'
        });
        expect($('#testElement')).toHaveClass('class1');
        expect($('#testElement')).toHaveClass('class2');
        expect($('#testElement')).toHaveClass('class3');
        expect($('#testElement')).toHaveClass('class4');
      });

      it('should remove multiple class names by providing a space delimited String', function () {
        $('#testElement').addClass('class2').addClass('class3');
        setQuery('setClass(classesCollection, false)');
        query({
          classesCollection: 'class1 class2 class3 class4'
        });
        expect($('#testElement')).not.toHaveClass('class1');
        expect($('#testElement')).not.toHaveClass('class2');
        expect($('#testElement')).not.toHaveClass('class3');
        expect($('#testElement')).not.toHaveClass('class4');
      });

      it('should add\remove multiple class names depending on Object', function () {
        //Not sure...
      });

      it('should have "true false 3" as class attribute', function () {
        setQuery('setClass(true).setClass(false).setClass(undefined).setClass(3).setClass(null)');
        query();
        expect($('#testElement')).toHaveAttr('class', 'true false 3');
      });

      it('should be called with (selected, true)', function () {
        spyOn(blocks.queries.setClass, methodName);

        setQuery('setClass(setClass, isSelected)');

        query({ setClass: 'selected', isSelected: true });

        expect(blocks.queries.setClass[methodName]).toHaveBeenCalled();
        expect(blocks.queries.setClass[methodName]).toHaveBeenCalledWith('selected', true);
      });

      it('should be called with (true)', function () {
        spyOn(blocks.queries.setClass, methodName);

        setQuery('setClass(\'true\')');

        query({ 'true': false });

        expect(blocks.queries.setClass[methodName]).toHaveBeenCalled();
        expect(blocks.queries.setClass[methodName]).toHaveBeenCalledWith('true');
      });

      it('should be called with (selected, true)', function () {
        spyOn(blocks.queries.setClass, methodName);

        setQuery('setClass(setClass, true)');

        query({ setClass: 'selected', 'true': false });

        expect(blocks.queries.setClass[methodName]).toHaveBeenCalled();
        expect(blocks.queries.setClass[methodName]).toHaveBeenCalledWith('selected', true);
      });

      it('the class should be changed by observable', function () {
        var observable = blocks.observable('Hello');

        setQuery('attr(\'class\', className)');
        query({
          className: observable
        });

        expect($('#testElement').get(0).className).toBe('Hello');
        observable('Bye');
        expect($('#testElement').get(0).className).toBe('Bye');
      });

      it('the class should be updated by observable with condition', function () {
        var condition = blocks.observable(false);
        var className = blocks.observable('Hello');

        setQuery('attr(\'class\', condition() ? className : \'DefaultValue\')');

        query({
          condition: condition,
          className: className
        });

        expect($('#testElement')).toHaveAttr('class', 'DefaultValue');
        className('Bye');
        expect($('#testElement')).toHaveAttr('class', 'DefaultValue');
        condition(true);
        expect($('#testElement')).toHaveAttr('class', 'Bye');
      });

      it('does not add the same class multiple times', function () {
        setQuery('setClass(\'first\').setClass(\'first\')');

        query();

        expect($('#testElement')).toHaveAttr('class', 'first');
      });

      it('multiple setClass query calls should update correctly', function () {
        setQuery('setClass(\'selected\', selected).setClass(\'not\', !selected())');

        var selected = blocks.observable(true);
        query({
          selected: selected
        });

        expect($('#testElement')).toHaveClass('selected');
        expect($('#testElement')).not.toHaveClass('not');

        selected(false);

        expect($('#testElement')).not.toHaveClass('selected');
        expect($('#testElement')).toHaveClass('not');
      })
    });

    describe('blocks.queries.html.' + methodName + ' function', function () {
      beforeEach(function () {
        initializeFixtures();
      });

      it('should be called', function () {
        spyOn(blocks.VirtualElement.prototype, 'html');

        setQuery('html("content")');

        query({});

        expect(blocks.VirtualElement.prototype.html).toHaveBeenCalled();
        expect(blocks.VirtualElement.prototype.html).toHaveBeenCalledWith('content');
      });

      it('should set the innerHTML of the element', function () {
        setQuery('html("inner &nbsp;html ")');
        query();

        expect($('#testElement')).toHaveHtml('inner &nbsp;html ');
      });

      it('should replace any existing html', function () {
        $('#testElement').html('already existing html');
        setQuery(' html( value ) ');
        query({ value: 'HTML' });

        expect($('#testElement')).toHaveHtml('HTML');
      });

      // Deprecated!
      // it('shouldnt replace any existing html', function () {
      //   $('#testElement').html('already existing html');
      //
      //   setQuery('html(value, value)');
      //   query({ value: false });
      //
      //   expect($('#testElement')).toHaveHtml('already existing html');
      // });

      it('&,<,> symbols should set correctly', function () {
        setQuery('html(value)');

        query({ value: '&<>' });

        expect($('#testElement')).toHaveHtml('&amp;&lt;&gt;');
        expect($('#testElement')).toHaveHtml('&<>');
      });

      it('should set empty html when undefined is passed', function () {
        setQuery('html(undefined)');

        query();

        expect($('#testElement')).toHaveHtml('');
        expect($('#testElement')).toHaveText('');
      });
    });

    describe('blocks.queries.text.' + methodName + ' function', function () {
      beforeEach(function () {
        initializeFixtures();
      });

      it('should be called', function () {
        spyOn(blocks.VirtualElement.prototype, 'text');

        setQuery('text("content")');

        query({});

        expect(blocks.VirtualElement.prototype.text).toHaveBeenCalled();
        expect(blocks.VirtualElement.prototype.text).toHaveBeenCalledWith('content');
      });

      it('should set the innerHTML of the element', function () {
        setQuery('text("inner &nbsp;html ")');

        query();

        expect($('#testElement')).toHaveHtml('inner &amp;nbsp;html ');
      });

      it('should replace any existing html', function () {
        $('#testElement').html('already existing html');
        setQuery(' text( value ) ');
        query({ value: 'HTML' });

        expect($('#testElement')).toHaveHtml('HTML');
      });

      // Deprecated:
      // it('shouldnt replace any existing html', function () {
      //   $('#testElement').html('already existing html');
      //
      //   setQuery('text(value, value)');
      //   query({ value: false });
      //
      //   expect($('#testElement')).toHaveHtml('already existing html');
      // });

      it('&,<,> symbols should set correctly', function () {
        setQuery('text(value)');

        query({ value: '&<>' });

        expect($('#testElement')).toHaveHtml('&<>');
        expect($('#testElement')).toHaveHtml('&amp;&lt;&gt;');
      });

      it('should set value to an option correctly', function () {
        var fixture = $('<div>', {
          id: 'sandbox'
        });
        fixture.append($('<select>')).children().append($('<option>', {
          id: 'testElement'
        }));
        setFixtures(fixture);

        setQuery('text("Some text")');

        query();

        expect($('#testElement')).toHaveText('Some text');
      });

      it('should set empty html when undefined is passed', function () {
        setQuery('text(undefined)');

        query();

        expect($('#testElement')).toHaveHtml('');
        expect($('#testElement')).toHaveText('');
      });
    });

    describe('blocks.queries.css.' + methodName + ' function', function () {
      beforeEach(function () {
        initializeFixtures();
      });

      it('should be called', function () {
        spyOn(blocks.VirtualElement.prototype, 'css');

        setQuery('css("border-spacing", "2px", true)');
        query();

        expect(blocks.VirtualElement.prototype.css).toHaveBeenCalled();
        expect(blocks.VirtualElement.prototype.css).toHaveBeenCalledWith('border-spacing', '2px', true);
      });

      it('should set a css style to an element', function () {
        setQuery('css("padding-left", "1px")');

        query();

        expect($('#testElement')).toHaveCss({ 'paddingLeft': '1px' });
      });

      it('should set a css style from camel case naming to an element', function () {

      });

      it('should remove a css style from camel case naming from an element', function () {

      });

      it('shouldnt set a css style to an element', function () {
        setQuery('css(\'\', \'\', false)');

        query();

        expect($('#testElement')).not.toHaveAttr('style');
      });

      it('shouldnt set a css style to an element with undefined', function () {
        setQuery('css(undefined, undefined)');

        query();

        expect($('#testElement')).not.toHaveAttr('style');
      });

      it('should override an style value', function () {
        $('#testElement').css('marginTop', 30);

        setQuery('css("marginTop", marginTopValue)');

        query({ marginTopValue: '40px' });

        expect($('#testElement')).toHaveCss({ marginTop: '40px' });
      });

      it('should remove a style from an element', function () {
        $('#testElement').css('paddingLeft', '100%');
        setQuery('css("")');
      });

      it('should set multiple styles to an element', function () {
        $('#testElement').css('visibility', 'hidden');
        setQuery('css("border", "1px solid red").css(cssName, cssValue)');

        query({ cssName: 'marginLeft', cssValue: '4px' });

        expect($('#testElement').get(0).style.border.indexOf('1px') > -1).toBe(true);
        expect($('#testElement').get(0).style.border.indexOf('solid') > -1).toBe(true);
        expect($('#testElement').get(0).style.border.indexOf('red') > -1).toBe(true);
        expect($('#testElement').get(0).style.visibility).toBe('hidden');
        expect($('#testElement').get(0).style.marginLeft).toBe('4px');
      });

      it('should set css styles from an object to an element', function () {
        var zIndex = blocks.observable(3);
        $('#testElement').css('visibility', 'hidden');
        $('#testElement').css('position', 'absolute');

        setQuery('css($this)');

        query({
          visibility: 'visible',
          zIndex: zIndex
        });
        expect($('#testElement')).toHaveCss({
          visibility: 'visible',
          zIndex: '3'
        });

        zIndex(4);

        expect($('#testElement')).toHaveCss({
          visibility: 'visible',
          zIndex: '4'
        });
      });

      // !!Deprecated!!
      // it('should remove css styles from an object to an element', function () {
      //   var zIndex = blocks.observable(3);
      //   $('#testElement').css('visibility', 'hidden');
      //   $('#testElement').css('position', 'absolute');
      //
      //   setQuery('css($this, false)');
      //
      //   query({
      //     visibility: 'visible',
      //     zIndex: zIndex,
      //     position: 'relative'
      //   });
      //
      //   expect(!!$('#testElement').attr('style')).toBe(false);
      // });
    });

    describe('blocks.queries.visible.' + methodName + ' function', function () {
      beforeEach(function () {
        initializeFixtures();
      });

      it('should be called', function () {
        spyOn(blocks.VirtualElement.prototype, 'css');

        setQuery('visible(isVisible)');

        query({ isVisible: false });

        expect(blocks.VirtualElement.prototype.css).toHaveBeenCalled();
        expect(blocks.VirtualElement.prototype.css).toHaveBeenCalledWith('display', false);
      });

      it('should set the display:none to an element', function () {
        setQuery('visible(false)');

        query();

        expect($('#testElement')).toHaveCss({ display: 'none' });
        //expect($('#testElement')).not.toBeVisible();
      });

      it('should override the display style', function () {
        $('#testElement').attr('display', 'block');

        setQuery('visible(false)');

        query();

        expect($('#testElement')).toHaveCss({ display: 'none' });
      });

      it('shouldnt set the display:none to an element', function () {
        setQuery('visible(true)');

        query();

        expect($('#testElement')).not.toHaveAttr('style');
        expect($('#testElement')).toBeVisible();
      });

      it('shouldnt set the style attribute when undefined is passed', function () {
        setQuery('visible(undefined)');

        query();

        expect($('#testElement')).toHaveCss({ display: 'none' });
      });

      it('should remove the display:none from an element', function () {
        $('#testElement').css('display', 'none');
        setQuery('visible(display)');

        query({ display: true });

        expect($('#testElement')).toBeVisible();
      });

      it('should have display:none; as style attribute value', function () {
        setQuery('visible(false)');

        query();

        expect($('#testElement').attr('style').toLowerCase().replace(/[ |;$]+/g, '')).toBe('display:none');
      });

      it('should have visibility:hidden;display:none; as style attribute', function () {
        $('#testElement').css('visibility', 'hidden');
        setQuery('visible(false)');

        query();

        expect($('#testElement')).toHaveCss({
          visibility: 'hidden',
          display: 'none'
        });
      });
    });

    describe('blocks.queries.attr.' + methodName + ' function', function () {
      beforeEach(function () {
        initializeFixtures();
      });

      it('should be called', function () {
        spyOn(blocks.VirtualElement.prototype, 'attr');

        setQuery('attr("checked", "checked", shouldSetAttribute)');

        query({ shouldSetAttribute: false });

        expect(blocks.VirtualElement.prototype.attr).toHaveBeenCalled();
        expect(blocks.VirtualElement.prototype.attr).toHaveBeenCalledWith('checked', 'checked', false);
      });

      it('should set data-unique=unique to an element', function () {
        setQuery('attr("data-unique", "unique")');

        query();

        expect($('#testElement')).toHaveAttr('data-unique', 'unique');
      });

      it('should override an attribute value from an element', function () {
        $('#testElement').attr('title', 'Hello there');

        setQuery('attr("title", "title")');

        query();

        expect($('#testElement')).toHaveAttr('title', 'title');
      });

      it('should not set an attribute to an element', function () {
        setQuery('attr("title", null)');

        query();

        expect($('#testElement')).not.toHaveAttr('title');
      });

      it('should remove an attribute from an element', function () {
        $('#testElement').attr('title', 'hello');

        setQuery('attr("title", null)');

        query();

        expect($('#testElement')).not.toHaveAttr('title');
      });

      it('shouldnt set the attribute when undefined is passed', function () {
        setQuery('attr(undefined, undefined)');

        query();

        expect($('#testElement')).not.toHaveAttr('undefined');
        expect($('#testElement').parent().html().indexOf('undefined=')).toBe(-1);
      });

      it('sets custom data attribute when passing false as second parameter', function () {
        setQuery('attr("data-custom", false)');

        query();

        expect($('#testElement')).toHaveAttr('data-custom', 'false');
      });

      it('should set tabindex=1 to an element', function () {
        setQuery('attr("tabindex", "1")');

        query();

        expect($('#testElement')).toHaveProp('tabIndex', 1);
      });

      it('should set className to an element', function () {
        var className = blocks.observable('first');
        setQuery('attr("className", className)');

        query({
          className: className
        });

        expect($('#testElement')).toHaveProp('className', 'first');

        className('second third');

        expect($('#testElement')).toHaveProp('className', 'second third');
      });

      it('should set className to an element by passing class', function () {
        var className = blocks.observable('first');
        setQuery('attr("class", className)');

        query({
          className: className
        });

        expect($('#testElement')).toHaveProp('className', 'first');

        className('second third');

        expect($('#testElement')).toHaveProp('className', 'second third');
      });

      it('should override an property value from an element', function () {
        $('#testElement').attr('className', 'Hello there');

        setQuery('attr("className", "className")');

        query();

        expect($('#testElement')).toHaveProp('className', 'className');
      });

      it('should not set an property to an element', function () {
        setQuery('attr("className", null)');

        query();

        expect($('#testElement')).toHaveProp('className', '');
      });

      it('should remove an property from an element', function () {
        $('#testElement').attr('className', 'hello');

        setQuery('attr("className", null)');

        query();

        expect($('#testElement')).toHaveProp('className', '');
      });

      it('shouldnt set the property when undefined is passed', function () {
        setQuery('attr(undefined, undefined)');

        query();

        expect($('#testElement')).not.toHaveAttr('undefined');
        expect($('#testElement')).not.toHaveProp('undefined');
        expect($('#testElement').parent().html().indexOf('undefined=')).toBe(-1);
      });

      it('should set attributes from an object to an element', function () {
        setQuery('attr(attributes)');

        query({
          attributes: {
            'data-custom1': 'first',
            'data-custom2': 'second'
          }
        });

        expect($('#testElement')).toHaveAttr('data-custom1', 'first');
        expect($('#testElement')).toHaveAttr('data-custom2', 'second');
      });

      it('should set attributes from an object containing observables and then successfully update the attribute value', function () {
        var observable = blocks.observable('first');
        setQuery('attr(attributes)');

        query({
          attributes: {
            'data-custom': observable
          }
        });

        expect($('#testElement')).toHaveAttr('data-custom', 'first');

        observable('second');

        expect($('#testElement')).toHaveAttr('data-custom', 'second');
      });

      // The condition argument have been deprecated
      //
      // it('should remove attributes from an object to an element', function () {
      //   var shouldSetAttributes = blocks.observable(false);
      //   $('#testElement').attr({
      //     'data-custom1': 'first'
      //   });
      //
      //   setQuery('attr(attributes, shouldSetAttributes)');
      //
      //   query({
      //     attributes: {
      //       'data-custom1': 'first',
      //       'data-custom2': 'second'
      //     },
      //     shouldSetAttributes: shouldSetAttributes
      //   });
      //
      //   expect($('#testElement')).not.toHaveAttr('data-custom1');
      //   expect($('#testElement')).not.toHaveAttr('data-custom2');
      // });
    });

    describe('blocks.queries.val.' + methodName + ' function', function () {
      beforeEach(function () {
        initializeFixtures('input');
      });

      it('should be called', function () {
        spyOn(blocks.VirtualElement.prototype, 'attr');

        setQuery('val("First-Last Name")');

        query();

        expect(blocks.VirtualElement.prototype.attr).toHaveBeenCalled();
        expect(blocks.VirtualElement.prototype.attr).toHaveBeenCalledWith('value', 'First-Last Name');
      });

      it('should set the value attribute to an element', function () {
        setQuery('val("Th-e value")');

        query();

        expect($('#testElement')).toHaveProp('value', 'Th-e value');
      });

      it('should override the value attribute from an element', function () {
        $('#testElement').attr('value', 'oldValue');

        setQuery('val("newValue")');

        query();

        expect($('#testElement')).toHaveProp('value', 'newValue');
      });

      it('value property should be updated by observable', function () {
        var firstName = blocks.observable('Antonio'),
            lastName = blocks.observable('Stoilkov'),
            fullName = blocks.observable(function () {
              return firstName() + lastName();
            });

        setQuery('val(fullName)');

        query({
          fullName: fullName
        });

        expect($('#testElement')).toHaveProp('value', 'AntonioStoilkov');

        firstName('Hello');

        expect($('#testElement')).toHaveProp('value', 'HelloStoilkov');

        lastName('There');

        expect($('#testElement')).toHaveProp('value', 'HelloThere');
      });

      it('shouldnt set the value attribute to an element when undefined passed', function () {

        setQuery('val(undefined)');

        query();

        expect($('#testElement').attr('value')).toBeFalsy();

      });

      it('shouldnt set the value attribute to an element when undefined passed twice', function () {
        setQuery('val(undefined, undefined)');

        query();

        expect($('#testElement').attr('value')).toBeFalsy();
      });

      it('should not throw error when <select> and <option> children without data-queries are queried', function () {
        initializeFixtures('div');

        $("#sandbox").removeAttr("data-query");

        var $select = $('<select>', {
          id: 'testSelect'
        })
            .append($('<option>').val('Antonio').text('Antonio'))
            .append($('<option>').val('Mihaela').text('Mihaela'));

        $('#testElement').append($select);

        var beforeHtml = $('#testElement').html();

        query();
        //expect().not.toThrow();

        expect($('#testElement').html()).toBe(beforeHtml);
      });

      it('<select> and <option> children without data-queries should not be changed after calling blocks.query', function () {
        initializeFixtures('div');

        var $select = $('<select>', {
          id: 'testSelect'
        })
            .append('<option>')
            .append('<option>');

        $('#testElement').append($select);

        query();

        expect($('#testElement select').children().length).toBe(2);
        expect($('#testElement select').children().eq(0).attr('selected')).not.toBeDefined();
        expect($('#testElement select').children().eq(0)).toHaveHtml('');
        expect($('#testElement select').children().eq(1).attr('selected')).not.toBeDefined();
        expect($('#testElement select').children().eq(1)).toHaveHtml('');
      });

      it('should set value to a <textarea>', function () {
        initializeFixtures('textarea');

        setQuery('val(description)');

        var description = blocks.observable('here is some description');
        query({
          description: description
        });

        expect($('#testElement')).toHaveValue(description());
      });

      // TODO: Explain why only for preprocess
      if (isPreprocess()) {
        it('should set the value to an <select> element', function () {

          initializeFixtures('div');

          var $select = $('<select>', {
            id: 'testSelect',
            'data-query': 'each(items).val(selectValue)'
          });
          $select.append($('<option>', {
            'data-query': 'val($this).html($this).if($this == "Renault", attr("selected", "selected"))'
          }));
          $('#testElement').append($select);

          var items = blocks.observable(['Honda', 'Audi', 'Renault']);
          var selectValue = blocks.observable('Audi');

          query({
            items: items,
            selectValue: selectValue
          });

          expect($('#testSelect')).toHaveValue(selectValue());

          selectValue('Honda');

          expect($('#testSelect')).toHaveValue('Honda');

          selectValue(null);

          expect($('#testSelect')).toHaveValue(null);
        });

        it('should not set the value attribute', function () {

          initializeFixtures('div');

          var $select = $('<select>', {
            id: 'testSelect',
            'data-query': 'each(items).val(selectValue)'
          });
          $select.append($('<option>', {
            'data-query': 'val($this).html($this)'
          }));
          $('#testElement').append($select);

          var items = blocks.observable(['Honda', 'Audi', 'Renault']),
              selectValue = blocks.observable('Honda');

          query({
            items: items,
            selectValue: selectValue
          });

          expect($('#testSelect').attr('value')).toBeFalsy();
        });

        it('should set the first option as selected when setting null as a value for an <select> element', function () {

          initializeFixtures('div');

          var $select = $('<select>', {
            id: 'testSelect',
            'data-query': 'each(items).val(selectValue)'
          });
          $select.append($('<option>', {
            'data-query': 'val($this).html($this)'
          }));
          $('#testElement').append($select);

          var items = blocks.observable(['Honda', 'Audi', 'Renault']),
              selectValue = blocks.observable(null);


          query({
            items: items,
            selectValue: selectValue
          });

          expect($('#testSelect')).toHaveValue('Honda');
        });

        it('should not set the value attribute when multiple select', function () {

          initializeFixtures('div');

          var $select = $('<select>', {
            multiple: 'multiple',
            id: 'testSelect',
            'data-query': 'each(items).val(values)'
          });
          $select.append($('<option>', {
            'data-query': 'val($this).html($this)'
          }));
          $('#testElement').append($select);

          var items = blocks.observable(['Honda', 'Audi', 'Renault', 'Mercedes', 'Mazda']);
          var values = blocks.observable(['Honda', 'Renault', 'Mazda']);

          query({
            items: items,
            values: values
          });

          expect($('#testSelect').attr('value')).toBeFalsy();
        });

        it('should set the value to an <select multiple=multiple> element', function () {

          initializeFixtures('div');

          var $select = $('<select>', {
            multiple: 'multiple',
            id: 'testSelect',
            'data-query': 'each(items).val(values)'
          });
          $select.append($('<option>', {
            'data-query': 'val($this).html($this)'
          }));
          $('#testElement').append($select);

          var items = blocks.observable(['Honda', 'Audi', 'Renault', 'Mercedes', 'Mazda']);
          var values = blocks.observable(['Honda', 'Renault', 'Mazda']);

          query({
            items: items,
            values: values
          });

          expect($('#testSelect').val().length).toBe(values().length);
          for (var i = 0; i < values().length; i++) {
            expect($('#testSelect').val()[i]).toBe(values()[i]);
          }

          values.splice(1, 1, 'Audi');

          expect($('#testSelect').val().length).toBe(values().length);
          for (var i = 0; i < values().length; i++) {
            expect($('#testSelect').val()[i]).toBe(values()[i]);
          }

          values.removeAll();

          expect($('#testSelect').val()).toEqual([]);
        });

        it('should set the value to an <select multiple=multiple> element when values are not strings', function () {

          initializeFixtures('div');

          var $select = $('<select>', {
            multiple: 'multiple',
            id: 'testSelect',
            'data-query': 'each(items).val(values)'
          });
          $select.append($('<option>', {
            'data-query': 'val($this).html($this)'
          }));
          $('#testElement').append($select);

          var items = blocks.observable([1, 2, 3]);
          var values = blocks.observable([1]);

          query({
            items: items,
            values: values
          });

          expect($('#testSelect').val().length).toBe(values().length);
          for (var i = 0; i < values().length; i++) {
            expect($('#testSelect').val()[i]).toBe(values()[i].toString());
          }

          values.splice(1, 1, 2);

          expect($('#testSelect').val().length).toBe(values().length);
          for (var i = 0; i < values().length; i++) {
            expect($('#testSelect').val()[i]).toBe(values()[i].toString());
          }

          values.removeAll();

          expect($('#testSelect').val()).toEqual([]);
        });

        it('shouldnt set any option as selected when setting empty array as a value for an <select multiple=multiple> element', function () {

          initializeFixtures('div');

          var $select = $('<select>', {
            multiple: 'multiple',
            id: 'testSelect',
            'data-query': 'each(items).val(values)'
          });
          $select.append($('<option>', {
            'data-query': 'val($this).html($this)'
          }));
          $('#testElement').append($select);

          var items = blocks.observable(['Honda', 'Audi', 'Renault', 'Mercedes', 'Mazda']);
          var values = blocks.observable([]);

          query({
            items: items,
            values: values
          });

          expect($('#testSelect').val()).toEqual([]);
        });

        it('shouldnt set the value attribute to an element', function () {

          setQuery('val(null)');

          query();

          expect($('#testElement').attr('value')).toBeFalsy();
        });

        it('should remove the value attribute to an element', function () {
          $('#testElement').val('value');

          setQuery('val("")');

          query();

          expect($('#testElement').attr('value')).toBeFalsy();
        });
      }
    });

    describe('blocks.queries.checked.' + methodName + ' function', function () {
      beforeEach(function () {
        initializeFixtures();
      });

      it('should be called', function () {
        spyOn(blocks.VirtualElement.prototype, 'attr');

        setQuery('checked("true")');

        query();

        expect(blocks.VirtualElement.prototype.attr).toHaveBeenCalled();
        expect(blocks.VirtualElement.prototype.attr).toHaveBeenCalledWith('checked', 'true');
      });

      it('should set the checked attribute to an element', function () {
        initializeFixtures('input', {
          type: 'checkbox'
        });

        setQuery('checked(true)');

        query();

        expect($('#testElement')).toBeChecked();
      });

      it('shouldnt set the checked attribute to an element', function () {
        setQuery('checked(undefined)');

        query();

        expect($('#testElement')).not.toHaveAttr('checked');
      });

      it('should remove the checked attribute to an element', function () {
        initializeFixtures('input', {
          type: 'checkbox'
        });

        $('#testElement').attr('checked', 'checked');

        setQuery('checked(false)');

        query();

        expect($('#testElement')).not.toBeChecked();
      });

      it('checked attribute should be updated by observable', function () {
        var isChecked = blocks.observable(true);

        $('<input>', {
          type: 'checkbox',
          'data-query': 'checked(isChecked)'
        }).appendTo($('#testElement'));

        setQuery('checked(isChecked)');

        query({
          isChecked: isChecked
        });

        expect($('#testElement').children()).toBeChecked();

        isChecked(false);

        expect($('#testElement').children()).not.toBeChecked();
      });

      it('input[type=radio] checked attribute should be set correctly when passing boolean values', function () {
        var radioValue = blocks.observable('Second');

        $('<input>', {
          type: 'radio',
          value: 'First',
          'data-query': 'checked(false)'
        }).appendTo($('#testElement'));

        $('<input>', {
          type: 'radio',
          value: 'Second',
          'data-query': 'checked(true)'
        }).appendTo($('#testElement'));

        query({
          radioValue: radioValue
        });

        expect($('#testElement').children().eq(0)).not.toBeChecked();
        expect($('#testElement').children().eq(1)).toBeChecked();
      });

      it('input[type=radio] checked attribute should be set correctly', function () {
        var radioValue = blocks.observable('Second');

        $('<input>', {
          type: 'radio',
          checked: 'checked',
          value: 'First',
          'data-query': 'checked(radioValue)'
        }).appendTo($('#testElement'));

        $('<input>', {
          type: 'radio',
          value: 'Second',
          'data-query': 'checked(radioValue)'
        }).appendTo($('#testElement'));

        query({
          radioValue: radioValue
        });

        expect($('#testElement').children().eq(0)).not.toBeChecked();
        expect($('#testElement').children().eq(1)).toBeChecked();

        radioValue('First');

        expect($('#testElement').children().eq(0)).toBeChecked();
        expect($('#testElement').children().eq(1)).not.toBeChecked();
      });


      it('input[type=radio] checked attribute should be set correctly when the blocks.queries.value query is after the blocks.queries.checked', function () {
        var radioValue = blocks.observable('Second');

        $('<input>', {
          type: 'radio',
          'data-query': 'checked(radioValue).val("First")'
        }).appendTo($('#testElement'));

        $('<input>', {
          type: 'radio',
          'data-query': 'checked(radioValue).val("Second")'
        }).appendTo($('#testElement'));

        query({
          radioValue: radioValue
        });

        expect($('#testElement').children().eq(0)).not.toBeChecked();
        expect($('#testElement').children().eq(1)).toBeChecked();

        radioValue('First');

        expect($('#testElement').children().eq(0)).toBeChecked();
        expect($('#testElement').children().eq(1)).not.toBeChecked();
      });
    });

    describe('blocks.queries.disabled.' + methodName + ' function', function () {
      beforeEach(function () {
        initializeFixtures();
      });

      it('should be called', function () {
        spyOn(blocks.VirtualElement.prototype, 'attr');

        setQuery('disabled("false")');

        query();

        expect(blocks.VirtualElement.prototype.attr).toHaveBeenCalled();
        expect(blocks.VirtualElement.prototype.attr).toHaveBeenCalledWith('disabled', 'false');
      });

      it('should set the disabled attribute to an element', function () {
        setQuery('disabled("disabled")');

        query();

        expect($('#testElement')).toHaveAttr('disabled', 'disabled');
      });

      it('shouldnt set the disabled attribute to an element', function () {
        setQuery('disabled(false)');

        query();

        expect($('#testElement')).not.toHaveAttr('disabled');
      });

      it('should remove the disabled attribute to an element', function () {
        $('#testElement').attr('disabled', 'disabled');

        setQuery('disabled(false);');

        query();

        expect($('#testElement')).not.toHaveAttr('disabled');
      });

      it('shouldnt set the checked attribute to an element', function () {
        setQuery('disabled(undefined)');

        query();

        expect($('#testElement')).not.toHaveAttr('disabled');
      });
    });

    describe('blocks.queries.width.' + methodName + ' function', function () {
      beforeEach(function () {
        initializeFixtures();
      });

      it('should be called', function () {
        spyOn(blocks.VirtualElement.prototype, 'css');

        setQuery('width(100)');

        query();

        expect(blocks.VirtualElement.prototype.css).toHaveBeenCalled();
        expect(blocks.VirtualElement.prototype.css).toHaveBeenCalledWith('width', 100);
      });

      it('should set 100px as width to the element', function () {
        setQuery('width(100)');

        query();

        expect($('#testElement')).toHaveCss({ width: '100px' });
      });

      it('should set 213px as width to the element', function () {
        setQuery('width("213px", true)');

        query();

        expect($('#testElement')).toHaveCss({ width: '213px' });
      });

      it('should set 99% as width to the element', function () {
        setQuery('width("99%")');

        query();

        expect($('#testElement').get(0).style.width).toBe('99%');
      });

      it('should set auto as width to the element', function () {
        setQuery('width("auto")');

        query();

        expect($('#testElement').get(0).style.width).toBe('auto');
      });

      it('should override the width of the element', function () {
        $('#testElement').width(1);

        setQuery('width(130)');

        query();

        expect($('#testElement')).toHaveCss({ width: '130px' });
      });

      // !!Deprecated!!
      // it('should remove the width from an element', function () {
      //   var originalWidth = $('#testElement').width();
      //
      //   setQuery('width(13, false)');
      //
      //   query();
      //
      //   expect($('#testElement')).toHaveCss({ width: originalWidth + 'px' });
      // });

      it('shouldnt change width with two undefined passed', function () {
        var originalWidth = $('#testElement').width();

        setQuery('width(undefined, undefined)');

        query();

        expect($('#testElement')).toHaveCss({ width: originalWidth + 'px' });
      });

      it('shouldnt change width with one undefined passed', function () {
        var originalWidth = $('#testElement').width();

        setQuery('width(undefined)');

        query();

        expect($('#testElement')).toHaveCss({ width: originalWidth + 'px' });
      });
    });

    describe('blocks.queries.height.' + methodName + ' function', function () {
      beforeEach(function () {
        initializeFixtures();
      });

      it('should be called', function () {
        spyOn(blocks.VirtualElement.prototype, 'css');

        setQuery('height(100)');

        query();

        expect(blocks.VirtualElement.prototype.css).toHaveBeenCalled();
        expect(blocks.VirtualElement.prototype.css).toHaveBeenCalledWith('height', 100);
      });

      it('should set 100px as height to the element', function () {
        setQuery('height(100)');

        query();

        expect($('#testElement')).toHaveCss({ height: '100px' });
      });

      it('should set 213px as height to the element', function () {
        setQuery('height("213px", true)');

        query();

        expect($('#testElement')).toHaveCss({ height: '213px' });
      });

      it('should set 99% as height to the element', function () {
        setQuery('height("99%")');

        query();

        expect($('#testElement').get(0).style.height).toBe('99%');
      });

      it('should set "auto" as height to the element', function () {
        setQuery('height("auto")');

        query();

        expect($('#testElement').get(0).style.height).toBe('auto');
      });

      it('should override the height of the element', function () {
        $('#testElement').height(1);

        setQuery('height(130)');

        query();

        expect($('#testElement')).toHaveCss({ height: '130px' });
      });


      // TODO: Should remove it or just not apply it
      it('should remove the height from an element', function () {
        //$('#testElement').height(100);
        var originalHeight = $('#testElement').height();

        setQuery('height(13, false)');

        query();

        expect($('#testElement')).toHaveCss(originalHeight);
      });

      it('shouldnt change height with two undefined passed', function () {
        var originalHeight = $('#testElement').get(0).clientHeight;

        setQuery('height(undefined, undefined)');

        query();

        expect($('#testElement').get(0).clientHeight).toBe(originalHeight);
      });

      it('shouldnt change height with one undefined passed', function () {
        var originalHeight = $('#testElement').get(0).clientHeight;

        setQuery('height(undefined)');

        query();

        expect($('#testElement').get(0).clientHeight).toBe(originalHeight);
      });
    });

    describe('not implemented comments methods do not throw exception', function () {
      blocks.each(blocks.queries, function (query, key) {
        if (query.supportsComments) {
          return;
        }

        it('blocks.queries.' + key + ' does not throw exception', function () {
          var $fixture = $('<div>', {
            id: 'sandbox'
          });
          var fixture = $fixture[0];
          fixture.appendChild(document.createComment('blocks ' + key + '(undefined)'));
          fixture.appendChild(document.createTextNode('empty content'));
          fixture.appendChild(document.createComment('/blocks'));

          setFixtures($fixture);

          function func() {
            blocks.query({}, document.getElementById('sandbox'));
          }

          expect(func).not.toThrow();
          expect($('#sandbox').html()).toMatch(new RegExp('<\!-- ([0-9]+:)?blocks ' + key + '\\(undefined\\) -->empty content<\!-- ([0-9]+:)?/blocks -->'))
        });
      });
    });
  });
})();
