(function (blocks) {
  var beforeEach = window.jasmine.beforeEach;
  window.jasmine.beforeEach = function (callback) {
    $(function () {
      callback.apply(this, blocks.toArray(arguments));
    });
  };

  var testing = blocks.testing = {};

  var firstNames = ['Nancy', 'Andrew', 'Janet', 'Margaret', 'Steven', 'Michael', 'Robert', 'Laura', 'Anne', 'Nige'];
  var lastNames = ['Davolio', 'Fuller', 'Leverling', 'Peacock', 'Buchanan', 'Suyama', 'King', 'Callahan', 'Dodsworth', 'White'];
  var cities = ['Seattle', 'Tacoma', 'Kirkland', 'Redmond', 'London', 'Philadelphia', 'New York', 'Seattle', 'London', 'Boston'];
  var titles = ['Accountant', 'Vice President, Sales', 'Sales Representative', 'Technical Support', 'Sales Manager', 'Web Designer',
      'Software Developer', 'Inside Sales Coordinator', 'Chief Techical Officer', 'Chief Execute Officer'];
  var birthDates = [new Date('1948/12/08'), new Date('1952/02/19'), new Date('1963/08/30'), new Date('1937/09/19'), new Date('1955/03/04'), new Date('1963/07/02'), new Date('1960/05/29'), new Date('1958/01/09'), new Date('1966/01/27'), new Date('1966/03/27')];

  testing.createRandomData = function (count) {
    var data = [],
        now = new Date();
    for (var i = 0; i < count; i++) {
      var firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      var lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      var city = cities[Math.floor(Math.random() * cities.length)];
      var title = titles[Math.floor(Math.random() * titles.length)];
      var birthDate = birthDates[Math.floor(Math.random() * birthDates.length)];
      var age = now.getFullYear() - birthDate.getFullYear();

      data.push({
        Id: i + 1,
        FirstName: firstName,
        LastName: lastName,
        City: city,
        Title: title,
        BirthDate: birthDate,
        Age: age,
        RandomNumber: Math.ceil(Math.random() * 3)
      });
    }
    return data;
  };

  testing.createStaticData = function () {
    return [{
      Id: 0,
      FirstName: 'Antonio',
      LastName: 'Stoilkov',
      City: 'Blagoevgrad',
      Title: 'Programmer',
      BirthDate: new Date(1991, 09, 08),
      Age: 22,
      RandomNumber: 1
    }, {
      Id: 1,
      FirstName: 'Mihaela',
      LastName: 'Stoilkova',
      City: 'Sofia',
      Title: 'Marketing Specialist',
      BirthDate: new Date(1986, 09, 28),
      Age: 27,
      RandomNumber: 2
    }
    ];
  };

  blocks.testing.AjaxError = 'AjaxError';
  blocks.testing.AjaxTimeout = 'AjaxTimeout';
  var $ajax = $.ajax;
  $.ajaxSetup({
    timeout: 1
  });
  testing.overrideAjax = function (overrides) {
    $.ajax = function (options) {
      if (blocks.testing.AjaxTimeout == options.url) {
        $ajax(options);
        return;
      }
      var callback = blocks.testing.AjaxError == options.url ? options.error : options.success;
      var foundMatch = false;
      
      for (var key in overrides) {
        if (options.url == key) {
          callback(overrides[key](options));
          foundMatch = true;
          break;
        }
      }
      if (!foundMatch) {
        callback(testing.createStaticData());
      }
    };
  };
  testing.restoreAjax = function () {
    $.ajax = $ajax;
  };

  // override application start
  var start;
  testing.overrideApplicationStart = function (application) {
    start = application.start;
    var fixture = $('<div>', {
      id: 'sandbox'
    });
    fixture.append($('<div>', {
      id: 'testElement'
    }));
    setFixtures(fixture);
    application.start = function () {
      start.call(this, $('#testElement'));
    }
  };
  testing.restoreApplicationStart = function (application) {
    application.start = start;
  };

  var eventsData = [];
  testing.trackEvents = function (object, events) {
    eventsData = [];
    for (var i = 0; i < events.length; i++) {
      (function (eventName) {
        object.on(eventName, function () {
          eventsData.push({
            name: eventName,
            args: Array.prototype.slice.call(arguments)
          });
        });
      })(events[i]);
    }
  }

  testing.getTrackedEvents = function () {
    return eventsData;
  };


  testing.load = function () {
    var values = window.location.search.split('=');
    var spec = '';

    blocks.each(values, function (value, index) {
      if (value.indexOf('specPath') != -1) {
        spec = decodeURIComponent(values[index + 1].split('&')[0]);
      }
    });

    function createScript(path) {
      if (path.lastIndexOf('.js') == path.length - 3) {
        document.write('<script class="script" type="text/javascript" src="' + path + '?' + Math.random().toString().replace('.', '') + '" ><\/script>');
      }
    }

    function isSelected(path) {

      return path.replace('spec/', '').indexOf(spec) == 0;
    }

    function createMenu(tests) {
      var $parent = $('<ul>');
      var $currentParent;
      var value;
      var key;
      var path;

      for (key in tests) {
        value = tests[key];
        path = value[0].split('/');
        path = path.slice(0, path.length - 1).join('/');
        $currentParent = $('<ul>').addClass('group').appendTo($('<li>').appendTo($parent));
        createModuleLine($currentParent, key, path).addClass('group-title').addClass(isSelected(path) ? 'selected' : '');
        createChilds($currentParent, value);
      }

      $parent.append($('<div>', {
        css: {
          clear: 'both'
        }
      }));
      return $parent;
    }

    function createChilds($parent, array) {
      var path;
      var $module;
      for (var i = 0; i < array.length; i++) {
        path = array[i];
        if (typeof path == 'string') {
          $module = createModuleLine($parent, getName(path), path).addClass('test');
          if (isSelected(path)) {
            createScript(path);
            $module.addClass('selected');
          }

        } else {
          $parent.append(createMenu(path));
        }
      }
    }

    function getName(path) {
      var parts = path.split('/');
      return parts[parts.length - 1].replace('.spec', '');
    }

    function createModuleLine($parent, text, path) {
      return $('<li>').append($('<div>')
        .addClass('line')
        .append($('<span>').text(text))
        .append($('<input>', {
          type: 'button',
          value: 'Run'
        }).data('path', path).click(runSpec)))
        .appendTo($parent);
    }

    function runSpec(e) {
      var $target = $(e.target);
      var path = $target.data('path').replace('spec/', '');

      window.location = '/' + window.location.pathname.replace(/^\//, '') + '?specPath=' + path;
    }

    var $menu;
    $.ajax({
      dataType: 'json',
      url: 'tests.json',
      async: false,
      success: function (tests) {
        $menu = createMenu(tests).addClass('specs');
      }
    });


    $(function () {
      $menu.appendTo(document.body);

      $('.run-all').click(function () {
        window.location = window.location.pathname;
      });

      if (spec === '') {
        $('.header').css('background', '#51b20a');
      }

      var index = 0;
      var specs = [];
      $('.script').each(function () {
        var $this = $(this);
        $.globalEval = function () { };
        $.ajax({
          async: false,
          url: $this.attr('src'),
          success: function (code) {
            var regEx = /describe\('[^']+/g;
            var fullRegEx = /describe\('[^,]+/g;
            var match = regEx.exec(code);
            var fullMatch = fullRegEx.exec(code);
            var count = 0;
            while (match) {
              count++;
              specs.push({
                isFull: fullMatch[0].substring(0, fullMatch[0].length - 1) === match[0],
                name: match[0].replace('describe(\'', ''),
                index: index
              });
              match = regEx.exec(code);
              fullMatch = fullRegEx.exec(code);
            }
            index++;
          }
        });
      });
    });
  };

})(blocks);


; (function (blocks) {
  var jasmine = blocks.jasmine = {};
  var modules = blocks.jasmine.modules = {};

  // blocks.jasmine extensions

  blocks.extend(window, {
    defineModule: function (name, values) {
      modules[name] = blocks.toArray(values);
    },

    testModule: function (moduleNames, callback) {
      var args = [];
      moduleNames = blocks.toArray(moduleNames);
      blocks.each(moduleNames, function (moduleName) {
        args.push(modules[moduleName]);
      });
      blocks.each(cartesianProduct.apply(null, args), function (args) {
        callback.apply(this, args);
      });
    }
  });

  var expressionsDoesNotExist = {};

  function expressionTest(nameAddition, options, callback) {
    var expressionValue = blocks.clone(options.value);
    var expressionArgs = blocks.toArray(blocks.clone(options.args));
    var expectedResult = options.result;
    var hasExpectedResult = blocks.has(options, 'result');
    var testCallback = options.callback;

    var value;
    var result;

    it(options.testName + ' (' + nameAddition + ')', function () {
      result = callback(expressionValue, expressionArgs);
      if (result) {
        if (blocks.core.isExpression(result)) {
          if (blocks.isBoolean(expectedResult)) {
            result = result.result();
          } else {
            result = result.value();
          }
        } else if (blocks.isObservable && blocks.isObservable(result)) {
          result = result();
        } else if (blocks.isObservable && blocks.isObservable(result.data)) {
          result = result.data();
        }
        if (hasExpectedResult) {
          expect(result).toEqual(expectedResult);
        }
      }
      if (testCallback) {
        testCallback(result);
      }
    });
  }

  function call(obj, methodName) {
    var method = obj[methodName];
    var result;
    var args;
    if (arguments.length > 3) {
      args = [arguments[2]].concat(arguments[3]);
    } else {
      args = arguments[2];
    }

    switch (args.length) {
      case 0:
        result = method.call(obj);
        break;
      case 1:
        result = method.call(obj, args[0]);
        break;
      case 2:
        result = method.call(obj, args[0], args[1]);
        break;
      case 3:
        result = method.call(obj, args[0], args[1], args[2]);
        break;
      case 4:
        result = method.call(obj, args[0], args[1], args[2], args[3]);
        break;
      case 5:
        result = method.call(obj, args[0], args[1], args[2], args[3], args[4]);
        break;
      case 6:
        result = method.call(obj, args[0], args[1], args[2], args[3], args[4], args[5]);
        break;
      default:
        result = method.apply(obj, args);
        break;
    }
    return result;
  }

  window.expressionIt = function (name, options) {
    var expressionName = options.name;
    var expressionValue = options.value;
    var expressionArgs = blocks.has(options, 'args') ? blocks.toArray(options.args) : [];
    var expectedResult = options.result;
    var hasExpectedResult = blocks.has(options, 'result');
    var callback = options.callback || blocks.noop;
    var result;

    var value;
    var args;

    options.testName = name;
    expressionTest('singleExpression', options, function (value, args) {
      //debugger;
      return call(blocks, expressionName, value, args);
    });

    if (expressionsDoesNotExist[expressionName]) {
      return;
    }

    if (!blocks(expressionValue)[expressionName]) {
      expressionsDoesNotExist[expressionName] = true;
      it(expressionName + ' does not exist', function () {
        throw new Error(expressionName + ' does not exist as chain method on the blocks object');
      });
      return;
    }

    expressionTest('chainExpression', options, function (value, args) {
      //debugger;
      return call(blocks(value), expressionName, args);
    });

    if (!blocks.isFunction(expressionValue) && blocks.observable && blocks.observable(expressionValue).extend()[expressionName]) {
      expressionTest('observable', options, function (value, args) {
        //debugger;
        var observable = blocks.observable(value).extend();
        var result = call(observable, expressionName, args);
        if (result === undefined && expectedResult !== undefined) {
          throw new Error('blocks.observable() method returned undefined');
        }
        return result;
      });
    }

    if (blocks.DataSource && (new blocks.DataSource())[expressionName]) {
      expressionTest('DataSource', options, function (value, args) {
        //debugger;
        var dataSource = new blocks.DataSource({
          data: value
        });
        return call(dataSource, expressionName, args);
      });
    }

    // pass arguments as wrapped expressions
    // pass arguments as wrapped observables

    //return;

    if (blocks.isBoolean(expectedResult) &&
      (blocks.isArray(expressionValue) || blocks.isObject(expressionValue))) {

      // if size is 0
      var size = blocks.size(expressionValue);
      var nonExistentTestValue = {};
      var testValue;
      if (size == 1) {
        if (blocks.isString(expressionValue)) {
          testValue = expressionValue.charAt(0);
        } else {
          testValue = blocks.first(expressionValue);
        }
      } else if (size > 1) {
        if (blocks.isString(expressionValue)) {
          testValue = expressionValue.charAt(1);
        } else {
          testValue = blocks.first(expressionValue, 2)[1];
        }

      }

      it(name + ' (not().' + expressionName + '())', function () {
        //debugger;
        var value = blocks(expressionValue).not()[expressionName](expressionArgs[0], expressionArgs[1], expressionArgs[2], expressionArgs[3]);
        expect(value.result()).toBe(!expectedResult);
      });

      if (!blocks(expressionValue).contains) {
        return;
      }

      if (size == 0) {

      } else {
        if (expectedResult === true) {
          // contains().and().current() - returns true
          it(name + ' (contains_().and().' + expressionName + '() - returns true)', function () {
            ////debugger;
            var value = blocks(expressionValue);
            value = value.contains(testValue);
            var result = value.and()[expressionName](expressionArgs[0], expressionArgs[1], expressionArgs[2], expressionArgs[3]).result();
            expect(result).toBe(true);
          });

          // current().and().contains() - returns true
          it(name + ' (' + expressionName + '().and().contains_() - returns true)', function () {
            //debugger;
            var value = blocks(expressionValue)[expressionName](expressionArgs[0], expressionArgs[1], expressionArgs[2], expressionArgs[3]).and();
            value = value.contains(testValue);
            expect(value.result()).toBe(true);
          });
        }

        // contains().and().current() - returns false
        it(name + ' (contains_().and().' + expressionName + '() - returns false)', function () {
          ////debugger;
          var value = blocks(expressionValue);
          if (expectedResult === true) {
            value = value.contains(nonExistentTestValue);
          } else {
            value = value.contains(testValue);
          }
          var result = value.and()[expressionName](expressionArgs[0], expressionArgs[1], expressionArgs[2], expressionArgs[3]).result();
          expect(result).toBe(false);
        });

        // current().and().contains() - returns false
        it(name + ' (' + expressionName + '().and().contains_() - returns false)', function () {
          var value = blocks(expressionValue)[expressionName](expressionArgs[0], expressionArgs[1], expressionArgs[2], expressionArgs[3]).and();
          if (expectedResult === true) {
            value = value.contains(nonExistentTestValue);
          } else {
            value = value.contains(testValue);
          }
          expect(value.result()).toBe(false);
        });

        // TODO: Could be merged with expectedResult === false. ITS THE SAME.
        if (expectedResult === true) {
          // contains().or().current() - returns true
          it(name + ' (contains_().or().' + expressionName + '() - returns true)', function () {
            var value = blocks(expressionValue);
            if (expectedResult === true) {
              value = value.contains(nonExistentTestValue);
            } else {
              value = value.contains(testValue);
            }
            value = value.or()[expressionName](expressionArgs[0], expressionArgs[1], expressionArgs[2], expressionArgs[3]);
            expect(value.result()).toBe(true);
          });

          // current().or().contains() - returns true
          it(name + ' (' + expressionName + '().or().contains_() - returns true)', function () {
            var value = blocks(expressionValue)[expressionName](expressionArgs[0], expressionArgs[1], expressionArgs[2], expressionArgs[3]).or();
            if (expectedResult === true) {
              value = value.contains(nonExistentTestValue);
            } else {
              value = value.contains(testValue);
            }
            expect(value.result()).toBe(true);
          });
        }

        if (expectedResult === false) {
          // contains().or().current() - returns false
          it(name + ' (contains_().or().' + expressionName + '() - returns false)', function () {
            var value = blocks(expressionValue);
            value = value.contains(nonExistentTestValue);
            var result = value.or()[expressionName](expressionArgs[0], expressionArgs[1], expressionArgs[2], expressionArgs[3]).result();
            expect(result).toBe(false);
          });

          // current().or().contains() - returns false
          it(name + ' (' + expressionName + '().or().contains_() - returns false)', function () {
            //debugger;
            var value = blocks(expressionValue)[expressionName](expressionArgs[0], expressionArgs[1], expressionArgs[2], expressionArgs[3]).or();
            value = value.contains(nonExistentTestValue);
            expect(value.result()).toBe(false);
          });
        }

        // contains().and().not().current()
        it(name + ' (contains_().and().not()' + expressionName + '())', function () {
          //debugger;
          var value = blocks(expressionValue);
          value = value.contains(testValue);
          value = value.and().not()[expressionName](expressionArgs[0], expressionArgs[1], expressionArgs[2], expressionArgs[3]);
          expect(value.result()).toBe(!expectedResult);
        });

        // not().contains().and().current()
        it(name + '(not.contains_().and().' + expressionName + '())', function () {
          ////debugger;
          var value = blocks(expressionValue);
          if (expectedResult == true) {
            value = value.not().contains(testValue);
          } else {
            value = value.not().contains(nonExistentTestValue);
          }

          value = value.and().not()[expressionName](expressionArgs[0], expressionArgs[1], expressionArgs[2], expressionArgs[3]);
          expect(value.result()).toBe(!expectedResult);
        });

        // not().current().and().not().contains()
        it(name + ' (not().' + expressionName + '().and().not().contains_())', function () {
          var value = blocks(expressionValue).not()[expressionName](expressionArgs[0], expressionArgs[1], expressionArgs[2], expressionArgs[3]).and();
          value = value.not().contains(nonExistentTestValue);
          expect(value.result()).toBe(!expectedResult);
        });

        // contains().or().not().current()
        it(name + ' (contains_().or().not()' + expressionName + '())', function () {
          var value = blocks(expressionValue);
          value = value.contains(nonExistentTestValue);
          value = value.or().not()[expressionName](expressionArgs[0], expressionArgs[1], expressionArgs[2], expressionArgs[3]);
          expect(value.result()).toBe(!expectedResult);
        });

        // not().contains().or().current()
        it(name + '(not.contains_().or().' + expressionName + '())', function () {
          ////debugger;
          var value = blocks(expressionValue);
          value = value.not().contains(testValue);

          value = value.or().not()[expressionName](expressionArgs[0], expressionArgs[1], expressionArgs[2], expressionArgs[3]);
          expect(value.result()).toBe(!expectedResult);
        });

        // not().current().or().not().contains()
        it(name + ' (not().' + expressionName + '().or().not().contains_())', function () {
          var value = blocks(expressionValue).not()[expressionName](expressionArgs[0], expressionArgs[1], expressionArgs[2], expressionArgs[3]).or();
          value = value.not().contains(testValue);
          expect(value.result()).toBe(!expectedResult);
        });
      }
    }
  };

  defineModule('blocks.queries.methodName', ['preprocess', 'update']);

  function cartesianProduct(paramArray) {

    function addTo(curr, args) {

      var i, copy;
      var rest = args.slice(1);
      var last = !rest.length;
      var result = [];

      for (i = 0; i < args[0].length; i++) {

        copy = curr.slice();
        copy.push(args[0][i]);

        if (last) {
          result.push(copy);

        } else {
          result = result.concat(addTo(copy, rest));
        }
      }

      return result;
    }


    return addTo([], Array.prototype.slice.call(arguments));
  }

  //describe('window global objects count', function () {
  //  it('shouldnt have any new global properties created', function () {
  //    $.ajax({
  //      url: '../dist/blocks.js',
  //      async: false,
  //      complete: function (code) {
  //        var iframe = document.createElement('iframe');
  //        var iframeDocument;
  //        //iframe.innerHTML = '<html><body>asd</body></html>';
  //        document.body.appendChild(iframe);
  //
  //
  //        if (iframe.contentDocument) { // DOM
  //          iframeDocument = iframe.contentDocument;
  //        }
  //        else if (iframe.contentWindow) { // IE win
  //          iframeDocument = iframe.contentWindow.document;
  //        }
  //        iframeDocument.write('<head></head><body></body>');
  //
  //        var countGlobalObjectsScriptBefore = document.createElement('script');
  //        countGlobalObjectsScriptBefore.text = '' +
  //        'var objectsCount = { before: 0, beforeKeys: {}, newKeys: {}, after: 0 };' +
  //        'for (var key in window) { objectsCount.beforeKeys[key] = true; objectsCount.before++; }';
  //        iframeDocument.body.appendChild(countGlobalObjectsScriptBefore);
  //
  //        var blocksScript = document.createElement('script');
  //        blocksScript.text = code.responseText;
  //        iframeDocument.body.appendChild(blocksScript);
  //
  //        var countGlobalObjectsScriptAfter = document.createElement('script');
  //        countGlobalObjectsScriptAfter.text = '' +
  //        'for (var key in window) { if (!objectsCount.beforeKeys[key] && key != "blocks") { objectsCount.newKeys[key] = true; } objectsCount.after++; }';
  //        iframeDocument.body.appendChild(countGlobalObjectsScriptAfter);
  //
  //        expect(iframe.contentWindow.objectsCount.newKeys).toEqual({});
  //
  //        document.body.removeChild(iframe);
  //      }
  //    });
  //  });
  //});

})(blocks);