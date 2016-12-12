; (function () {

  function initializeFixtures() {
    var fixture = $('<div>', {
      id: 'sandbox'
    });
    fixture.append($('<div>', {
      id: 'testElement'
    }));
    setFixtures(fixture);
  }

  function testHtml(html, expected) {
    html = html.toLowerCase();
    expected = expected || html;
    expected = expected.toLowerCase();
    document.getElementById('testElement').innerHTML = html;
    blocks.query({}, document.getElementById('testElement'));
    expect($('#testElement').html().toLowerCase().replace(/[\n\r ]/g, '')).toBe(expected.replace(/[\n\r ]/g, ''));
  }

  describe('Parsing (testing html)', function () {
    beforeEach(function () {
      initializeFixtures();
    });

    it('<div> parsed correctly', function () {
      testHtml('<div></div>');
    });

    it('<div> without closing tag parsed correctly', function () {
      testHtml('<div>', '<div></div>');
    });

    it('<span> parse correctly', function () {
      testHtml('<span></span>');
    });

    it('<input> parsed correctly', function () {
      testHtml('<input>');
    });

    it('<br> parsed correctly', function () {
      testHtml('<br>');
    });

    it('<table> parsed correctly', function () {
      testHtml('<table><tbody></tbody></table>');
    });

    it('<div> -> <ul> -> <li> structure parsed correctly', function () {
      testHtml('<div><ul><li></li><li></li></ul></div>');
    });

    it('<table> -> <thead> -> <tr> -> <th> <-<- <tbody> -> <tr> -> <td> structure parsed correctly', function () {
      testHtml('<table><thead><tr><th></th></tr></thead><tbody><tr><td></td></tr></tbody></table>');
    });

    it('<p> with text to be correctly parsed', function () {
      testHtml('<p>Here is some text </p>');
    });

    it('<p> with &nbsp; to be correctly parsed', function () {
      testHtml('<span> Here is some &nbsp; </span>');
    });

    it('parse text in the middle of other elements', function () {
      testHtml('<span> <p></p> text... <p></p> </span>');
    });

    it('parse text in the ends of other elements', function () {
      testHtml('<span> Text <p></p> Some other text</span>');
    });
  });

  describe('Parsing (testing blocks comments)', function () {
    beforeEach(function () {
      initializeFixtures();
    });

    //it('successfully parses blocks comment', function () {
    //  var comment = 'blocks each($this)';
    //  var endComment = '/blocks';
    //  var id;
    //
    //  document.getElementById('testElement').appendChild(document.createComment(comment));
    //  document.getElementById('testElement').appendChild(document.createComment(endComment));
    //
    //  blocks.query('content', document.getElementById('testElement'));
    //  id = parseInt(document.getElementById('testElement').getAttribute('data-id')) + 1;
    //
    //  expect(document.getElementById('testElement').childNodes.length).toBe(2);
    //  expect(document.getElementById('testElement').childNodes[0].nodeValue).toBe(' ' + id + ':blocks each($this) ');
    //  expect(document.getElementById('testElement').childNodes[1].nodeValue).toBe(' ' + id + ':/blocks ');
    //});

    it('it does not execute expressions in comments', function () {
      var comment = '{{property.thatDoesNotExist}}';
      document.getElementById('testElement').appendChild(document.createComment(comment));

      blocks.query({}, document.getElementById('testElement'));
    });
  });

  describe('Parsing (testing attributes)', function () {
    beforeEach(function () {
      initializeFixtures();
    });

    it('value attribute parsed correctly', function () {
      var html = '<input type="text" value="Some Value" />';

      document.getElementById('testElement').innerHTML = html;
      blocks.query({}, document.getElementById('testElement'));

      expect($('#testElement').children(0)).toHaveAttr('value', 'Some Value');
    });

    it('checked attribute parsed correctly', function () {
      var html = '<input type="checkbox" checked="checked" />';

      document.getElementById('testElement').innerHTML = html;
      blocks.query({}, document.getElementById('testElement'));

      expect($('#testElement').children(0)).toHaveAttr('checked', 'checked');
    });

    it('data-custom-attribute parsed correctly', function () {
      var html = '<div data-custom-attribute="data-is- custom - attribute"></div>';
      document.getElementById('testElement').innerHTML = html;
      blocks.query({}, document.getElementById('testElement'));

      expect($('#testElement').children(0)).toHaveAttr('data-custom-attribute', 'data-is- custom - attribute');
    });
  });

  describe('Parsing (testing styles)', function () {

    beforeEach(function () {
      initializeFixtures();
    });

    it('parses simple style correctly', function () {
      var html = '<div style="line-height: 3em"></div>';
      document.getElementById('testElement').innerHTML = html;
      blocks.query({}, document.getElementById('testElement'));

      expect($('#testElement').children(0)).toHaveCss({
        lineHeight: '48px'
      });
    });

    it('parses multiple styles correctly', function () {
      var html = '<div style="width: 100px; height: 100px; text-indent: 9999px;"></div>';

      document.getElementById('testElement').innerHTML = html;
      blocks.query({}, document.getElementById('testElement'));

      expect($('#testElement').children(0)).toHaveCss({
        width: '100px',
        height: '100px',
        textIndent: '9999px'
      });
    });

    it('parses values with quotes correctly', function () {
      var html = '<div style=\'background-image: url("image.jpg");\'></div>';
      document.getElementById('testElement').innerHTML = html;

      blocks.query({}, document.getElementById('testElement'));

      expect($('#testElement').children(0).attr('style').toLowerCase().indexOf('background-image') != -1).toBe(true);
      expect($('#testElement').children(0).attr('style').toLowerCase().indexOf('image.jpg') != -1).toBe(true);
    });

    it('parses style with comments at the begining correctly', function () {
      var html = '<div style="/*width: 3px;*/height:300px;"></div>';
      document.getElementById('testElement').innerHTML = html;

      blocks.query({}, document.getElementById('testElement'));

      expect($('#testElement').children()).not.toHaveCss({ width: '3px' });
      expect($('#testElement').children()).toHaveCss({ height: '300px' });
    });

    it('parses style with comments in the middle correctly', function () {
      var html = '<div style="height:20px;/*width: 3px;*/height:300px;"></div>';
      document.getElementById('testElement').innerHTML = html;

      blocks.query({}, document.getElementById('testElement'));

      expect($('#testElement').children()).not.toHaveCss({ width: '3px' });
      expect($('#testElement').children()).toHaveCss({ height: '300px' });
    });

    it('parses style with comments at the ending correctly', function () {
      var html = '<div style="height:20px;/*width: 3px;*/"></div>';
      document.getElementById('testElement').innerHTML = html;

      blocks.query({}, document.getElementById('testElement'));

      expect($('#testElement').children()).not.toHaveCss({ width: '3px' });
      expect($('#testElement').children()).toHaveCss({ height: '20px' });
    });

  });

  describe('Parsing (testing comments)', function () {

    beforeEach(function () {
      initializeFixtures();
    });

    it('parses and leaves html comment', function () {
      var html = ' Here is some content <div></div>';
      document.getElementById('testElement').appendChild(document.createComment(html));

      blocks.query({}, document.getElementById('testElement'));

      expect($('#testElement').html().indexOf(' Here is some content ') != -1).toBe(true);
    });

    it('parses comments containing & < > symbols inside correctly', function () {
      var html = '&<>"\'<div></div>';
      document.getElementById('testElement').appendChild(document.createComment(html));

      blocks.query({}, document.getElementById('testElement'));

      expect($('#testElement').html().indexOf('&<>"\'') != -1).toBe(true);
    });

    it('parses comments with inside comments correctly', function () {
      var html = ' Some comment <!-- inside --><div></div>';
      document.getElementById('testElement').appendChild(document.createComment(html));

      blocks.query({}, document.getElementById('testElement'));

      expect($('#testElement').html().indexOf(' Some comment <!-- inside ') != -1).toBe(true);
    });

    it('parses comments with tags inside correctly', function () {
      var html = 'Some comment <div></div>';
      document.getElementById('testElement').appendChild(document.createComment(html));

      blocks.query({}, document.getElementById('testElement'));

      expect($('#testElement').children().length).toBe(0);
    });
  });

  describe('Parsing (TextNode)', function () {

    beforeEach(function () {
      initializeFixtures();
    });

    it('parses simple text node correctly', function () {
      var html = 'Just A Text Node';
      document.getElementById('testElement').innerHTML = html;

      blocks.query({}, document.getElementById('testElement'));

      // NodeType = 3 is a text node
      expect($('#testElement').get(0).firstChild.nodeType == 3).toBe(true);
      expect($('#testElement').html()).toBe('Just A Text Node');
    });

    it('parses text node before an element correctly', function () {
      document.getElementById('testElement').appendChild(document.createTextNode('Text Node Data'));
      document.getElementById('testElement').appendChild(document.createElement('div'));

      blocks.query({}, document.getElementById('testElement'));

      // NodeType = 3 is a text node
      expect($('#testElement').get(0).childNodes[0].nodeType == 3).toBe(true);
      expect($('#testElement').html().indexOf('Text Node Data') != -1).toBe(true);
    });

    it('parses text node after an element correctly', function () {
      document.getElementById('testElement').appendChild(document.createElement('div'));
      document.getElementById('testElement').appendChild(document.createTextNode('Text Node Data'));
      document.getElementById('testElement').appendChild(document.createElement('div'));

      blocks.query({}, document.getElementById('testElement'));

      // NodeType = 3 is a text node
      expect($('#testElement').get(0).childNodes[1].nodeType == 3).toBe(true);
      expect($('#testElement').html().indexOf('Text Node Data') != -1).toBe(true);
    });

    it('parses text node in the middle of two elements correctly', function () {
      document.getElementById('testElement').appendChild(document.createElement('div'));
      document.getElementById('testElement').appendChild(document.createTextNode('Text Node Data'));

      blocks.query({}, document.getElementById('testElement'));

      // NodeType = 3 is a text node
      expect($('#testElement').get(0).childNodes[1].nodeType == 3).toBe(true);
      expect($('#testElement').html().indexOf('Text Node Data') != -1).toBe(true);
    });

    // TODO: After sync() was implemented the white space is not excluded but it
    // could be excluded when rendering each() - think about that
    // it('excludes white space text nodes by default', function () {
    //   document.getElementById('testElement').appendChild(document.createTextNode(' '));
    //   document.getElementById('testElement').appendChild(document.createElement('div'));
    //
    //   blocks.query({}, document.getElementById('testElement'));
    //
    //   // NodeType = 3 is a text node
    //   expect($('#testElement').get(0).childNodes[0].nodeType == 3).toBe(false);
    //   expect($('#testElement').html().indexOf(' ') == -1).toBe(true);
    // });

    it('parses white space text node correctly', function () {
      document.getElementById('testElement').appendChild(document.createTextNode(' '));
      document.getElementById('testElement').appendChild(document.createElement('div'));

      blocks.query({}, document.getElementById('testElement'));

      // NodeType = 3 is a text node
      expect($('#testElement').get(0).childNodes[0].nodeType == 3).toBe(true);
      expect($('#testElement').html().indexOf(' ') != -1).toBe(true);
    });
  });

  describe('Parsing (expressions)', function () {
    beforeEach(function () {
      initializeFixtures();
    });

    it('html containing expression does not throw error', function () {
      document.getElementById('testElement').appendChild(document.createTextNode('{{value}}'));

      function query() {
        blocks.query({
          value: 'content'
        }, document.getElementById('testElement'));
      }

      expect(query).not.toThrow();
      expect($('#testElement')).toHaveHtml('content');
    });

    it('expression opening does not throw exception and does not evaluate', function () {
      document.getElementById('testElement').appendChild(document.createTextNode('content {{value content'));

      function query() {
        blocks.query({
          value: 'content'
        }, document.getElementById('testElement'));
      }

      expect(query).not.toThrow();
      expect($('#testElement')).toHaveHtml('content {{value content');
    });

    it('expression closing does not throw exception and does not evaluate', function () {
      document.getElementById('testElement').appendChild(document.createTextNode('content value}} content'));

      function query() {
        blocks.query({
          value: 'content'
        }, document.getElementById('testElement'));
      }

      expect(query).not.toThrow();
      expect($('#testElement')).toHaveHtml('content value}} content');
    });

    it('does not treat as expression when having only one ending bracket', function () {
      document.getElementById('testElement').appendChild(document.createTextNode('{{value} }'));

      function query() {
        blocks.query({
          value: 'content'
        }, document.getElementById('testElement'));
      }

      expect(query).not.toThrow();
      expect($('#testElement')).toHaveHtml('{{value} }');
    });

    it('does not treat as expression when having only one starting bracket', function () {
      document.getElementById('testElement').appendChild(document.createTextNode('{ {value}}'));

      function query() {
        blocks.query({
          value: 'content'
        }, document.getElementById('testElement'));
      }

      expect(query).not.toThrow();
      expect($('#testElement')).toHaveHtml('{ {value}}');
    });

    it('', function () {

    });
  });

  describe('Parsing (scripts)', function () {
    beforeEach(function () {
      initializeFixtures();
    });

    it('does not throw an error (text/javascript)', function () {
      document.getElementById('testElement').appendChild(document.createElement('script'));

      function query() {
        blocks.query({
          value: 'content'
        }, document.getElementById('testElement'));
      }

      expect(query).not.toThrow();
      expect($('#testElement script')).toHaveText('');
      expect($('#testElement script')).not.toHaveAttr('data-id');
    });

    it('does not throw an error (text/blocks-template)', function () {
      var script = document.createElement('script');
      script.setAttribute('type', 'text/blocks-template');
      document.getElementById('testElement').appendChild(script);

      function query() {
        blocks.query({
          value: 'content'
        }, document.getElementById('testElement'));
      }

      expect(query).not.toThrow();
      expect($('#testElement script')).not.toHaveAttr('data-id');
    });

    it('scripts are not evaluated', function () {
      $('#testElement').html('<script type="text/blocks-template">{{$this}}</script>');

      blocks.query('content', document.getElementById('testElement'));

      expect($('#testElement script')[0].text.trim()).toBe('{{$this}}');
    });
  });
})();
