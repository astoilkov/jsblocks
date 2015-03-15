(function () {
  'use strict';
  /*global describe, blocks, it, expect */

  var testing = blocks.testing;

  describe('blocks.DataSource (Configuration) ->', function () {
    it('pageSize is set from options successfully', function () {
      var dataSource = new blocks.DataSource({
        pageSize: 3
      });
      expect(dataSource.pageSize()).toBe(3);
    });

    it('default pageSize is Number.POSITIVE_INFINITY', function () {
      var dataSource = new blocks.DataSource();
      expect(dataSource.pageSize()).toBe(Number.POSITIVE_INFINITY);
    });

    it('page is set from options successfully', function () {
      var dataSource = new blocks.DataSource({
        page: 3
      });
      expect(dataSource.page()).toBe(3);
    });

    it('default page is 1', function () {
      var dataSource = new blocks.DataSource();
      expect(dataSource.page()).toBe(1);
    });

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

      dataSource.fetch();
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

      dataSource.add({
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

      dataSource.add({
        Id: 1
      });
      dataSource.sync();
      dataSource.remove(dataSource.data.first());
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

      dataSource.add({
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
      expect(dataSource.data.first().FirstName).toBe('Antonio');
    });

    it('sortExpressions are correctly set from options', function () {
      var sortExpressions = [{
        field: 'FirstName',
        dir: 'desc'
      }];
      var dataSource = new blocks.DataSource({
        sortExpressions: sortExpressions
      });
      expect(blocks.equals(dataSource.sortExpressions(), sortExpressions, true)).toBe(true);
    });

    it('sortExpressions are correctly set from options when providing single sortExpression', function () {
      var sortExpressions = {
        field: 'FirstName',
        dir: 'desc'
      };
      var dataSource = new blocks.DataSource({
        sortExpressions: sortExpressions
      });

      expect(blocks.equals(dataSource.sortExpressions()[0], sortExpressions, true)).toBe(true);
    });

    it('filterExpressions are correctly set from options', function () {
      var filterExpressions = [{
        logic: 'or',
        filters: [
            { field: 'category', operator: 'eq', value: 'asd' },
            {
              logic: 'and',
              filters: [

              ]
            }
        ]
      }];
      var dataSource = new blocks.DataSource({
        filterExpressions: filterExpressions
      });

      expect(blocks.equals(dataSource.filterExpressions(), filterExpressions, true)).toBe(true);
    });

    it('filterExpressions are correctly set from options when providing single filterExpression', function () {
      var filterExpression = { field: 'category', operator: 'eq', value: 'asd' };
      var dataSource = new blocks.DataSource({
        filterExpressions: filterExpression
      });

      expect(dataSource.filterExpressions()[0].logic).toBe('and');
      expect(blocks.equals(dataSource.filterExpressions()[0].filters[0], filterExpression, true)).toBe(true);
    });

    it('groupExpressions are correctly set from options', function () {
      var groupExpressions = [
          { field: 'category', aggregate: 'sum', dir: 'desc' },
          { field: 'subcategory' }
      ];

      var dataSource = new blocks.DataSource({
        groupExpressions: groupExpressions
      });

      expect(blocks.equals(dataSource.groupExpressions(), groupExpressions, true)).toBe(true);
    });

    it('groupExpressions are correctly set from options when providing single groupExpression', function () {
      var groupExpression = { field: 'category', aggregate: 'sum', dir: 'desc' };
      var dataSource = new blocks.DataSource({
        groupExpressions: groupExpression
      });

      expect(blocks.equals(dataSource.groupExpressions()[0], groupExpression, true)).toBe(true);
    });

    it('aggregateExpressions are correctly set from options', function () {
      var aggregateExpressions = [
          { field: 'category', aggregate: 'sum' },
          { field: 'subcategory', aggregate: 'average' }
      ];
      var dataSource = new blocks.DataSource({
        aggregateExpressions: aggregateExpressions
      });

      expect(blocks.equals(dataSource.aggregateExpressions(), aggregateExpressions, true)).toBe(true);
    });

    it('aggregateExpressions are correctly set from options when providing single aggregateExpression', function () {
      var aggregateExpression = { field: 'category', aggregate: 'sum' };
      var dataSource = new blocks.DataSource({
        aggregateExpressions: aggregateExpression
      });

      expect(blocks.equals(dataSource.aggregateExpressions()[0], aggregateExpression, true)).toBe(true);
    });
  });
})();