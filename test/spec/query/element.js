(function () {
  describe('blocks.core.VirtualElement', function () {

    var VirtualElement = blocks.VirtualElement;

    it('could be initialized using the new keyword or without it', function () {
      var elementA = new VirtualElement('div');
      var elementB = VirtualElement('div');
      expect(elementA.tagName()).toBe(elementB.tagName());
    });

    describe('tagName()', function () {
      it('by default is ', function () {

      });

      it('should have the correct tagName', function () {
        var element = new VirtualElement('div');

        expect(element.tagName()).toBe('div');
      });

      it('should change the tagName', function () {
        var element = new VirtualElement('div');

        expect(element.tagName()).toBe('div');

        element.tagName('span');
        expect(element.tagName()).toBe('span');

        expect(element.tagName('table').tagName()).toBe('table');
      });

      it('when setting tagName it returns the element', function () {
        var element = new VirtualElement('div');

        expect(element.tagName('span')).toBe(element);
      });

      it('accepts custom tag names', function () {
        var element = new VirtualElement('custom-element');

        expect(element.tagName()).toBe('custom-element');
      });

      it('is always convert to lowerCase representation', function () {
        var element = new VirtualElement('INPUT');

        expect(element.tagName()).toBe('input');
      })
    });

    describe('html()', function () {
      it('returns empty string by default', function () {
        var element = new VirtualElement('div');

        expect(element.html()).toBe('');
      });

      it('should set the html', function () {
        var element = new VirtualElement('p');

        expect(element.html()).toBe('');

        expect(element.html('some content').html()).toBe('some content');
      });

      it('when setting new html it returns the element', function () {
        var element = new VirtualElement('p');

        expect(element.html('content')).toBe(element);
      });
    });

    describe('css()', function () {
      it('should get and set css properties', function () {
        var element = new VirtualElement('div');

        expect(element.css('display')).toBe(null);
        element.css('display', 'none');
        expect(element.css('display')).toBe('none');
      });

      it('should get and set css properties - value 0', function () {
        var element = new VirtualElement('div');

        expect(element.css('marginTop')).toBe(null);
        element.css('marginTop', 0);
        expect(element.css('marginTop')).toBe('0px');
      });

      it('should set css propertiy containing dashes(-) properly', function () {
        var element = new VirtualElement('input');

        expect(element.css('margin-top')).toBe(null);
        element.css('margin-top', 10);
        expect(element.css('marginTop')).toBe('10px');
      });

      it('should get css property containing dashes(-) properly', function () {
        var element = new VirtualElement('div');

        expect(element.css('margin-top')).toBe(null);
        element.css('marginTop', 10);
        expect(element.css('margin-top')).toBe('10px');
      });

      it('default unit should be px', function () {
        var element = new VirtualElement('div');

        element.css('margin-top', 20);

        expect(element.css('margin-top')).toBe('20px');
      });

      it('when setting css property it returns the element', function () {
        var element = new VirtualElement('div');

        expect(element.css('padding', 20)).toBe(element);
      });
    });

    describe('attr()', function () {
      it('should get and set attribute properties', function () {
        var element = new VirtualElement('div');

        expect(element.attr('data-unique')).toBe(null);
        element.attr('data-unique', 'unique');
        expect(element.attr('data-unique')).toBe('unique');
      });

      it('should get and set attribute properties - value 0', function () {
        var element = new VirtualElement('div');

        expect(element.attr('maxLength')).toBe(null);
        element.attr('maxLength', 0);
        expect(element.attr('maxLength')).toBe(0);
      });

      it('removeAttr removes an attribute', function () {
        var element = new VirtualElement('section');

        expect(element.attr('data-custom')).toBe(null);
        element.attr('data-custom', 'data');
        expect(element.attr('data-custom')).toBe('data');
        element.removeAttr('data-custom');
        expect(element.attr('data-custom')).toBe(null);
      });

      it('should return the element when setting attributre', function () {
        var element = new VirtualElement('div');

        expect(element.attr('tabindex', 1)).toBe(element);
      });
    });

    describe('removeAttr()', function () {
      it('shouldnt throw error when removing attribute that does not exists', function () {
        var element = new VirtualElement('div');

        function removeAttribute() {
          element.removeAttr('attribute that does not exist');
        }

        expect(removeAttribute).not.toThrow();
      });

      it('should return the element', function () {
        var element = new VirtualElement('div');

        expect(element.removeAttr()).toBe(element);
      });
    });

    describe('addClass()', function () {
      it('adds a class to the className', function () {
        var element = new VirtualElement('div');

        expect(element.attr('class')).toBe(null);
        element.addClass('first');
        expect(element.attr('class')).toBe('first');
        element.addClass('second');
        expect(element.attr('class')).toBe('first second');
      });

      it('passing undefined or null does nothing', function () {
        var element = new VirtualElement('div');
        element.addClass(undefined).addClass(null);
        expect(element.attr('class')).toBe(null);
      });

      it('should return the element', function () {
        var element = new VirtualElement('div');
        expect(element.addClass('data')).toBe(element);
      });
    });

    describe('removeClass()', function () {
      it('removeClass removes a class from the className', function () {
        var element = new VirtualElement('div');

        expect(element.attr('class')).toBe(null);
        element.addClass('first');
        expect(element.attr('class')).toBe('first');
        element.addClass('second');
        expect(element.attr('class')).toBe('first second');

        element.removeClass('first');
        expect(element.attr('class')).toBe('second');
        element.removeClass('second');
        expect(element.attr('class')).toBe('');
      });

      it('should return the element', function () {
        var element = new VirtualElement('div');

        expect(element.removeClass()).toBe(element);
      });
    });

    describe('hasClass()', function () {
      it('hasClass checks if a class is contained in the className', function () {
        var element = new VirtualElement('div');

        expect(element.hasClass()).toBe(false);
        expect(element.hasClass('first')).toBe(false);
        element.attr('class', 'first second');
        expect(element.hasClass('first')).toBe(true);
        expect(element.hasClass('second')).toBe(true);
      });

      it('returns false when undefined and null are passed', function () {
        var element = new VirtualElement('div');

        element.addClass('undefined').addClass('null');

        expect(element.hasClass(undefined)).toBe(false);
        expect(element.hasClass(null)).toBe(false);
      });
    });

    describe('addChild(), children(), parent()', function () {
      it('should have the correct parent', function () {
        var parentElement = new VirtualElement('span'),
            child = new VirtualElement('div');

        parentElement.addChild(child);

        expect(child.parent()).toBe(parentElement);
        expect(child.parent().children(0).parent()).toBe(parentElement);
        expect(child.parent().tagName()).toBe('span');
      });

      it('should have the correct children', function () {
        var parentElement = new VirtualElement('ul'),
            child = new VirtualElement('li');

        parentElement.addChild(child);

        expect(parentElement.children()[0].tagName()).toBe('li');
        expect(parentElement.children(0).tagName()).toBe('li');
      });

      it('should insert a child at the correct place', function () {
        var element = new VirtualElement('div');

        element.addChild(new VirtualElement('div'));
        element.addChild(new VirtualElement('span'), 0);

        expect(element.children(0).tagName()).toBe('span');
        expect(element.children(1).tagName()).toBe('div');
      });

      it('should insert in the middle', function () {
        var element = new VirtualElement('ul');

        element.addChild((new VirtualElement('li')).html('first'));
        element.addChild((new VirtualElement('li').html('third')));
        element.addChild((new VirtualElement('li')).html('second'), 1);

        expect(element.children()[0].html()).toBe('first');
        expect(element.children()[1].html()).toBe('second');
        expect(element.children()[2].html()).toBe('third');
        expect(element.children().length).toBe(3);
      });

      it('addChild() returns the element', function () {
        var element = new VirtualElement('div');

        expect(element.addChild()).toBe(element);
      });

      it('handles circular references', function () {

      });
    });

    describe('render()', function () {
      it('renders css properties correctly', function () {
        var element = new VirtualElement('div');
        element.css('padding', 20);

        expect(element.render()).toBe('<div style="padding:20px;"></div>');
      });
    });

    describe('renderChildren()', function () {

    });

    it('should chain successfully', function () {
      var element = (new VirtualElement('div'))
          .tagName('span')
          .html('parent content')
          .addChild(new VirtualElement('div'))
              .children(0)
              .html('child content')
          .parent()
          .css('marginTop', 10)
          .attr('data-custom', 10)
          .addClass(['first', 'second', 'third'])
          .removeClass(['first', 'third']);

      expect(element.tagName()).toBe('span');
      expect(element.html()).toBe('parent content');
      expect(element.children().length).toBe(1);
      expect(element.children()[0].tagName()).toBe('div');
      expect(element.children()[0].html()).toBe('child content');
      expect(element.css('marginTop')).toBe('10px');
      expect(element.attr('data-custom')).toBe(10);
      expect(element.attr('class')).toBe('second');
    });
  });

})();
