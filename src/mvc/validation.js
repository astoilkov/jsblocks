define([
  '../core',
  '../modules/Events',
  '../query/observable',
  './validators'
], function (blocks, Events, observable, validators) {
  // TODO: asyncValidate
  blocks.observable.validation = function (options) {
    var _this = this;
    var maxErrors = options.maxErrors;
    var errorMessages = this.errorMessages = blocks.observable([]);
    var validatorsArray = this._validators = [];
    var key;
    var option;

    this.errorMessage = blocks.observable('');

    for (key in options) {
      option = options[key];
      if (validators[key]) {
        validatorsArray.push({
          option: option,
          validate: validators[key].validate,
          priority: validators[key].priority
        });
      } else if (key == 'validate' || key == 'asyncValidate') {
        validatorsArray.push({
          option: '',
          validate: blocks.bind(option.validate ? option.validate : option, this.__context__),
          priority: option.priority || Number.POSITIVE_INFINITY,
          isAsync: key == 'asyncValidate'
        });
      }
    }

    validatorsArray.sort(function (a, b) {
      return a.priority > b.priority ? 1 : -1;
    });

    this.valid = blocks.observable(true);

    this.validate = function () {
      var value = _this._getValue();
      var isValid = true;
      var errorsCount = 0;
      var i = 0;
      var validationOptions;
      var validator;
      var message;

      errorMessages.removeAll();
      for (; i < validatorsArray.length; i++) {
        if (errorsCount >= maxErrors) {
          break;
        }
        validator = validatorsArray[i];
        if (validator.isAsync) {
          validator.validate(value, function (result) {
            validationComplete(_this, options, !!result);
          });
          return true;
        } else {
          validationOptions = validator.option;
          option = validator.option;
          if (blocks.isPlainObject(validationOptions)) {
            option = validationOptions.value;
          }
          if (blocks.isFunction(option)) {
            option = option.call(_this.__context__);
          }
          message = validator.validate(value, options, option);
          if (blocks.isString(message)) {
            message = [message];
          }
          if (blocks.isArray(message) || !message) {
            errorMessages.addMany(
                blocks.isArray(message) ? message :
                validationOptions && validationOptions.message ? [validationOptions.message] :
                option && blocks.isString(option) ? [option] :
                []);
            isValid = false;
            errorsCount++;
          }
        }
      }

      validationComplete(this, options, isValid);
      this.valid(isValid);
      Events.trigger(this, 'validate');
      return isValid;
    };

    if (options.validateOnChange) {
      this.on('change', function () {
        this.validate();
      });
    }
    if (options.validateInitially) {
      this.validate();
    }
  };

  function validationComplete(observable, options, isValid) {
    var errorMessage = observable.errorMessage;
    var errorMessages = observable.errorMessages;

    if (isValid) {
      errorMessage('');
    } else {
      errorMessage(options.errorMessage || errorMessages()[0] || '');
    }

    observable.valid(isValid);
  }
});
