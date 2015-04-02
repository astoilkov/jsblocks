(function () {
  var testing = blocks.testing;

  describe('blocks.Application(Validation) =>', function () {
    var Application;
    beforeEach(function () {
      Application = blocks.Application();
      testing.overrideApplicationStart(Application);
    });
    afterEach(function () {
      blocks.core.deleteApplication();
      //testing.restoreApplicationStart(Application);
    });

    describe('observable.validation', function () {
      it('', function () {
        var observable = blocks.observable('').extend('validation', {});

      });

      describe('validate()', function () {

      });

      describe('valid()', function () {

      });
    });

    describe('valid =>', function () {
      it('default value is true', function () {
        var Product = Application.Model();
        Application.start();
        var model = Product({
          id: 0,
          FirstName: 'Antonio'
        });
        model.validate();
        expect(model.valid()).toBe(true);
      });

      it('is observable', function () {
        var Product = Application.Model();
        Application.start();
        var model = Product({
          id: 0,
          FirstName: 'Antonio'
        });
        model.validate();
        expect(blocks.isObservable(model.valid)).toBe(true);
      });

      it('valid() updates after validate() is called', function () {

      });
    });

    // TODO: Think whether it should be here or in model.js
    describe('Model.validate()', function () {

    });

    describe('Property.errorMessage', function () {
      it('errorMessage is empty string when property is valid', function () {
        var Product = Application.Model({
          FirstName: Application.Property({
            errorMessage: 'Validation failed.',
            required: true
          })
        });
        Application.start();
        var model = Product({
          FirstName: 0
        });
        model.validate();
        expect(model.FirstName.errorMessage()).toBe('');
      });

      it('errorMessage have correct value when property is not valid', function () {
        var Product = Application.Model({
          FirstName: Application.Property({
            errorMessage: 'Validation failed.',
            required: true
          })
        });
        Application.start();
        var model = Product();
        model.validate();
        expect(model.FirstName.errorMessage()).toBe('Validation failed.');
      });

      it('errorMessage equals the failed validator message when not explicitly set in options', function () {
        var Product = Application.Model({
          FirstName: Application.Property({
            required: 'The field is required.'
          })
        });
        Application.start();
        var model = Product();
        model.validate();
        expect(model.FirstName.errorMessage()).toBe('The field is required.');
      });

      it('errorMessage appends all error messages from all validators', function () {
        var Product = Application.Model({
          FirstName: Application.Property({
            required: 'The field is required.',
            maxErrors: 2,
            minlength: {
              value: 3,
              message: 'Should be bigger than 3 symbols.'
            }
          })
        });
        Application.start();
        var model = Product();
        model.validate();
        expect(model.FirstName.errorMessage()).toBe('The field is required.');
      });

      it('errorMessage is empty string when valid and not explicitly set', function () {
        var Product = Application.Model({
          FirstName: Application.Property({
            required: true
          })
        });
        Application.start();
        var model = Product({
          FirstName: 'Antonio'
        });
        model.validate();
        expect(model.FirstName.errorMessage()).toBe('');
      });
    });

    describe('Property.errorMessages', function () {
      it('length is zero when there are no errors', function () {
        var Product = Application.Model({
          FirstName: Application.Property({
            required: true
          })
        });
        Application.start();
        var model = Product({
          FirstName: 'Antonio'
        });
        model.validate();
        expect(model.FirstName.errorMessages().length).toBe(0);
      });

      it('only one error is populated when default maxErrors = 1 is left', function () {
        var Product = Application.Model({
          FirstName: Application.Property({
            required: 'The field is required.',
            minlength: {
              value: 3,
              message: 'Should be bigger than 3 symbols.'
            }
          })
        });
        Application.start();
        var model = Product();
        model.validate();
        expect(model.FirstName.errorMessages().length).toBe(1);
        expect(model.FirstName.errorMessages()[0]).toBe('The field is required.');
      });

      it('errors are properly populated in the array', function () {
        var Product = Application.Model({
          FirstName: Application.Property({
            required: 'The field is required.',
            maxErrors: 2,
            minlength: {
              value: 3,
              message: 'Should be bigger than 3 symbols.'
            }
          })
        });
        Application.start();
        var model = Product();
        model.validate();
        expect(model.FirstName.errorMessages().length).toBe(2);
        expect(model.FirstName.errorMessages()[0]).toBe('The field is required.');
        expect(model.FirstName.errorMessages()[1]).toBe('Should be bigger than 3 symbols.');
      });

      it('validate() returns false errors are zero', function () {
        var Product = Application.Model({
          FirstName: Application.Property({
            validate: function () {
              return false;
            }
          })
        });
        Application.start();
        var model = Product();
        model.validate();
        expect(model.FirstName.errorMessages().length).toBe(0);
      });

      it('validate() returns true errors are zero', function () {
        var Product = Application.Model({
          FirstName: Application.Property({
            validate: function () {
              return true;
            }
          })
        });
        Application.start();
        var model = Product();
        model.validate();
        expect(model.FirstName.errorMessages().length).toBe(0);
      });

      it('validate returns message error is populated in the array', function () {
        var Product = Application.Model({
          FirstName: Application.Property({
            validate: function () {
              return 'Error message';
            }
          })
        });
        Application.start();
        var model = Product();
        model.validate();
        expect(model.FirstName.errorMessages()[0]).toBe('Error message');
      });

      it('custom validate validator could return an array of error messages', function () {
        var Product = Application.Model({
          FirstName: Application.Property({
            validate: function () {
              return ['Error1', 'Error2'];
            }
          })
        });
        Application.start();
        var model = Product();
        model.validate();
        expect(model.FirstName.errorMessages().length).toBe(2);
        expect(model.FirstName.errorMessages()[0]).toBe('Error1');
        expect(model.FirstName.errorMessages()[1]).toBe('Error2');
      });

      // For example if you have required and email validatiotors turned on,
      // if the required validator fails then the required message should be first
      // because it is more logical to show the required message instead of the email message.
      it('errorMessages are strictly sorted by priority', function () {
        var Product = Application.Model({
          FirstName: Application.Property({
            required: 'required',

            minlength: {
              value: 3,
              message: 'minlength'
            },

            maxlength: {
              value: -1,
              message: 'maxlength'
            },

            min: {
              value: 3,
              message: 'min'
            },

            max: {
              value: -1,
              message: 'max'
            },

            email: 'email',

            url: 'url',

            date: 'date',

            creditcard: 'creditcard',

            regexp: {
              value: /Antonio/,
              message: 'regexp'
            },

            number: true,

            digits: true,

            letters: true,

            equals: 'Antonio'
          })
        });
        Application.start();
        var model = Product({
          FirstName: 'Antonio'
        });
        model.validate();

      });
    });

    describe('Model.validationErrors', function () {
      it('length is zero when there are no errors', function () {
        var Product = Application.Model({
          FirstName: Application.Property({
            required: true
          })
        });
        Application.start();
        var model = Product({
          FirstName: 'Antonio'
        });
        model.validate();
        expect(model.validationErrors().length).toBe(0);
      });

      it('errors are properly populated in the array', function () {
        var Product = Application.Model({
          FirstName: Application.Property({
            required: 'The field is required.',
            maxErrors: 3,
            minlength: {
              value: 3,
              message: 'Should be bigger than 3 symbols.'
            }
          })
        });
        Application.start();
        var model = Product();
        model.validate();
        expect(model.validationErrors().length).toBe(2);
        expect(model.validationErrors()[0]).toBe('The field is required.');
        expect(model.validationErrors()[1]).toBe('Should be bigger than 3 symbols.');
      });

      it('validate() returns false errors are zero', function () {
        var Product = Application.Model({
          FirstName: Application.Property({
            validate: function () {
              return false;
            }
          })
        });
        Application.start();
        var model = Product();
        model.validate();
        expect(model.validationErrors().length).toBe(0);
      });

      it('validate() returns true errors are zero', function () {
        var Product = Application.Model({
          FirstName: Application.Property({
            validate: function () {
              return true;
            }
          })
        });
        Application.start();
        var model = Product();
        model.validate();
        expect(model.validationErrors().length).toBe(0);
      });

      it('validate returns message error is populated in the array', function () {
        var Product = Application.Model({
          FirstName: Application.Property({
            validate: function () {
              return 'Error message';
            }
          })
        });
        Application.start();
        var model = Product();
        model.validate();
        expect(model.validationErrors()[0]).toBe('Error message');
      });

      it('errors are collected from all failed validation through properties', function () {
        var Product = Application.Model({
          FirstName: Application.Property({
            required: 'The First Name is required.'
          }),

          LastName: Application.Property({
            required: 'The Last Name is required.'
          })
        });
        Application.start();
        var model = Product();
        model.validate();
        expect(model.validationErrors()[0]).toBe('The First Name is required.');
        expect(model.validationErrors()[1]).toBe('The Last Name is required.');
      });
    });

    describe('Property.options.validateOnChange', function () {
      it('validates on change of a value', function () {
        var Product = Application.Model({
          FirstName: Application.Property({
            required: 'The First Name is required.',
            validateOnChange: true
          })
        });
        Application.start();
        var model = Product();
        expect(model.valid()).toBe(true);

        model.FirstName('');
        expect(model.valid()).toBe(false);
      });

      it('does not validate on change of a non observable value', function () {
        var Product = Application.Model({
          FirstName: Application.Property({
            required: 'The First Name is required.',
            validateOnChange: true,
            isObservable: false
          })
        });
        Application.start();
        var model = Product();
        expect(model.valid()).toBe(true);
        model.FirstName('');
        expect(model.valid()).toBe(true);
      });

      it('does not validate a non observable value after calling validate()', function () {
        var Product = Application.Model({
          FirstName: Application.Property({
            required: 'The First Name is required.',
            validateOnChange: true,
            isObservable: false
          })
        });
        Application.start();
        var model = Product();
        expect(model.valid()).toBe(true);
        model.FirstName('');
        model.validate();
        expect(model.valid()).toBe(true);
      });

      it('when false it does not validate on change', function () {
        var Product = Application.Model({
          FirstName: Application.Property({
            required: 'The First Name is required.',
            validateOnChange: false
          })
        });
        Application.start();
        var model = Product();
        expect(model.valid()).toBe(true);
        model.FirstName('');
        expect(model.valid()).toBe(true);
        model.validate();
        expect(model.valid()).toBe(false);
      });
    });

    describe('Property.options.maxErrors', function () {
      it('by default validates stops after first error', function () {
        var Product = Application.Model({
          Email: Application.Property({
            required: 'The e-mail is required.',
            email: 'The value should be a valid e-mail.',
            minlength: {
              value: 2,
              message: 'The value should have length bigger than 2.'
            },
            maxlength: {
              value: 50,
              message: 'The value should have length smaller than 50.'
            }
          })
        });
        Application.start();
        var model = Product();
        model.validate();
        expect(model.Email.errorMessages().length).toBe(1);
        expect(model.Email.errorMessages()[0]).toBe('The e-mail is required.');
      });

      it('when set to 0 there are no errorMessages', function () {
        var Product = Application.Model({
          Email: Application.Property({
            required: 'The e-mail is required.',
            email: 'The value should be a valid e-mail.',
            minlength: 2,
            maxlength: 50,
            maxErrors: 0
          })
        });
        Application.start();
        var model = Product();
        model.validate();
        expect(model.Email.errorMessages().length).toBe(0);
        expect(model.validationErrors().length).toBe(0);
      });

      it('when set to 2 there are 2 error messages', function () {
        var Product = Application.Model({
          Email: Application.Property({
            required: 'The e-mail is required.',
            email: 'The value should be a valid e-mail.',
            minlength: {
              value: 2,
              message: 'The value should have length bigger than 2.'
            },
            maxlength: {
              value: 50,
              message: 'The value should have length smaller than 50.'
            },
            maxErrors: 2
          })
        });
        Application.start();
        var model = Product();
        model.validate();
        expect(model.Email.errorMessages().length).toBe(2);
        expect(model.Email.errorMessages()[0]).toBe('The e-mail is required.');
        expect(model.Email.errorMessages()[1]).toBe('The value should have length bigger than 2.');
        expect(model.validationErrors().length).toBe(2);
      });

      it('when set to a bigger value than possible errors the errorMessages do not overflow', function () {
        var Product = Application.Model({
          Email: Application.Property({
            required: 'The e-mail is required.',
            email: 'The value should be a valid e-mail.',
            minlength: {
              value: 2,
              message: 'The value should have length bigger than 2.'
            },
            maxlength: {
              value: -3,
              message: 'The value should have length smaller than 50.'
            },
            maxErrors: 100
          })
        });
        Application.start();
        var model = Product();
        model.validate();
        expect(model.Email.errorMessages().length).toBe(3);
        expect(model.validationErrors().length).toBe(3);
      });
    });

    describe('Property.options.validateInitially', function () {
      it('by default it does not validates initially', function () {

      });

      it('when set to true it validates initially', function () {

      });
    });

    describe('validate() =>', function () {
      function testValidation(modelPrototype, dataItem, expectResult) {
        var Product = Application.Model(modelPrototype);
        Application.start();
        var model = Product(dataItem);
        expect(model.validate()).toBe(expectResult);
      }

      it('returns true when there are no validation options', function () {
        testValidation(undefined, {
          id: 0,
          FirstName: 'Antonio'
        }, true);
      });

      //it('returns true when no dataItem specified', function () {
      //    testValidation({
      //        FirstName: Application.Property({

      //        })
      //    }, undefined, true);
      //});

      it('does not validate a non observable value', function () {
        testValidation({
          FirstName: Application.Property({
            required: true,
            isObservable: false
          })
        }, undefined, true);
      });

      it('accepts functions as compare values (validates successfully)', function () {
        testValidation({
          FirstName: Application.Property({
            equals: function () {
              return 'Antonio';
            }
          })
        }, {
          FirstName: 'Antonio'
        }, true);
      });

      it('accepts functions as compare values (does not validate successfully)', function () {
        testValidation({
          FirstName: Application.Property({
            equals: function () {
              return 'Mihaela';
            }
          })
        }, {
          FirstName: 'Antonio'
        }, false);
      });

      describe('required* =>', function () {
        it('returns false when no dataItem specified', function () {
          testValidation({
            FirstName: Application.Property({
              required: true
            })
          }, undefined, false);
        });

        it('returns false when empty dataItem is specified', function () {
          testValidation({
            FirstName: Application.Property({
              required: true
            })
          }, {}, false);
        });

        it('returns false when undefined value passed', function () {
          testValidation({
            FirstName: Application.Property({
              required: true
            })
          }, {
            FirstName: undefined
          }, false);
        });

        it('returns false when null value passed', function () {
          testValidation({
            FirstName: Application.Property({
              required: true
            })
          }, {
            FirstName: null
          }, false);
        });

        it('returns true when 0(zero) value passed', function () {
          testValidation({
            FirstName: Application.Property({
              required: true
            })
          }, {
            FirstName: 0
          }, true);
        });

        it('returns false when empty string value passed', function () {
          testValidation({
            FirstName: Application.Property({
              required: true
            })
          }, {
            FirstName: ''
          }, false);
        });

        it('returns false when false value passed', function () {
          testValidation({
            FirstName: Application.Property({
              required: true
            })
          }, {
            FirstName: false
          }, false);
        });

        it('returns false when default value is passed', function () {
          testValidation({
            FirstName: Application.Property({
              required: true,
              defaultValue: 'Antonio'
            })
          }, {
            FirstName: 'Antonio'
          }, false);
        });
      });

      describe('email* =>', function () {
        it('returns false when undefined specified', function () {
          testValidation({
            FirstName: Application.Property({
              email: true
            })
          }, {
            FirstName: undefined
          }, false);
        });

        it('returns false when null specified', function () {
          testValidation({
            FirstName: Application.Property({
              email: true
            })
          }, {
            FirstName: null
          }, false);
        });

        it('returns false when empty string specified', function () {
          testValidation({
            FirstName: Application.Property({
              email: true
            })
          }, {
            FirstName: ''
          }, false);
        });

        it('1. returns false when invalid email is specified', function () {
          testValidation({
            FirstName: Application.Property({
              email: true
            })
          }, {
            FirstName: 'anti_sto@abv'
          }, false);
        });

        it('2. returns false when invalid email is specified', function () {
          testValidation({
            FirstName: Application.Property({
              email: true
            })
          }, {
            FirstName: 'anti_sto@.bg'
          }, false);
        });

        it('3. returns false when invalid email is specified', function () {
          testValidation({
            FirstName: Application.Property({
              email: true
            })
          }, {
            FirstName: '@gmail.com'
          }, false);
        });

        it('returns true when valid email is specified', function () {
          testValidation({
            FirstName: Application.Property({
              email: true
            })
          }, {
            FirstName: 'antonio.stoilkov@jsblocks.com'
          }, true);
        });
      });

      describe('url* =>', function () {
        it('returns false when undefined specified', function () {
          testValidation({
            FirstName: Application.Property({
              url: true
            })
          }, {
            FirstName: undefined
          }, false);
        });

        it('returns false when null specified', function () {
          testValidation({
            FirstName: Application.Property({
              url: true
            })
          }, {
            FirstName: null
          }, false);
        });

        it('returns false when empty string specified', function () {
          testValidation({
            FirstName: Application.Property({
              url: true
            })
          }, {
            FirstName: ''
          }, false);
        });

        it('returns false when invalid URL(email) specified', function () {
          testValidation({
            FirstName: Application.Property({
              url: true
            })
          }, {
            FirstName: 'mynameis@gmail.com'
          }, false);


        });

        it('returns false when only http is specified', function () {
          testValidation({
            FirstName: Application.Property({
              url: true
            })
          }, {
            FirstName: 'http://'
          }, false);
        });

        it('returns false when only http and www is specified', function () {
          testValidation({
            FirstName: Application.Property({
              url: true
            })
          }, {
            FirstName: 'http://www'
          }, false);
        });

        //it('returns false when only http, www and first level domain is specified', function () {
        //    testValidation({
        //        FirstName: Application.Property({
        //            url: true
        //        })
        //    }, {
        //        FirstName: 'http://www.google'
        //    }, false);
        //});

        it('returns false when only https is specified', function () {
          testValidation({
            FirstName: Application.Property({
              url: true
            })
          }, {
            FirstName: 'https://'
          }, false);
        });

        it('returns false when only https and www is specified', function () {
          testValidation({
            FirstName: Application.Property({
              url: true
            })
          }, {
            FirstName: 'https://www'
          }, false);
        });

        //it('returns false when only https, www and first level domain is specified', function () {
        //    testValidation({
        //        FirstName: Application.Property({
        //            url: true
        //        })
        //    }, {
        //        FirstName: 'https://www.google'
        //    }, false);
        //});

        it('returns true when valid URL wihout http and www specified', function () {
          testValidation({
            FirstName: Application.Property({
              url: true
            })
          }, {
            FirstName: 'abv.bg'
          }, true);
        });

        it('returns true when valid URL with http in front is specified', function () {
          testValidation({
            FirstName: Application.Property({
              url: true
            })
          }, {
            FirstName: 'http://www.google.com'
          }, true);
        });

        it('returns true when valid URL with http and wihout www is specified', function () {
          testValidation({
            FirstName: Application.Property({
              url: true
            })
          }, {
            FirstName: 'http://google.com'
          }, true);
        });

        it('returns true when valid URL with https in front is specified', function () {
          testValidation({
            FirstName: Application.Property({
              url: true
            })
          }, {
            FirstName: 'https://www.google.com'
          }, true);
        });

        it('returns true when valid URL with https and wihout www is specified', function () {
          testValidation({
            FirstName: Application.Property({
              url: true
            })
          }, {
            FirstName: 'https://google.com'
          }, true);
        });

        it('returns true when valid URL without http is specified', function () {
          testValidation({
            FirstName: Application.Property({
              url: true
            })
          }, {
            FirstName: 'www.abv.bg'
          }, true);
        });
      });

      describe('date* =>', function () {
        it('returns false when undefined specified', function () {
          testValidation({
            FirstName: Application.Property({
              date: true
            })
          }, {
            FirstName: undefined
          }, false);
        });

        it('returns false when null specified', function () {
          testValidation({
            FirstName: Application.Property({
              date: true
            })
          }, {
            FirstName: null
          }, false);
        });

        it('returns false when empty string specified', function () {
          testValidation({
            FirstName: Application.Property({
              date: true
            })
          }, {
            FirstName: ''
          }, false);
        });

        it('returns false when non date specified', function () {
          testValidation({
            FirstName: Application.Property({
              date: true
            })
          }, {
            FirstName: '12 13 abc'
          }, false);
        });

        it('returns true when date specified', function () {
          testValidation({
            FirstName: Application.Property({
              date: true
            })
          }, {
            FirstName: '12/13/14'
          }, true);
        });

        it('returns true when date (Tue Feb 25 2014 22:20:00) specified', function () {
          testValidation({
            FirstName: Application.Property({
              date: true
            })
          }, {
            FirstName: 'Tue Feb 25 2014 22:20:00'
          }, true);
        });
      });

      describe('number* =>', function () {
        it('returns false when undefined specified', function () {
          testValidation({
            FirstName: Application.Property({
              number: true
            })
          }, {
            FirstName: undefined
          }, false);
        });

        it('returns false when null specified', function () {
          testValidation({
            FirstName: Application.Property({
              number: true
            })
          }, {
            FirstName: null
          }, false);
        });

        it('returns false when empty string specified', function () {
          testValidation({
            FirstName: Application.Property({
              number: true
            })
          }, {
            FirstName: ''
          }, false);
        });

        it('returns false when letters specified', function () {
          testValidation({
            FirstName: Application.Property({
              number: true
            })
          }, {
            FirstName: 'asdb'
          }, false);
        });

        it('returns false when letters and numbers specified', function () {
          testValidation({
            FirstName: Application.Property({
              number: true
            })
          }, {
            FirstName: '3.14p'
          }, false);
        });

        it('returns true when number specified', function () {
          testValidation({
            FirstName: Application.Property({
              number: true
            })
          }, {
            FirstName: '3'
          }, true);
        });

        it('returns true when number with decimal point specified', function () {
          testValidation({
            FirstName: Application.Property({
              number: true
            })
          }, {
            FirstName: '3.14'
          }, true);
        });

        it('returns true when minus sign specified', function () {
          testValidation({
            FirstName: Application.Property({
              number: true
            })
          }, {
            FirstName: '-14'
          }, true);
        });

        it('returns true when plus sign specified', function () {
          testValidation({
            FirstName: Application.Property({
              number: true
            })
          }, {
            FirstName: '+14'
          }, true);
        });

        it('returns true when Number type specified', function () {
          testValidation({
            FirstName: Application.Property({
              number: true
            })
          }, {
            FirstName: 56.3
          }, true);
        });

        it('returns true when new Number() type specified', function () {
          testValidation({
            FirstName: Application.Property({
              number: true
            })
          }, {
            FirstName: new Number(4)
          }, true);
        });


      });

      describe('digits* =>', function () {
        it('returns false when undefined specified', function () {
          testValidation({
            FirstName: Application.Property({
              digits: true
            })
          }, {
            FirstName: undefined
          }, false);
        });

        it('returns false when null specified', function () {
          testValidation({
            FirstName: Application.Property({
              digits: true
            })
          }, {
            FirstName: null
          }, false);
        });

        it('returns false when empty string specified', function () {
          testValidation({
            FirstName: Application.Property({
              digits: true
            })
          }, {
            FirstName: ''
          }, false);
        });

        it('returns false when letters specified', function () {
          testValidation({
            FirstName: Application.Property({
              digits: true
            })
          }, {
            FirstName: 'asdb'
          }, false);
        });

        it('returns false when letters and numbers specified', function () {
          testValidation({
            FirstName: Application.Property({
              digits: true
            })
          }, {
            FirstName: '3.14p'
          }, false);
        });

        it('returns false when minus sign specified', function () {
          testValidation({
            FirstName: Application.Property({
              digits: true
            })
          }, {
            FirstName: '-14'
          }, false);
        });

        it('returns false when plus sign specified', function () {
          testValidation({
            FirstName: Application.Property({
              digits: true
            })
          }, {
            FirstName: '+14'
          }, false);
        });

        it('returns false when number with decimal point specified', function () {
          testValidation({
            FirstName: Application.Property({
              digits: true
            })
          }, {
            FirstName: '3.14'
          }, false);
        });

        it('returns false when Number with decimal points specified', function () {
          testValidation({
            FirstName: Application.Property({
              digits: true
            })
          }, {
            FirstName: 56.3
          }, false);
        });

        it('returns true when number specified', function () {
          testValidation({
            FirstName: Application.Property({
              digits: true
            })
          }, {
            FirstName: '3'
          }, true);
        });

        it('returns true when Number type specified', function () {
          testValidation({
            FirstName: Application.Property({
              digits: true
            })
          }, {
            FirstName: new Number(4)
          }, true);
        });
      });

      describe('letters* =>', function () {
        it('returns false when undefined specified', function () {
          testValidation({
            FirstName: Application.Property({
              letters: true
            })
          }, {
            FirstName: undefined
          }, false);
        });

        it('returns false when null specified', function () {
          testValidation({
            FirstName: Application.Property({
              letters: true
            })
          }, {
            FirstName: null
          }, false);
        });

        it('returns false when empty string specified', function () {
          testValidation({
            FirstName: Application.Property({
              letters: true
            })
          }, {
            FirstName: ''
          }, false);
        });

        it('returns false when numbers specified', function () {
          testValidation({
            FirstName: Application.Property({
              letters: true
            })
          }, {
            FirstName: '123'
          }, false);
        });

        it('returns false when numbers specified', function () {
          testValidation({
            FirstName: Application.Property({
              letters: true
            })
          }, {
            FirstName: '123'
          }, false);
        });

        it('returns false when numbers and letters specified', function () {
          testValidation({
            FirstName: Application.Property({
              letters: true
            })
          }, {
            FirstName: 'ab1c'
          }, false);
        });

        it('returns false when letters and a dot specified', function () {
          testValidation({
            FirstName: Application.Property({
              letters: true
            })
          }, {
            FirstName: 'ab.c'
          }, false);
        });

        it('returns true when letters specified', function () {
          testValidation({
            FirstName: Application.Property({
              letters: true
            })
          }, {
            FirstName: 'abc'
          }, true);
        });

        it('returns true when uppercase letter specified', function () {
          testValidation({
            FirstName: Application.Property({
              letters: true
            })
          }, {
            FirstName: 'A'
          }, true);
        });
      });

      describe('creditcard* =>', function () {
        it('returns false when undefined specified', function () {
          testValidation({
            FirstName: Application.Property({
              creditcard: true
            })
          }, {
            FirstName: undefined
          }, false);
        });

        it('returns false when null specified', function () {
          testValidation({
            FirstName: Application.Property({
              creditcard: true
            })
          }, {
            FirstName: null
          }, false);
        });

        it('returns false when empty string specified', function () {
          testValidation({
            FirstName: Application.Property({
              creditcard: true
            })
          }, {
            FirstName: ''
          }, false);
        });

        it('returns false when invalid creditcard number specified', function () {
          testValidation({
            FirstName: Application.Property({
              creditcard: true
            })
          }, {
            FirstName: '4111 1111 1111'
          }, false);
        });

        it('returns true when Visa creditcard specified', function () {
          testValidation({
            FirstName: Application.Property({
              creditcard: true
            })
          }, {
            FirstName: '4111 1111 1111 1111'
          }, true);
        });

        it('returns true when Visa creditcard(new String) specified', function () {
          testValidation({
            FirstName: Application.Property({
              creditcard: true
            })
          }, {
            FirstName: new String('4111 1111 1111 1111')
          }, true);
        });

        it('returns true when Visa creditcard as Number specified', function () {
          testValidation({
            FirstName: Application.Property({
              creditcard: true
            })
          }, {
            FirstName: new Number(4111111111111111)
          }, true);
        });

        it('returns true when MasterCard creditcard specified', function () {
          testValidation({
            FirstName: Application.Property({
              creditcard: true
            })
          }, {
            FirstName: '5500 0000 0000 0004'
          }, true);
        });

        it('returns true when American Express creditcard specified', function () {
          testValidation({
            FirstName: Application.Property({
              creditcard: true
            })
          }, {
            FirstName: '3400 0000 0000 009'
          }, true);
        });

        it('returns true when Diners Club creditcard specified', function () {
              testValidation({
        FirstName: Application.Property({
          creditcard: true
        })
      }, {
        FirstName: '3000 0000 0000 04'
      }, true);
    });

    it('returns true when Carte Blanche creditcard specified', function () {
      testValidation({
        FirstName: Application.Property({
          creditcard: true
        })
      }, {
        FirstName: '3000 0000 0000 04'
      }, true);
    });

    it('returns true when Discover creditcard specified', function () {
      testValidation({
        FirstName: Application.Property({
          creditcard: true
        })
      }, {
        FirstName: '6011 0000 0000 0004'
      }, true);
    });

    it('returns true when en Route creditcard specified', function () {
      testValidation({
        FirstName: Application.Property({
          creditcard: true
        })
      }, {
        FirstName: '2014 0000 0000 009'
      }, true);
    });

    it('returns true when JCB creditcard specified', function () {
      testValidation({
        FirstName: Application.Property({
          creditcard: true
        })
      }, {
        FirstName: '3088 0000 0000 0009'
      }, true);
    });
  });

  describe('min* =>', function () {
    it('returns false when undefined specified', function () {
      testValidation({
        FirstName: Application.Property({
          min: 0
        })
      }, {
        FirstName: undefined
      }, false);
    });

    it('returns false when null specified', function () {
      testValidation({
        FirstName: Application.Property({
          min: 0
        })
      }, {
        FirstName: null
      }, false);
    });

    it('returns false when empty string specified', function () {
      testValidation({
        FirstName: Application.Property({
          min: 1
        })
      }, {
        FirstName: ''
      }, false);
    });

    it('returns false when value(Number) is lower than the minimum', function () {
      testValidation({
        FirstName: Application.Property({
          min: 0
        })
      }, {
        FirstName: -1
      }, false);
    });

    it('returns false when value(String) is lower than the minimum', function () {
      testValidation({
        FirstName: Application.Property({
          min: 0
        })
      }, {
        FirstName: '-1'
      }, false);
    });

    it('returns true when empty string specified', function () {
      testValidation({
        FirstName: Application.Property({
          min: 0
        })
      }, {
        FirstName: ''
      }, true);
    });

    it('returns true when value(Number) is bigger than the minimum', function () {
      testValidation({
        FirstName: Application.Property({
          min: 0
        })
      }, {
        FirstName: 1
      }, true);
    });

    it('returns true when value(String) is bigger than the minimum', function () {
      testValidation({
        FirstName: Application.Property({
          min: 0
        })
      }, {
        FirstName: '1'
      }, true);
    });

    it('returns true when value equals min value', function () {
      testValidation({
        FirstName: Application.Property({
          min: 0
        })
      }, {
        FirstName: 0
      }, true);
    });
  });

  describe('max* =>', function () {
    it('returns false when undefined specified', function () {
      testValidation({
        FirstName: Application.Property({
          max: 0
        })
      }, {
        FirstName: undefined
      }, false);
    });

    it('returns false when null specified', function () {
      testValidation({
        FirstName: Application.Property({
          max: 0
        })
      }, {
        FirstName: null
      }, false);
    });

    it('returns false when value(Number) is bigger than the maximum', function () {
      testValidation({
        FirstName: Application.Property({
          max: 0
        })
      }, {
        FirstName: 1
      }, false);
    });

    it('returns false when value(String) is bigger than the maximum', function () {
      testValidation({
        FirstName: Application.Property({
          max: 0
        })
      }, {
        FirstName: '1'
      }, false);
    });

    it('returns true when empty string specified', function () {
      testValidation({
        FirstName: Application.Property({
          max: 0
        })
      }, {
        FirstName: ''
      }, true);
    });

    it('returns true when value(Number) is lower than the maximum', function () {
      testValidation({
        FirstName: Application.Property({
          max: 0
        })
      }, {
        FirstName: -1
      }, true);
    });

    it('returns true when value(String) is lower than the maximum', function () {
      testValidation({
        FirstName: Application.Property({
          max: 0
        })
      }, {
        FirstName: '-1'
      }, true);
    });

    it('returns true when value equals min value', function () {
      testValidation({
        FirstName: Application.Property({
          max: 0
        })
      }, {
        FirstName: 0
      }, true);
    });
  });

  describe('minlength* =>', function () {
    it('returns false when undefined specified', function () {
      testValidation({
        FirstName: Application.Property({
          minlength: 0
        })
      }, {
        FirstName: undefined
      }, false);
    });

    it('returns false when null specified', function () {
      testValidation({
        FirstName: Application.Property({
          minlength: 0
        })
      }, {
        FirstName: null
      }, false);
    });

    it('returns false when empty string specified', function () {
      testValidation({
        FirstName: Application.Property({
          minlength: 1
        })
      }, {
        FirstName: ''
      }, false);
    });

    it('returns false when symbols less than the minlength', function () {
      testValidation({
        FirstName: Application.Property({
          minlength: 4
        })
      }, {
        FirstName: 'abc'
      }, false);
    });

    it('returns true when symbols equal to the minlength', function () {
      testValidation({
        FirstName: Application.Property({
          minlength: 4
        })
      }, {
        FirstName: 'abca'
      }, true);
    });

    it('returns true when symbols more than the minlength', function () {
      testValidation({
        FirstName: Application.Property({
          minlength: 4
        })
      }, {
        FirstName: 'abcaa'
      }, true);
    });

    it('returns true when empty string specified', function () {
      testValidation({
        FirstName: Application.Property({
          minlength: 0
        })
      }, {
        FirstName: ''
      }, true);
    });
  });

  describe('maxlength* =>', function () {
    it('returns false when undefined specified', function () {
      testValidation({
        FirstName: Application.Property({
          maxlength: 0
        })
      }, {
        FirstName: undefined
      }, true);
    });

    it('returns false when null specified', function () {
      testValidation({
        FirstName: Application.Property({
          maxlength: 0
        })
      }, {
        FirstName: null
      }, true);
    });

    it('returns false when symbols more than the maxlength', function () {
      testValidation({
        FirstName: Application.Property({
          maxlength: 2
        })
      }, {
        FirstName: 'abc'
      }, false);
    });

    it('returns true when symbols equal to the maxlength', function () {
      testValidation({
        FirstName: Application.Property({
          maxlength: 4
        })
      }, {
        FirstName: 'abca'
      }, true);
    });

    it('returns true when symbols less than the maxlength', function () {
      testValidation({
        FirstName: Application.Property({
          maxlength: 6
        })
      }, {
        FirstName: 'abcaa'
      }, true);
    });

    it('returns true when empty string specified', function () {
      testValidation({
        FirstName: Application.Property({
          maxlength: 0
        })
      }, {
        FirstName: ''
      }, true);
    });
  });

  describe('regexp* =>', function () {
    it('returns false when undefined specified', function () {
      testValidation({
        FirstName: Application.Property({
          regexp: /123/
        })
      }, {
        FirstName: undefined
      }, false);
    });

    it('returns false when null specified', function () {
      testValidation({
        FirstName: Application.Property({
          regexp: /null/
        })
      }, {
        FirstName: null
      }, false);
    });

    it('returns false when regexp does not match', function () {
      testValidation({
        FirstName: Application.Property({
          regexp: /Antonio/
        })
      }, {
        FirstName: 'antonio'
      }, false);
    });

    it('returns true when regexp match', function () {
      testValidation({
        FirstName: Application.Property({
          regexp: /Antonio/
        })
      }, {
        FirstName: 'Antonio'
      }, true);
    });
  });

  describe('equals* =>', function () {
    it('returns false when comparing undefined == null', function () {
      testValidation({
        FirstName: Application.Property({
          equals: undefined
        })
      }, {
        FirstName: null
      }, false);
    });

    it('returns false when comparing 0 == undefined', function () {
      testValidation({
        FirstName: Application.Property({
          equals: 0
        })
      }, {
        FirstName: undefined
      }, false);
    });

    it('returns false when comparing 0 == empty string', function () {
      testValidation({
        FirstName: Application.Property({
          equals: 0
        })
      }, {
        FirstName: ''
      }, false);
    });

    it('returns false when comparing 0 == zero as string', function () {
      testValidation({
        FirstName: Application.Property({
          equals: 0
        })
      }, {
        FirstName: '0'
      }, false);
    });

    it('returns false when comparing new [1, 2, 3] == [1, 2, 4]', function () {
      testValidation({
        FirstName: Application.Property({
          equals: [1, 2, 4]
        })
      }, {
        FirstName: [1, 2, 3]
      }, false);
    });

    it('returns false when comparing new { value: 1 } == { value: 2 }', function () {
      testValidation({
        FirstName: Application.Property({
          equals: { value: 1 }
        })
      }, {
        FirstName: { value: 2 }
      }, false);
    });

    it('returns true when comparing 0 == 0', function () {
      testValidation({
        FirstName: Application.Property({
          equals: 0
        })
      }, {
        FirstName: 0
      }, true);
    });

    it('returns true when comparing new "John" == "John"', function () {
      testValidation({
        FirstName: Application.Property({
          equals: 'John'
        })
      }, {
        FirstName: 'John'
      }, true);
    });

    it('returns true when comparing new String("John") == new String("John")', function () {
      testValidation({
        FirstName: Application.Property({
          equals: new String('John')
        })
      }, {
        FirstName: new String('John')
      }, true);
    });

    it('returns true when comparing new null == null', function () {
      testValidation({
        FirstName: Application.Property({
          equals: null
        })
      }, {
        FirstName: null
      }, true);
    });

    it('returns true when comparing undefined == undefined', function () {
      testValidation({
        FirstName: Application.Property({
          equals: undefined
        })
      }, {
        FirstName: undefined
      }, true);
    });

    it('returns true when comparing new [1, 2, 3] == [1, 2, 3]', function () {
      testValidation({
        FirstName: Application.Property({
          equals: [1, 2, 3]
        })
      }, {
        FirstName: [1, 2, 3]
      }, true);
    });

    it('returns true when comparing new { value: 1 } == { value: 1 }', function () {
      testValidation({
        FirstName: Application.Property({
          equals: { value: { value: 1 } }
        })
      }, {
        FirstName: { value: 1 }
      }, true);
    });

    it('accepts Property comparison (returns true when properties are equal)', function () {
      testValidation({
        Password: Application.Property({
          equals: Application.Property('RepeatPassword')
        }),
        RepeatPassword: Application.Property({

        })
      }, {
        Password: 3,
        RepeatPassword: 3
      }, true);
    });

    it('accepts Property comparison (returns false when properties are not equal)', function () {
      testValidation({
        Password: Application.Property({
          equals: Application.Property('RepeatPassword')
        }),
        RepeatPassword: Application.Property({

        })
      }, {
        Password: 3,
        RepeatPassword: 2
      }, false);
    });
  });

  describe('validate* =>', function () {
    it('is valid when validate function returns true (does not set error messages)', function () {
      testValidation({
        FirstName: Application.Property({
          validate: function (value) {
            return value === 0;
          }
        })
      }, {
        FirstName: 0
      }, true);
    });

    it('is valid and sets error message when validate returns string', function () {

    });

    it('is not valid when validate function returns false', function () {

    });
  });

  describe('validateAsync* =>', function () {

  });
});
});
})();
