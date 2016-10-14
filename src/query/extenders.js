
define([
  '../core',
  './ExtenderHelper'
], function (blocks, ExtenderHelper) {

  /**
   * @memberof blocks.observable
   * @class extenders
   */

  /**
   * Extends the observable by adding a .view property which is filtered
   * based on the provided options
   *
   * @memberof extenders
   * @param {(Function|Object|String)} options - provide a callback function
   * which returns true or false, you could also provide an observable
   * @returns {blocks.observable} - Returns a new observable
   * containing a .view property with the filtered data
   */
  blocks.observable.filter = function (options) {
    var observable = ExtenderHelper.initExpressionExtender(this);
    var callback = options;

    if (!blocks.isFunction(callback) || blocks.isObservable(callback)) {
      callback = function (value) {
        var filter = blocks.unwrap(options);
        var filterString = String(filter).toLowerCase();
        value = String(blocks.unwrap(value)).toLowerCase();

        return !filter || value.indexOf(filterString) != -1;
      };
    }

    observable._operations.push({
      type: ExtenderHelper.operations.FILTER,
      filter: callback
    });

    return observable;
  };

  blocks.observable.step = function (options) {
    var observable = ExtenderHelper.initExpressionExtender(this);

    observable._operations.push({
      type: ExtenderHelper.operations.STEP,
      step: options
    });

    return observable;
  };

  /**
   * Extends the observable by adding a .view property in which the first n
   * items are skipped
   *
   * @memberof extenders
   * @param {(number|blocks.observable|Function)} value - The number of items to be skipped
   * @returns {blocks.observable} - Returns a new observable
   * containing a .view property with the manipulated data
   */
  blocks.observable.skip = function (value) {
    var observable = ExtenderHelper.initExpressionExtender(this);

    observable._operations.push({
      type: ExtenderHelper.operations.SKIP,
      skip: value
    });

    return observable;
  };

  /**
   * Extends the observable by adding a .view property in which there is
   * always maximum n items
   *
   * @memberof extenders
   * @param {(number|blocks.observable|Function)} value - The max number of items to be in the collection
   * @returns {blocks.observable} - Returns a new observable
   * containing a .view property with the manipulated data
   */
  blocks.observable.take = function (value) {
    var observable = ExtenderHelper.initExpressionExtender(this);

    observable._operations.push({
      type: ExtenderHelper.operations.TAKE,
      take: value
    });

    return observable;
  };

  /**
   * Extends the observable by adding a .view property which is sorted
   * based on the provided options
   *
   * @memberof extenders
   * @param {(Function|string)} options - provide a callback sort function or field name to be sorted
   * @returns {blocks.observable} - Returns a new observable
   * containing a .view property with the sorted data
   */
  blocks.observable.sort = function (options) {
    var observable = ExtenderHelper.initExpressionExtender(this);

    observable._operations.push({
      type: ExtenderHelper.operations.SORT,
      sort: options
    });

    return observable;
  };
});
