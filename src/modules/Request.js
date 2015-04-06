define([
  '../core',
  '../modules/uniqueId'
], function (blocks, uniqueId) {
  function Request(options) {
    this.options = blocks.extend({}, Request.Defaults, options);
    this.execute();
  }

  Request.Execute = function (options) {
    return new Request(options);
  };

  Request.Defaults = {
    type: 'GET',
    url: '',
    processData: true,
    async: true,
    contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
    jsonp: 'callback',
    jsonpCallback: function () {
      return uniqueId();
    }

  /*
  timeout: 0,
  data: null,
  dataType: null,
  username: null,
  password: null,
  cache: null,
  throws: false,
  traditional: false,
  headers: {},
  */
  };

  Request.Accepts = {
    '*': '*/'.concat('*'),
    text: 'text/plain',
    html: 'text/html',
    xml: 'application/xml, text/xml',
    json: 'application/json, text/javascript'
  };

  Request.Meta = {
    statusFix: {
      // file protocol always yields status code 0, assume 200
      0: 200,
      // Support: IE9
      // IE sometimes returns 1223 instead of 204
      1223: 204
    }
  };

  Request.prototype = {
    execute: function () {
      var options = this.options;

      if (options.type == 'GET' && options.data) {
        this.appendDataToUrl(options.data);
      }

      try {
        if (options.dataType == 'jsonp') {
          this.scriptRequest();
        } else {
          this.xhrRequest();
        }
      } catch (e) {

      }
    },

    xhrRequest: function () {
      var options = this.options;
      var xhr = this.createXHR();

      xhr.onabort = blocks.bind(this.xhrError, this);
      xhr.ontimeout = blocks.bind(this.xhrError, this);
      xhr.onload = blocks.bind(this.xhrLoad, this);
      xhr.onerror = blocks.bind(this.xhrError, this);
      xhr.open(options.type.toUpperCase(), options.url, options.async, options.username, options.password);
      xhr.setRequestHeader('Content-Type', options.contentType);
      xhr.setRequestHeader('Accept', Request.Accepts[options.dataType || '*']);
      xhr.send(options.data || null);
    },

    createXHR: function () {
      var Type = XMLHttpRequest || window.ActiveXObject;
      try {
        return new Type('Microsoft.XMLHTTP');
      } catch (e) {

      }
    },

    xhrLoad: function (e) {
      var request = e.target;
      var status = Request.Meta.statusFix[request.status] || request.status;
      var isSuccess = status >= 200 && status < 300 || status === 304;
      if (isSuccess) {
        this.callSuccess(request.responseText);
      } else {
        this.callError(request.statusText);
      }
    },

    xhrError: function () {
      this.callError();
    },

    scriptRequest: function () {
      var that = this;
      var options = this.options;
      var script = document.createElement('script');
      var jsonpCallback = {};
      var callbackName = blocks.isFunction(options.jsonpCallback) ? options.jsonpCallback() : options.jsonpCallback;

      jsonpCallback[options.jsonp] = callbackName;
      this.appendDataToUrl(jsonpCallback);
      window[callbackName] = function (result) {
        window[callbackName] = null;
        that.scriptLoad(result);
      };

      script.onerror = this.scriptError;
      script.async = options.async;
      script.src = options.url;
      document.head.appendChild(script);
    },

    scriptLoad: function (data) {
      this.callSuccess(data);
    },

    scriptError: function () {
      this.callError();
    },

    appendDataToUrl: function (data) {
      var that = this;
      var options = this.options;
      var hasParameter = /\?/.test(options.url);

      if (blocks.isPlainObject(data)) {
        blocks.each(data, function (value, key) {
          options.url += that.append(hasParameter, key, value.toString());
        });
      } else if (blocks.isArray(data)) {
        blocks.each(data, function (index, value) {
          that.appendDataToUrl(value);
        });
      } else {
        options.url += that.append(hasParameter, data.toString(), '');
      }
    },

    append: function (hasParameter, key, value) {
      var result = hasParameter ? '&' : '?';
      result += key;
      if (value) {
        result += '=' + value;
      }
      return result;
    },

    callSuccess: function (data) {
      var success = this.options.success;
      var textStatus = 'success';
      if (success) {
        success(data, textStatus, null);
      }
      this.callComplete(textStatus);
    },

    callError: function (errorThrown) {
      var error = this.options.error;
      var textStatus = 'error';
      if (error) {
        error(null, textStatus, errorThrown);
      }
      this.callComplete(textStatus);
    },

    callComplete: function (textStatus) {
      var complete = this.options.complete;
      if (complete) {
        complete(null, textStatus);
      }
    }
  };
});
