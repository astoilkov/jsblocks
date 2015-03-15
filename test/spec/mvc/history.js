(function () {
  var testing = blocks.testing;

  function getCurrentUrl() {
    return window.location.href.substring(window.location.host.length);
  }

  describe('History', function () {
    var navigateChangesCount = 0;

    function getHistory(options) {
      var Application = blocks.Application({
        options: options
      });

      testing.overrideApplicationStart(Application);
      Application.start();
      var history = Application._history;
      blocks.core.deleteApplication();
      //testing.restoreApplicationStart(Application);

      $('#testElement').append($('<a>', { id: 'link' }));

      var navigate = history.navigate;
      history.navigate = function (fragment, options) {
        navigate.call(this, fragment, options);
        if (this._use == 'pushState' && (!options || !options.replace)) {
          navigateChangesCount++;
        }
      };

      history.dispose = function () {
        history._onUrlChanged = function () {
        };
      };

      return history;
    }

    function changeHash(url) {
      if (url.charAt(0) != '#') {
        url = '#' + url;
      }
      $('#link').attr('href', url)[0].click();
      navigateChangesCount++;
    }

    beforeEach(function () {
      navigateChangesCount = 0;
    });

    afterEach(function () {
      if (navigateChangesCount) {
        window.history.go(-navigateChangesCount);
      }
    });


    //describe('[hash]', function () {
    //    describe('navigate', function () {

    //    });

    //    describe('urlChange', function () {
    //        it('is event called', function () {
    //            var called = false;
    //            var history = getHistory();
    //            history.on('urlChange', function () {
    //                called = true;
    //            });

    //            changeHash('#newUrl');

    //            waits(100);

    //            runs(function () {
    //                expect(called).toBe(true);
    //                history.dispose();
    //            });
    //        });
    //    });
    //});

    //describe('[pushState]', function () {

    //    describe('navigate', function () {

    //    });

    //    describe('urlChange', function () {
    //        it('is called', function () {
    //            var history = getHistory({
    //                history: 'pushState'
    //            });
    //            var called = false;
    //            history.on('urlChange', function () {
    //                called = true;
    //            });
    //            history.navigate('/newUrl');

    //            waits(100);

    //            runs(function () {
    //                expect(called).toBe(true);
    //                history.dispose();
    //            });
    //        });
    //    });
    //});
  });
})();
