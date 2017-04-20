define([
], function () {
	var serverData = {hasData: false};
	blocks.domReady(function () {
		if (global.document && global.document.body) {
			var data = document.body.getAttribute('data-blocks-server-data');
			if (data) {
				document.body.removeAttribute('data-blocks-server-data');
				/* global JSON */
				serverData.data = JSON.parse(data.replace('&quot;', '"'));
				serverData.hasData = true;
			}
		}
	});
	return serverData;
});