; (function () {
  testModule('blocks.queries.methodName', function (methodName) {
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

    describe('Context properties [' + methodName + ']', function () {
      beforeEach(function () {
        var fixture = $('<div>', {
          id: 'sandbox'
        });
        fixture.append($('<div>', {
          id: 'testElement'
        }));
        setFixtures(fixture);
      });

      it('$this is the root model (level 0)', function () {
        setQuery('setClass($this.data)');

        query({
          data: 'content'
        });

        expect($('#testElement')).toHaveClass('content');
      });

      it('$root is the root model (level 0)', function () {
        setQuery('setClass($root.data)');

        query({
          data: 'content'
        });

        expect($('#testElement')).toHaveClass('content');
      });

      it('in the root - $this = $root (level 0)', function () {
        setQuery('html($this === $root)');

        query();

        expect($('#testElement')).toHaveHtml('true');
      });

      it('$parents is function (level 0)', function () {
        setQuery('html(blocks.isArray($parents))');

        query();

        expect($('#testElement')).toHaveHtml('true');
      });

      it('$parents(0) is undefined (level 0)', function () {
        setQuery('html($parents[0] === undefined)');

        query();

        expect($('#testElement')).toHaveHtml('true');
      });

      it('$index = undefined (level 0)', function () {
        setQuery('html($this.$index === undefined)');

        query();

        expect($('#testElement')).toHaveHtml('true');
      });

      it('$index is not defined as a property (level 0)', function () {
        setQuery('html($this.hasOwnProperty("$index"))');

        query();

        expect($('#testElement')).toHaveHtml('false');
      });

      it('$context != $root', function () {
        setQuery('html($context != $root)');

        query();

        expect($('#testElement')).toHaveHtml('true');
      });


      it('$context does not have $root properties', function () {
        setQuery('html($context.hasOwnProperty("modelData"))');

        query({
          modelData: 'data'
        });

        expect($('#testElement')).toHaveHtml('false');
      });

      it('$context.$this = $root.$this', function () {
        setQuery('html($context.$this === $root)');

        query();

        expect($('#testElement')).toHaveHtml('true');
      });

      it('$context.$root = $root', function () {
        setQuery('html($context.$root === $root)');

        query();

        expect($('#testElement')).toHaveHtml('true');
      });

      it('$context.$parents = $root.$parents', function () {
        setQuery('html($context.$parents === $parents)');

        query();

        expect($('#testElement')).toHaveHtml('true');
      });

      it('$context property is not overriden', function () {
        setQuery('html($context === 1)');

        query({
          $context: 1
        });

        expect($('#testElement')).toHaveHtml('true');
      });

      it('$this property is not overriden', function () {
        setQuery('html($this === null)');

        query({
          $this: null
        });

        expect($('#testElement')).toHaveHtml('true');
      });

      it('$root property is not overriden', function () {
        setQuery('html($root === undefined)');

        query({
          $root: undefined
        });

        expect($('#testElement')).toHaveHtml('true');
      });

      it('$parent property is not overriden', function () {
        setQuery('html($parent === 3)');

        query({
          $parent: 3
        });

        expect($('#testElement')).toHaveHtml('true');
      });

      it('$parents property is not overriden', function () {
        setQuery('html($parents === 4)');

        query({
          $parents: 4
        });

        expect($('#testElement')).toHaveHtml('true');
      });

      it('$index property is not overriden', function () {
        setQuery('html($index === "$index")');

        query({
          $index: '$index'
        });

        expect($('#testElement')).toHaveHtml('true');
      });

      it('$parentContext property', function () {
        setQuery('html($parentContext === null)');

        query();

        expect($('#testElement')).toHaveHtml('true');
      });

      //it('$element is defined', function () {
      //  setQuery('html($context.$element !== null)');
      //
      //  query();
      //
      //  expect($('#testElement')).toHaveHtml('true');
      //});
      //
      //it('$element is defined in custom query', function () {
      //  var $actualElement;
      //
      //  blocks.queries.custom = {
      //    preprocess: function () {
      //      debugger;
      //      $actualElement = blocks.context(this).$element;
      //    },
      //    update: function () {
      //      $actualElement = blocks.context(this).$element;
      //    }
      //  };
      //
      //  setQuery('custom()');
      //
      //  query({
      //    modelValue: 3
      //  });
      //
      //  expect($actualElement).not.toBeNull();
      //});

      it('returns the correct context and dataItem', function () {
        var actualModelValue;
        var expectedModelValue = 3;
        var actualContextValue;

        blocks.queries.custom = {
          preprocess: function () {
            actualModelValue = blocks.dataItem(this);
            actualContextValue = blocks.context(this);

            expect(blocks.context(this.parent())).toBe(blocks.context(this));
            expect(blocks.dataItem(this.parent())).toBe(blocks.dataItem(this));
          },
          update: function () {
            actualModelValue = blocks.dataItem(this);
            actualContextValue = blocks.context(this);

            expect(blocks.context(this.parentNode)).toBe(blocks.context(this));
            expect(blocks.dataItem(this.parentNode)).toBe(blocks.dataItem(this));
          }
        };

        setQuery('custom()');

        query({
          modelValue: 3
        });


        expect(actualModelValue.modelValue).toBe(expectedModelValue);
        expect(actualContextValue.$parentContext).toBeNull();
        expect(actualContextValue.$parent).toBeNull();
        expect(actualContextValue.$this).toBe(actualModelValue);
        expect(actualContextValue.$root).toBe(actualModelValue);
      });
    });

    // The with(innerObject) is hard coded and every call to query must contain an array property.
    // query({
    //   innerObject: {}
    //})
    describe('Context properties [' + methodName + '] in nested levels using blocks.queries.with', function () {
      beforeEach(function () {
        var fixture = $('<div>', {
          id: 'sandbox'
        });

        fixture.append($('<div>', {
          'data-query': 'with(innerObject)'
        }));

        fixture.children().eq(0).append($('<div>', {
          id: 'testElement'
        }));
        setFixtures(fixture);
      });

      it('$this = innerObject', function () {
        setQuery('html($this === $root.innerObject)');

        query({
          innerObject: {}
        })

        expect($('#testElement')).toHaveHtml('true');
      });

      it('$parent = $root (level 1)', function () {
        setQuery('html($parent === $root)');

        query({
          innerObject: {}
        });

        expect($('#testElement')).toHaveHtml('true');
      });

      it('$parents(0) = $root (level 1)', function () {
        setQuery('html($parents[0] === $root)');

        query({
          innerObject: {}
        });

        expect($('#testElement')).toHaveHtml('true');
      });

      it('$parents(1) = undefined (level 1)', function () {
        setQuery('html($parents[1] === undefined)');

        query({
          innerObject: {}
        });

        expect($('#testElement')).toHaveHtml('true');
      });

      it('$index = undefined (level 1)', function () {
        setQuery('html($this.$index === undefined)');

        query({
          innerObject: {}
        });

        expect($('#testElement')).toHaveHtml('true');
      });

      it('$this.modelData is defined in the level and not defined in the parent', function () {
        setQuery('html($this.modelData === 1 && $parent.modelData === undefined)');

        query({
          innerObject: {
            modelData: 1
          }
        });

        expect($('#testElement')).toHaveHtml('true');
      });

      it('$parent.modelData is defined and $this.modelData is not defined', function () {
        setQuery('html($parent.modelData === 1 && $this.modelData === undefined)');

        query({
          modelData: 1,
          innerObject: {}
        });

        expect($('#testElement')).toHaveHtml('true');
      });

      it('$parentContext.$this = $root', function () {
        setQuery('html($parentContext.$this === $root)');

        query({
          innerObject: {}
        });

        expect($('#testElement')).toHaveHtml('true');
      });

      it('$parentContext.$this.modelData === 1', function () {
        setQuery('html($parentContext.$this.modelData === 1)');

        query({
          modelData: 1,
          innerObject: {}
        });

        expect($('#testElement')).toHaveHtml('true');
      });

      it('$parentContext.$parents.length = 0', function () {
        setQuery('html($parentContext.$parents.length === 0)');

        query({
          modelData: 1,
          innerObject: {}
        });

        expect($('#testElement')).toHaveHtml('true');
      });

      it('returns the correct context and dataItem', function () {
        var actualModelValue;
        var expectedModelValue = 1;
        var actualInnerValue;
        var expectedInnerValue = 3;


        blocks.queries.custom = {
          preprocess: function () {
            actualModelValue = blocks.context(this).$parent.modelValue;
            actualInnerValue = blocks.dataItem(this).innerValue;

            expect(blocks.context(this.parent())).toBe(blocks.context(this).$parentContext);
            expect(blocks.dataItem(this.parent())).toBe(blocks.context(this).$parent);
          },
          update: function () {
            actualModelValue = blocks.context(this).$parent.modelValue;
            actualInnerValue = blocks.dataItem(this).innerValue;

            expect(blocks.context(this.parentNode)).toBe(blocks.context(this).$parentContext);
            expect(blocks.dataItem(this.parentNode)).toBe(blocks.context(this).$parent);
          }
        };

        setQuery('custom()');

        query({
          modelValue: 1,
          innerObject: {
            innerValue: 3
          }
        });

        expect(actualModelValue).toBe(expectedModelValue);
        expect(actualInnerValue).toBe(expectedInnerValue);
      });
    });

    // The each(array) is hard coded and every call to query must contain an array property. For convinience there is a getArray function
    // query({
    //   array: getArray()
    //})
    describe('Context properties [' + methodName + '] in nested levels using blocks.queries.each - ' + methodName, function () {
      beforeEach(function () {
        var fixture = $('<div>', {
          id: 'sandbox'
        });

        fixture.append($('<div>', {
          'data-query': 'each(array)'
        }));

        fixture.children().eq(0).append($('<div>', {
          id: 'testElement'
        }));
        setFixtures(fixture);
      });

      function getArray() {
        return [{
          FirstName: 'Antonio',
          LastName: 'Stoilkov'
        }];
      }

      it('FirstName + " " + LastName = Antonio Stoilkov', function () {
        setQuery('html(FirstName + " " + LastName)');

        query({
          array: getArray()
        });

        expect($('#testElement')).toHaveHtml('Antonio Stoilkov');
      });

      it('$this = array', function () {
        setQuery('html($this === $root.array');

        query({
          array: getArray()
        });
      });

      it('$index = 0', function () {
        setQuery('html($index() === 0)');

        query({
          array: getArray()
        })

        expect($('#testElement')).toHaveHtml('true');
      });

      it('$parent = $root (level 1)', function () {
        setQuery('html($parent === $root)');

        query({
          array: getArray()
        });

        expect($('#testElement')).toHaveHtml('true');
      });

      it('$parents(0) = $root (level 1)', function () {
        setQuery('html($parents[0] === $root)');

        query({
          array: getArray()
        });

        expect($('#testElement')).toHaveHtml('true');
      });

      it('$parents(1) = undefined (level 1)', function () {
        setQuery('html($parents[1] === undefined)');

        query({
          array: getArray()
        });

        expect($('#testElement')).toHaveHtml('true');
      });

      it('$this.modelData is defined in the level and not defined in the parent', function () {
        setQuery('html($this.FirstName === "Antonio" && $parent.modelData === undefined)');

        query({
          array: getArray()
        });

        expect($('#testElement')).toHaveHtml('true');
      });

      it('$parent.modelData is defined and $this.modelData is not defined', function () {
        setQuery('html($parent.modelData === 1 && $this.modelData === undefined)');

        query({
          modelData: 1,
          array: getArray()
        });

        expect($('#testElement')).toHaveHtml('true');
      });

      it('$parentContext.$this = $root', function () {
        setQuery('html($parentContext.$this === $root)');

        query({
          array: getArray()
        });

        expect($('#testElement')).toHaveHtml('true');
      });

      it('$parentContext.$this.modelData === 1', function () {
        setQuery('html($parentContext.$this.modelData === 1)');

        query({
          modelData: 1,
          array: getArray()
        });

        expect($('#testElement')).toHaveHtml('true');
      });

      it('$parentContext.$parents.length = 0', function () {
        setQuery('html($parentContext.$parents.length === 0)');

        query({
          modelData: 1,
          array: getArray()
        });

        expect($('#testElement')).toHaveHtml('true');
      });

      it('returns the correct context', function () {
        var actualFirstName,
            expectedFirstName = 'Antonio',
            actualContext;

        blocks.queries.custom = {
          preprocess: function () {
            actualFirstName = blocks.dataItem(this).FirstName;
            actualContext = blocks.context(this);

            expect(blocks.context(this.parent())).toBe(blocks.context(this).$parentContext);
            expect(blocks.dataItem(this.parent())).toBe(blocks.context(this).$parent);
          },
          update: function () {
            actualFirstName = blocks.dataItem(this).FirstName;
            actualContext = blocks.context(this);

            expect(blocks.context(this.parentNode)).toBe(blocks.context(this).$parentContext);
            expect(blocks.dataItem(this.parentNode)).toBe(blocks.context(this).$parent);
          }
        };

        setQuery('custom()');

        query({
          array: getArray()
        });

        expect(actualFirstName).toBe(expectedFirstName);
        expect(actualContext.$parents.length).toBe(1);
        expect(actualContext.$root).toBe(actualContext.$parent);
      });
    });

    describe('with() -> each() -> each() -> with() -> each() structure [' + methodName + ']', function () {
      beforeEach(function () {
        var fixture = $('<div>', {
          id: 'sandbox'
        });

        var $topObject = $('<div>', {
          'data-query': 'with(topObject)'
        });
        fixture.append($topObject);

        var $array = $('<div>', {
          'data-query': 'each(array)'
        });
        $topObject.append($array);

        var $arrayItem = $('<div>', {
          'data-query': 'each($this)'
        });
        $array.append($arrayItem);

        var $arrayItemData = $('<div>', {
          'data-query': 'each($this)'
        });
        $arrayItem.append($arrayItemData);

        var $lastArray = $('<div>', {
          'data-query': 'render($this.data).with($this.data)'
        });
        $arrayItemData.append($lastArray);

        var $bottomObject = $('<div>', {
          'id': 'testElement'
        });
        $lastArray.append($bottomObject);

        setFixtures(fixture);
      });

      function getModel() {
        return {
          topObject: {
            array: [
                [{
                  first: {
                    data: [{
                      bottom: 4
                    }]
                  },
                  second: {}
                }]
            ]
          }
        }
      }

      it('the bottom value to be correct', function () {
        setQuery('html($this[0].bottom)');

        query(getModel());

        expect($('#testElement')).toHaveHtml('4');
      });

      it('$parents.length = 4', function () {
        setQuery('html($parents.length === 5)');

        query(getModel());

        expect($('#testElement')).toHaveHtml('true');
      });

      it('$parent.data is array', function () {
        setQuery('html(blocks.isArray($parent.data))');

        query(getModel());

        expect($('#testElement')).toHaveHtml('true');
      });

      it('$parentContext.$index === $index', function () {
        setQuery('html($parentContext.$index() === $index())');

        query(getModel());

        expect($('#testElement')).toHaveHtml('true');
      });

      it('$parentContext.$parents.length = $parents.length - 1', function () {
        setQuery('html($parentContext.$parents.length === $parents.length - 1)');

        query(getModel());

        expect($('#testElement')).toHaveHtml('true');
      });

      it('$parents[0].data[0].bottom = 4', function () {
        setQuery('html($parents[0].data[0].bottom)');

        query(getModel());

        expect($('#testElement')).toHaveHtml('4');
      });

      it('$index = 0', function () {
        setQuery('html($index)');

        query(getModel());

        expect($('#testElement')).toHaveHtml('0');
      });

      it('$parentContext.$parentContext.$parentContext.$index = 0', function () {
        setQuery('html($parentContext.$parentContext.$parentContext.$index)');

        query(getModel());

        expect($('#testElement')).toHaveHtml('0');
      });

      it('$parents[$parents.length - 1] = $root', function () {
        setQuery('html($parents[$parents.length - 1] === $root)');

        query(getModel());

        expect($('#testElement')).toHaveHtml('true');
      });

      it('returns the correct context and dataItem', function () {
        var contextValue,
            dataItemValue,
            model = getModel();


        blocks.queries.custom = {
          preprocess: function () {
            contextValue = blocks.context(this);
            dataItemValue = blocks.dataItem(this);

            expect(blocks.context(this.parent())).toBe(blocks.context(this).$parentContext);
            expect(blocks.dataItem(this.parent())).toBe(blocks.context(this).$parent);
          },
          update: function () {
            contextValue = blocks.context(this);
            dataItemValue = blocks.dataItem(this);

            expect(blocks.context(this.parentNode)).toBe(blocks.context(this).$parentContext);
            expect(blocks.dataItem(this.parentNode)).toBe(blocks.context(this).$parent);
          }
        };

        setQuery('custom()');

        query(model);

        expect(contextValue.$this).toBe(dataItemValue);
        expect(contextValue.$root).toBe(model);
        expect(dataItemValue[0].bottom).toBe(4);
        expect(contextValue.$parentContext.$this.data[0].bottom).toBe(4);
      });
    });
  });
})();
