(function () {
  'use strict';
  /*global describe, blocks, it, expect */

  var testing = blocks.testing;

  describe('blocks.DataSource (Events) ->', function () {
    beforeEach(function () {
      testing.overrideAjax();
    });
    afterEach(function () {
      testing.restoreAjax();
    });

    describe('event sequance', function () {
      it('(requestStart, requestEnd, change)', function () {
        var dataSource = new blocks.DataSource();
        testing.trackEvents(dataSource, ['change', 'sync', 'error', 'requestStart', 'requestEnd']);
        dataSource.read();
        var events = testing.getTrackedEvents();
        expect(events.length).toBe(3);
        expect(events[0].name).toBe('requestStart');
        expect(events[1].name).toBe('requestEnd');
        expect(events[2].name).toBe('change');
      });

      it('(requestStart, requestEnd, sync)', function () {

      });

      it('(requestStart, requestEnd, error)', function () {

      });
    });

    describe('change', function () {
      it('is called after read() have retrieved the data', function () {
        var isChangeCalled = false;
        var dataSource = new blocks.DataSource({
          change: function () {
            isChangeCalled = true;
          }
        });
        expect(isChangeCalled).toBe(false);
        dataSource.read();
        expect(isChangeCalled).toBe(true);
      });

      it('is not called when there is an error', function () {
        var isChangeCalled = false;
        var dataSource = new blocks.DataSource({
          read: {
            url: testing.AjaxError
          }
        });
        dataSource.on('change', function () {
          isChangeCalled = true;
        });
        dataSource.read();
        expect(isChangeCalled).toBe(false);
      });

      it('is not called when the connection have timeouted', function (done) {
        var isChangeCalled = false;
        var dataSource = new blocks.DataSource({
          read: {
            url: testing.AjaxTimeout
          }
        });
        dataSource.change(function () {
          isChangeCalled = true;
        });
        dataSource.read();
        expect(isChangeCalled).toBe(false);

        setTimeout(function () {
          expect(isChangeCalled).toBe(false);
          done();
        }, 2);
      });

      it('is not called for create operations', function () {

      });

      it('is not called for update operations', function () {

      });

      it('is not called for destroy operations', function () {

      });

    });

    describe('sync', function () {
      it('is called after sync is completed (through "add" method)', function () {
        var isSyncCalled = false;
        var dataSource = new blocks.DataSource();
        dataSource.on('sync', function () {
          isSyncCalled = true;
        });
        dataSource.data.add({
          FirstName: 'Antonio'
        });
        expect(isSyncCalled).toBe(false);
        dataSource.sync();
        expect(isSyncCalled).toBe(true);
      });

      it('is called after sync is completed (through "remove" method)', function () {
        var isSyncCalled = false;
        var obj = {
          FirstName: 'Antonio'
        };
        var dataSource = new blocks.DataSource({
          data: [obj]
        });
        dataSource.on('sync', function () {
          isSyncCalled = true;
        });
        expect(isSyncCalled).toBe(false);
        dataSource.data.remove(obj);
        dataSource.sync();
        expect(isSyncCalled).toBe(true);
      });

      it('is called after sync is completed (through "update" method)', function () {
        var isSyncCalled = false;
        var obj = {
          Id: 1,
          FirstName: 'Antonio'
        };
        var dataSource = new blocks.DataSource({
          data: [obj],
          idAttr: 'Id',
          sync: function () {
            isSyncCalled = true;
          }
        });
        expect(isSyncCalled).toBe(false);
        obj.FirstName = 'Mihaela';
        dataSource.update(obj);
        dataSource.sync();
        expect(isSyncCalled).toBe(true);
      });

      it('is called only once when multiple edits have been made', function () {

      });
    });

    describe('error', function () {
      it('when ajax throws error the event is called', function () {
        var isErrorCalled = false;
        var dataSource = new blocks.DataSource({
          read: {
            url: testing.AjaxError
          }
        });
        dataSource.error(function () {
          isErrorCalled = true;
        });
        expect(isErrorCalled).toBe(false);
        dataSource.read();
        expect(isErrorCalled).toBe(true);
      });

      it('when ajax throws error the event is called (using options)', function () {
        var isErrorCalled = false;
        var dataSource = new blocks.DataSource({
          read: {
            url: testing.AjaxError
          },
          error: function () {
            isErrorCalled = true;
          }
        });
        expect(isErrorCalled).toBe(false);
        dataSource.read();
        expect(isErrorCalled).toBe(true);
      });

      it('when ajax throws error the event is called (using "on")', function () {
        var isErrorCalled = false;
        var dataSource = new blocks.DataSource({
          read: {
            url: testing.AjaxError
          }
        });
        dataSource.on('error', function () {
          isErrorCalled = true;
        });
        expect(isErrorCalled).toBe(false);
        dataSource.read();
        expect(isErrorCalled).toBe(true);
      });

      it('when the timeout elapses the error event is called', function (done) {
        var isErrorCalled = false;
        var dataSource = new blocks.DataSource({
          read: {
            url: testing.AjaxTimeout
          }
        });
        dataSource.error(function () {
          isErrorCalled = true;
        });
        expect(isErrorCalled).toBe(false);
        dataSource.read();

        setTimeout(function () {
          expect(isErrorCalled).toBe(true);
          done();
        }, 2)
      });
    });

    describe('requestStart', function () {
      it('is called before an ajax request is made (through "read" method)', function () {
        var isRequestStartCalled = false;
        var dataSource = new blocks.DataSource({
          requestStart: function () {
            isRequestStartCalled = true;
          }
        });
        expect(isRequestStartCalled).toBe(false);
        dataSource.read();
        expect(isRequestStartCalled).toBe(true);
      });

      it('is called before an ajax request is made (through "add" method)', function () {
        var isRequestStartCalled = false;
        var dataSource = new blocks.DataSource();
        dataSource.on('requestStart', function () {
          isRequestStartCalled = true;
        });
        expect(isRequestStartCalled).toBe(false);
        dataSource.data.add({
          FirstName: 'Antonio'
        });
        dataSource.sync();
        expect(isRequestStartCalled).toBe(true);
      });

      it('is called before an ajax request is made (through "remove" method)', function () {
        var isRequestStartCalled = false;
        var obj = {
          FirstName: 'Antonio'
        };
        var dataSource = new blocks.DataSource({
          data: [obj]
        });
        dataSource.requestStart(function () {
          isRequestStartCalled = true;
        });
        expect(isRequestStartCalled).toBe(false);
        dataSource.data.remove(obj);
        dataSource.sync();
        expect(isRequestStartCalled).toBe(true);
      });

      it('is called before an ajax request is made (through "update" method)', function () {
        var isRequestStartCalled = false;
        var obj = {
          Id: 1,
          FirstName: 'Antonio'
        };
        var dataSource = new blocks.DataSource({
          data: [obj],
          idAttr: 'Id',
          requestStart: function () {
            isRequestStartCalled = true;
          }
        });
        expect(isRequestStartCalled).toBe(false);
        obj.FirstName = 'Mihaela';
        dataSource.update(obj);
        dataSource.sync();
        expect(isRequestStartCalled).toBe(true);
      });
    });

    describe('requestEnd', function () {
      it('is called before change event', function () {

      });

      it('is called before an ajax request is made (through "read" method)', function () {
        var isRequestEndCalled = false;
        var dataSource = new blocks.DataSource({
          requestEnd: function () {
            isRequestEndCalled = true;
          }
        });
        expect(isRequestEndCalled).toBe(false);
        dataSource.read();
        expect(isRequestEndCalled).toBe(true);
      });

      it('is called before an ajax request is made (through "add" method)', function () {
        var isRequestEndCalled = false;
        var dataSource = new blocks.DataSource();
        dataSource.on('requestEnd', function () {
          isRequestEndCalled = true;
        });
        expect(isRequestEndCalled).toBe(false);
        dataSource.data.add({
          FirstName: 'Antonio'
        });
        dataSource.sync();
        expect(isRequestEndCalled).toBe(true);
      });

      it('is called before an ajax request is made (through "remove" method)', function () {
        var isRequestEndCalled = false;
        var obj = {
          FirstName: 'Antonio'
        };
        var dataSource = new blocks.DataSource({
          data: [obj]
        });
        dataSource.requestEnd(function () {
          isRequestEndCalled = true;
        });
        expect(isRequestEndCalled).toBe(false);
        dataSource.data.remove(obj);
        dataSource.sync();
        expect(isRequestEndCalled).toBe(true);
      });

      it('is called before an ajax request is made (through "update" method)', function () {
        var isRequestEndCalled = false;
        var obj = {
          Id: 1,
          FirstName: 'Antonio'
        };
        var dataSource = new blocks.DataSource({
          data: [obj],
          idAttr: 'Id',
          requestEnd: function () {
            isRequestEndCalled = true;
          }
        });
        expect(isRequestEndCalled).toBe(false);
        obj.FirstName = 'Mihaela';
        dataSource.update(obj);
        dataSource.sync();
        expect(isRequestEndCalled).toBe(true);
      });
    });
  });
})();
