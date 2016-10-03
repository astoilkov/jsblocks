define([
], function () {
	var serverData = null;
	if (document && document.body) {
		var data = document.body.getAttribute('data-blocks-server-data');
		if (data) {
			document.body.removeAttribute('data-blocks-server-data');
			/* global JSON */
			serverData = JSON.parse(data.replace('&quot;', '"'));
		}
	}
	return serverData;
});