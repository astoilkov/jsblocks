define([
  '../../core'
], function (blocks) {
  /**
   * @typedef {Object} blocks.query
   * @property {boolean} [prioritize] - If set the query will be executed before all other queries on the element, except other prioritized quieries.
   * @property {boolean} [passRawValues] - If set observables will not be unwraped.
   * @property {boolean} [passDomQuery] - If set the current DomQuery will be passed as the first argument. Usefull to execute other queries on the element. See blocks.queries.if for an example.
   * @property {boolean} [supportsComments] - Specifies if the domQuery can be executed on comment nodes.
   * @property {Object.<number, boolean>} [passRaw] - Specifies if an argument should be evaluated to it's value or passed as the string. The key is the index of the argument.
   * @property {Function} [preprocess] - This function will be executed when the element is rendered the first time. The context ``this`` wil be the VirtualElement that get's rendered.
   * @property {Function} [ready] - This function will be executed on the dom element when the element got rendered. The context ``this`` will be corresponding the dom node.
   * @property {Function} [update] - This function will be executed on the dom element each time an observable passed as an argument changed. The context will be the corresponding dom node.
   */
  /**
   * @type {Object<string, blocks.query>}
   */
  return (blocks.queries = {});
});