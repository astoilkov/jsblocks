(function () {
  'use strict';
  /*global describe, blocks, it, expect */

  var testing = blocks.testing;

  describe('blocks.DataSource (Configuration) ->', function () {
    it('baseUrl url is appended to read data operation url', function () {
      var dataSource = new blocks.DataSource({
        baseUrl: 'base/',
        read: {
          url: 'read'
        }
      });

      var isRequestCalled = false;
      testing.overrideAjax({
        'base/read': function () {
          isRequestCalled = true;
        }
      });

      dataSource.read();
      expect(isRequestCalled).toBe(true);

      testing.restoreAjax();
    });

    it('baseUrl url is appended to read data operation url (when fetching)', function () {
      var dataSource = new blocks.DataSource({
        baseUrl: 'base/',
        read: {
          url: 'read'
        }
      });

      var isRequestCalled = false;
      testing.overrideAjax({
        'base/read': function () {
          isRequestCalled = true;
        }
      });

      dataSource.read();
      expect(isRequestCalled).toBe(true);

      testing.restoreAjax();
    });

    it('baseUrl url is appended to create operation url', function () {
      var dataSource = new blocks.DataSource({
        autoSync: true,
        baseUrl: 'base/',
        create: {
          url: 'create'
        }
      });

      var isRequestCalled = false;
      testing.overrideAjax({
        'base/create': function () {
          isRequestCalled = true;
        }
      });

      dataSource.data.add({
        FirstName: 'Antonio'
      });
      expect(isRequestCalled).toBe(true);

      testing.restoreAjax();
    });

    it('baseUrl url is appended to destroy operation url', function () {
      var dataSource = new blocks.DataSource({
        baseUrl: 'base/',
        destroy: {
          url: 'destroy'
        }
      });

      var isRequestCalled = false;
      testing.overrideAjax({
        'base/destroy': function () {
          isRequestCalled = true;
        }
      });

      dataSource.data.add({
        Id: 1
      });
      dataSource.sync();
      dataSource.data.remove(dataSource.data()[0]);
      dataSource.sync();
      expect(isRequestCalled).toBe(true);

      testing.restoreAjax();
    });

    it('baseUrl url is appended to update operation url', function () {
      var dataSource = new blocks.DataSource({
        baseUrl: 'base/',
        update: {
          url: 'update'
        }
      });


      var isRequestCalled = false;
      testing.overrideAjax({
        'base/update': function () {
          isRequestCalled = true;
        }
      });

      dataSource.data.add({
        Id: 1
      });
      dataSource.update(1, {
        FirstName: 'FirstName'
      });
      dataSource.sync();
      expect(isRequestCalled).toBe(true);

      testing.restoreAjax();
    });

    it('data could be set from configuration', function () {
      var dataSource = new blocks.DataSource({
        data: testing.createStaticData()
      });
      expect(dataSource.data().length).toBe(2);
      expect(dataSource.data()[0].FirstName).toBe('Antonio');
    });
  });
})();