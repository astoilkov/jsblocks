define([
	'../core'
], function (blocks) {
	function bindContext (context, object) {
		var key;
		var value;
		
		if (!object) {
			object = context;
		}

		for (key in object) {
			value = object[key];

			if (blocks.isObservable(value)) {
				context[key].__context__ = context;
			} else if (blocks.isFunction(value)) {
				context[key] = blocks.bind(value, context);
			}

		}
	}
	return bindContext;
});