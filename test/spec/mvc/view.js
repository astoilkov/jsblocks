(function () {
  var testing = blocks.testing;

  describe('blocks.Application.View: ', function () {
    var Application;
    var Product;
    var Products;

    beforeEach(function () {
      Application = blocks.Application();
      testing.overrideApplicationStart(Application);

      Product = Application.Model({
        FirstName: Application.Property(),
        LastName: Application.Property(),
        Age: Application.Property()
      });

      Products = Application.Collection(Product, {

      });
    });
    afterEach(function () {
      blocks.core.deleteApplication();
      //testing.restoreApplicationStart(Application);
    });

    it('is active by default', function () {
      Application.View('Products', {

      });

      $('#testElement').attr('data-query', 'text(Products.isActive)');

      Application.start();


      expect($('#testElement')).toHaveText('true');
    });

    it('correctly binds', function () {
      Application.View('Products', {
        init: function () {
          this.products = Products(testing.createStaticData());
        }
      });

      $('#testElement').append($('<ul>', {
        'data-query': 'each(Products.products)'
      }).append($('<li>', {
        'data-query': 'text(FirstName + City)'
      })));

      Application.start();

      var $ul = $('#testElement').children();
      expect($ul.children().length).toBe(2);
      expect($ul.children().eq(0)).toHaveText('AntonioBlagoevgrad');
      expect($ul.children().eq(1)).toHaveText('MihaelaSofia');
    });

    it('creating View with nothing inside does not throw error', function () {

    });

    describe('blocks.queries.view', function () {

    });
  });
})();
