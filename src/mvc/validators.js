define([
  '../core'
], function (blocks) {
  var validators = {
    required: {
      priority: 9,
      validate: function (value, options) {
        if (value !== options.defaultValue &&
            value !== '' &&
            value !== false &&
            value !== undefined &&
            value !== null) {
          return true;
        }
      }
    },

    minlength: {
      priority: 19,
      validate: function (value, options, option) {
        if (value === undefined || value === null) {
          return false;
        }
        return value.length >= parseInt(option, 10);
      }
    },

    maxlength: {
      priority: 29,
      validate: function (value, options, option) {
        if (value === undefined || value === null) {
          return true;
        }
        return value.length <= parseInt(option, 10);
      }
    },

    min: {
      priority: 39,
      validate: function (value, options, option) {
        if (value === undefined || value === null) {
          return false;
        }
        return value >= option;
      }
    },

    max: {
      priority: 49,
      validate: function (value, options, option) {
        if (value === undefined || value === null) {
          return false;
        }
        return value <= option;
      }
    },

    email: {
      priority: 59,
      validate: function (value) {
        return /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i.test(value);
      }
    },

    url: {
      priority: 69,
      validate: function (value) {
        return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(value);
      }
    },

    date: {
      priority: 79,
      validate: function (value) {
        if (!value) {
          return false;
        }
        return !/Invalid|NaN/.test(new Date(value.toString()).toString());
      }
    },

    creditcard: {
      priority: 89,
      validate: function (value) {
        if (blocks.isString(value) && value.length === 0) {
          return false;
        }
        if (blocks.isNumber(value)) {
          value = value.toString();
        }
        // accept only spaces, digits and dashes
        if (/[^0-9 \-]+/.test(value)) {
          return false;
        }
        var nCheck = 0,
            nDigit = 0,
            bEven = false;

        value = value.replace(/\D/g, '');

        for (var n = value.length - 1; n >= 0; n--) {
          var cDigit = value.charAt(n);
          nDigit = parseInt(cDigit, 10);
          if (bEven) {
            if ((nDigit *= 2) > 9) {
              nDigit -= 9;
            }
          }
          nCheck += nDigit;
          bEven = !bEven;
        }

        return (nCheck % 10) === 0;
      }
    },

    regexp: {
      priority: 99,
      validate: function (value, options, option) {
        if (!blocks.isRegExp(option)) {
          return false;
        }
        if (value === undefined || value === null) {
          return false;
        }
        return option.test(value);
      }
    },

    number: {
      priority: 109,
      validate: function (value) {
        if (blocks.isNumber(value)) {
          return true;
        }
        if (blocks.isString(value) && value.length === 0) {
          return false;
        }
        return /^(-?|\+?)(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(value);
      }
    },

    digits: {
      priority: 119,
      validate: function (value) {
        return /^\d+$/.test(value);
      }
    },

    letters: {
      priority: 129,
      validate: function (value) {
        if (!value) {
          return false;
        }
        return /^[a-zA-Z]+$/.test(value);
      }
    },

    equals: {
      priority: 139,
      validate: function (value, options, option) {
        return blocks.equals(value, blocks.unwrap(option));
      }
    }
  };

  return validators;
});
