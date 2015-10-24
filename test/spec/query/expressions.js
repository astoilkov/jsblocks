; (function () {

  function appendText(text) {
    document.getElementById('testElement').appendChild(document.createTextNode(text));
  }

  function setAttr(attrName, attrValue) {
    document.getElementById('testElement').setAttribute(attrName, attrValue);
  }

  function query(model) {
    blocks.query(model || {}, document.getElementById('testElement'));
  }

  describe('blocks.query.expressions', function () {
    beforeEach(function () {
      var fixture = $('<div>', {
        id: 'sandbox'
      });
      fixture.append($('<div>', {
        id: 'testElement'
      }));
      setFixtures(fixture);
    });

    describe('TextNode', function () {
      it('expression evaluates correctly', function () {
        appendText('{{$this}}');

        query('content');

        expect($('#testElement')).toHaveHtml('content');
      });

      it('expression with white spaces is evaluated correctly', function () {
        appendText('{{  value.text  }}');

        query({
          value: {
            text: 'some text'
          }
        });

        expect($('#testElement')).toHaveHtml('some text');
      });

      it('expression starting on one line and closing on the other is considerred an expression (using \\n for new lines)', function () {
        appendText('{{value\n}}');

        query({
          value: 'content'
        });

        expect(query).not.toThrow();
        expect($('#testElement')).toHaveHtml('content');
      });

      it('expression starting on one line and closing on the other is considerred an expression (using \\r\\n for new lines)', function () {
        appendText('{{value\r\n}}');

        query({
          value: 'content'
        });

        expect(query).not.toThrow();
        expect($('#testElement')).toHaveHtml('content');
      });

      it('expression starting on one line and closing on the other is considerred an expression (using \\r for new lines)', function () {
        appendText('{{value\r}}');

        query({
          value: 'content'
        });

        expect(query).not.toThrow();
        expect($('#testElement')).toHaveHtml('content');
      });

      it('expression could call a function', function () {
        appendText('{{$this()}}');

        query(function () {
          return 'function text';
        });

        expect($('#testElement')).toHaveHtml('function text');
      });

      it('expression with other text is evaluated correctly', function () {
        appendText('My name is {{FirstName}} {{LastName}}.');

        query({
          FirstName: 'Antonio',
          LastName: 'Stoilkov'
        });

        expect($('#testElement')).toHaveHtml('My name is Antonio Stoilkov.');
      });

      it('invalid expressions throws an exception', function () {
        appendText('{{throws.an.error}}');

        expect(query).toThrow();
      });

      it('observable is successfully updated', function () {
        var observable = blocks.observable('content');

        appendText('{{value}}');

        query({
          value: observable
        });

        expect($('#testElement')).toHaveText('content');
        observable('html');
        expect($('#testElement')).toHaveText('html');
      });

      it('observable value is successfully updated after being empty string initially', function () {
        var observable = blocks.observable();

        appendText('{{$this}}');

        query(observable);
        expect($('#testElement')).toHaveText('');
        observable('content');
        expect($('#testElement')).toHaveText('content');
      });

      it('multiple observables in one expressions are updated correctly', function () {
        var firstName = blocks.observable('Antonio');
        var lastName = blocks.observable('Stoilkov');
        var age = blocks.observable('');
        var last = blocks.observable('last');
        appendText('My name is {{firstName}} {{lastName}}. I am {{age}}years old {{last}}.');

        query({
          firstName: firstName,
          lastName: lastName,
          age: age,
          last: last
        });

        expect($('#testElement')).toHaveText('My name is Antonio Stoilkov. I am years old last.');

        firstName('A');
        lastName('BBBBBBBBBBBBBBBBBBBB');
        age(1);
        last('laaaaaaaaast');

        expect($('#testElement')).toHaveText('My name is A BBBBBBBBBBBBBBBBBBBB. I am 1years old laaaaaaaaast.');
      });

      it('array observable updates an expression correctly', function () {
        var numbers = blocks.observable([1, 2, 3]);

        appendText('Your numbers are {{numbers}}. And the correct numbers are {{numbers}}.');

        query({
          numbers: numbers
        });

        expect($('#testElement')).toHaveText('Your numbers are 1,2,3. And the correct numbers are 1,2,3.');

        numbers.removeAll();

        expect($('#testElement')).toHaveText('Your numbers are . And the correct numbers are .');

        numbers.push(2, 3);

        expect($('#testElement')).toHaveText('Your numbers are 2,3. And the correct numbers are 2,3.');
      });

      it('handles undefined, null, NaN without throwing an error', function () {
        var undefinedValue = blocks.observable(undefined);
        var nullValue = blocks.observable(null);

        appendText('{{undefinedValue}}{{nullValue}}');

        query({
          undefinedValue: undefinedValue,
          nullValue: nullValue
        });

        expect($('#testElement')).toHaveText('');
      });

      it('successfully updates a conditional expression', function () {
        var value = blocks.observable(true);

        appendText('its a {{value() ? "success" : "fail"}} ... really');

        query({
          value: value
        });

        expect($('#testElement')).toHaveText('its a success ... really');

        value(false);

        expect($('#testElement')).toHaveText('its a fail ... really');
      });

      it('the value is escaped successfully', function () {
        var html = blocks.observable('<div>content</div>');

        appendText('{{html}}');

        query({
          html: html
        });

        expect($('#testElement')).toHaveText('<div>content</div>');
        expect($('#testElement').children().length).toBe(0);

        html('<input />');

        expect($('#testElement')).toHaveText('<input />');
        expect($('#testElement').children().length).toBe(0);
      });
      
      it('multiple observables and non observables are synced correctly', function () {
        var observable = blocks.observable(2);
        
        appendText('{{nonObservable}}{{observable}}{{observable}}{{nonObservable}}{{nonObservable}}{{observable}}');
        
        query({
          nonObservable: 1,
          observable: observable
        });
        
        expect($('#testElement')).toHaveText('122112');
        
        observable(3);
        
        expect($('#testElement')).toHaveText('133113');
      });
      
      it('multiple observables and non observables (with spaces between them) are synced correctly', function () {
        var observable = blocks.observable(2);
        
        appendText(' {{nonObservable}} {{observable}} {{observable}} {{nonObservable}} {{nonObservable}} {{observable}} ');
        
        query({
          nonObservable: 1,
          observable: observable
        });
        
        expect($('#testElement').text()).toBe(' 1 2 2 1 1 2 ');
        
        observable(3);
        
        expect($('#testElement').text()).toBe(' 1 3 3 1 1 3 ');
      });

    });

    describe('attributes', function () {
      it('attribute is correctly populated', function () {
        setAttr('tabindex', '{{tabIndex}}');

        query({
          tabIndex: 0
        });

        expect($('#testElement')).toHaveAttr('tabindex', '0');
      });

      it('expression containing spaces is correctly evaluated', function () {
        setAttr('class', '{{ classes }}');

        query({
          classes: 'first second'
        });

        expect($('#testElement')).toHaveAttr('class', 'first second');
      });

      it('two expressions are correctly populated', function () {
        setAttr('class', 'edit {{editCustomClasses}} selected {{selectedCustomClasses}}');

        query({
          editCustomClasses: 'edit1 edit2',
          selectedCustomClasses: 'selected1 selected2'
        });

        expect($('#testElement')).toHaveAttr('class', 'edit edit1 edit2 selected selected1 selected2');
      });

      it('invalid expressions throws an exception', function () {
        setAttr('custom-attribute', '{{throws.an.error}}');

        expect(query).toThrow();
      });

      it('observable is successfully updated', function () {
        var observable = blocks.observable('content');

        setAttr('data-content', '{{value}}');

        query({
          value: observable
        });

        expect($('#testElement')).toHaveAttr('data-content', 'content');
        observable('html');
        expect($('#testElement')).toHaveAttr('data-content', 'html');
      });

      it('multiple observables in one expressions are updated correctly', function () {
        var firstName = blocks.observable('Antonio');
        var lastName = blocks.observable('Stoilkov');
        var age = blocks.observable(22);
        var last = blocks.observable('last');
        setAttr('data-meta', 'My name is {{firstName}} {{lastName}}. I am {{age}} years old {{last}}.');

        query({
          firstName: firstName,
          lastName: lastName,
          age: age,
          last: last
        });

        expect($('#testElement')).toHaveAttr('data-meta', 'My name is Antonio Stoilkov. I am 22 years old last.');

        firstName('A');
        lastName('BBBBBBBBBBBBBBBBBBBB');
        age(1);
        last('laaaaaaaaast');

        expect($('#testElement')).toHaveAttr('data-meta', 'My name is A BBBBBBBBBBBBBBBBBBBB. I am 1 years old laaaaaaaaast.');
      });

      it('array observable updates an expression correctly', function () {
        var numbers = blocks.observable([1, 2, 3]);

        setAttr('data-numbers', 'Your numbers are {{numbers}}. And the correct numbers are {{numbers}}.');

        query({
          numbers: numbers
        });

        expect($('#testElement')).toHaveAttr('data-numbers', 'Your numbers are 1,2,3. And the correct numbers are 1,2,3.');

        numbers.removeAll();

        expect($('#testElement')).toHaveAttr('data-numbers', 'Your numbers are . And the correct numbers are .');

        numbers.push(2, 3);

        expect($('#testElement')).toHaveAttr('data-numbers', 'Your numbers are 2,3. And the correct numbers are 2,3.');
      });

      it('handles undefined, null, NaN without throwing an error', function () {
        var undefinedValue = blocks.observable(undefined);
        var nullValue = blocks.observable(null);

        setAttr('data-value', '{{undefinedValue}}{{nullValue}}');

        query({
          undefinedValue: undefinedValue,
          nullValue: nullValue
        });

        expect($('#testElement')).toHaveAttr('data-value', '');
      });

      it('successfully a conditional attribute expression', function () {
        var value = blocks.observable(false);

        setAttr('data-value', 'its a {{value() ? "success" : "fail"}} ... really');

        query({
          value: value
        });

        expect($('#testElement')).toHaveAttr('data-value', 'its a fail ... really');

        value(true);

        expect($('#testElement')).toHaveAttr('data-value', 'its a success ... really');
      });

      it('attribute is escaped successfully', function () {
        var html = blocks.observable('<div>content</div>');

        setAttr('data-value', '{{html}}');

        query({
          html: html
        });

        expect($('#testElement')).toHaveAttr('data-value', '&lt;div>content&lt;/div>');

        html('<input />&nbsp;');

        expect($('#testElement')).toHaveAttr('data-value', '&lt;input />&amp;nbsp;');
      });
    });
  
    describe('array observables', function () {

      it('deletes the right number of nodes on reset', function () {
        var testcontainer = document.getElementById('testElement').appendChild(document.createElement('div'));
        var arrayObservable = blocks.observable([]);

        testcontainer.innerHTML = '<div data-query="each(tests)">{{$this.content}}</div>';

        var queryContainer =  testcontainer.childNodes[0];

        query({
          tests: arrayObservable
        });

        expect(queryContainer.childNodes.length).toBe(0);

        arrayObservable.reset([{
          content: blocks.observable('content')
        }]);

        expect(queryContainer.childNodes.length).toBe(2);

        arrayObservable.reset([{ 
          content: blocks.observable('content1')
        },{
          content: blocks.observable('content2')
        }]);

        expect(queryContainer.childNodes.length).toBe(4);

        for (var i = 0; i < queryContainer.childNodes.length; i++) {
          var child = queryContainer.childNodes[i];
          if (i ===  0 || i == 2) {
            expect(child.nodeType).toBe(8);
          } else {
            expect(child.nodeType).toBe(3);
            expect(child.nodeValue).toBe('content' + (i == 1 ? 1 : 2));
          }
        }

      });

      it('updates the right node when called in reset()', function () {
        var ul = document.getElementById('testElement').appendChild(document.createElement('div')).appendChild(document.createElement('ul'));
        ul.setAttribute('data-query', 'each(updateTests)');
        ul.innerHTML = '<li>\n{{$this.content}}</li>';

        var arr = blocks.observable([]);


        query({
          updateTests: arr
        });

        arr.reset([{
          content:  blocks.observable('test')
        }]);

        arr.reset([{
          content:  blocks.observable('test')
        }]);

        expect(ul.innerHTML).toMatch(/<li data-id="\d+">[\n\s]*<!-- \d+:blocks -->[\n\s]*test[\n\s]*<\/li>/im);
      });

    });
  });

})();
