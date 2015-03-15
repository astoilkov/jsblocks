define(function () {
  var Observer = (function () {
    var stack = [];

    return {
      startObserving: function () {
        stack.push([]);
      },

      stopObserving: function () {
        return stack.pop();
      },

      currentObservables: function () {
        return stack[stack.length - 1];
      },

      registerObservable: function (newObservable) {
        var observables = stack[stack.length - 1];
        var alreadyExists = false;

        if (observables) {
          blocks.each(observables, function (observable) {
            if (observable === newObservable) {
              alreadyExists = true;
              return false;
            }
          });
          if (!alreadyExists) {
            observables.push(newObservable);
          }
        }
      }
    };
  })();

  return Observer;
});
