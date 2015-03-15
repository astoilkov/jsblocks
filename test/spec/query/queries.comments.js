; (function () {
  testModule('blocks.queries.methodName', function (methodName) {
    function isPreprocess() {
      return methodName === 'preprocess';
    }

    function initializeFixtures(query, text) {
      query = query || '';
      var $fixture = $('<div>', {
        id: 'sandbox'
      });
      var fixture = $fixture[0];
      fixture.appendChild(document.createComment('blocks ' + query));
      if (text) {
        fixture.appendChild(document.createTextNode(text));
      }
      fixture.appendChild(document.createComment('/blocks'));

      setFixtures($fixture);
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

    function expectResult(value) {
      expect($('#sandbox')[0].childNodes[1].nodeValue).toBe(value);
    }

    describe('blocks.queries.define works on comments', function () {

    });

    describe('blocks.queries.with works on comments', function () {

    });

    describe('blocks.queries.render (comments)', function () {

    });

    describe('blocks.queries.if (comments)', function () {

    });

    describe('blocks.queries.ifnot (comments)', function () {

    });

    describe('blocks.quries.visible (comments)', function () {

    });
  });
})();