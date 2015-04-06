define([
  '../core',
  '../query/VirtualElement'
], function (blocks, VirtualElement) {
  function getElementsById(elements, result) {
    result = result || {};

    blocks.each(elements, function (child) {
      if (VirtualElement.Is(child)) {
        if (child.attr('id')) {
          result[child.attr('id')] = child;
        }
        getElementsById(child.children(), result);
      }
    });

    return result;
  }

  return getElementsById;
});