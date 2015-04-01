define([
  '../core',
  './var/parameterQueryCache',
  './escapeValue',
  './ElementsData',
  './Observer'
], function (blocks, parameterQueryCache, escapeValue, ElementsData, Observer) {
  var Expression = {
    Create: function (text, attributeName, element) {
      var index = -1;
      var endIndex = 0;
      var result = [];
      var character;
      var startIndex;
      var match;

      while (text.length > ++index) {
        character = text.charAt(index);

        if (character == '{' && text.charAt(index + 1) == '{') {
          startIndex = index + 2;
        } else if (character == '}' && text.charAt(index + 1) == '}') {
          if (startIndex) {
            match = text.substring(startIndex, index);
            if (!attributeName) {
              match = match
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, '\'')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>');
            }

            character = text.substring(endIndex, startIndex - 2);
            if (character) {
              result.push(character);
            }

            result.push({
              expression: match,
              attributeName: attributeName
            });

            endIndex = index + 2;
          }
          startIndex = 0;
        }
      }

      character = text.substring(endIndex);
      if (character) {
        result.push(character);
      }

      result.text = text;
      result.attributeName = attributeName;
      result.element = element;
      return match ? result : null;
    },

    GetValue: function (context, elementData, expression) {
      var value = '';

      if (!context) {
        return expression.text;
      }

      blocks.each(expression, function (chunk) {
        if (typeof chunk == 'string') {
          value += chunk;
        } else {
          value += Expression.Execute(context, elementData, chunk, expression).value;
        }
      });

      return value;
    },

    Execute: function (context, elementData, expressionData, entireExpression) {
      var expression = expressionData.expression;
      var attributeName = expressionData.attributeName;
      var expressionObj;
      var observables;
      var result;
      var value;
      var func;

      // jshint -W054
      // Disable JSHint error: The Function constructor is a form of eval
      func = parameterQueryCache[expression] = parameterQueryCache[expression] ||
        new Function('c', 'with(c){with($this){ return ' + expression + '}}');

      Observer.startObserving();

      /* @if DEBUG */ {
        try {
          value = func(context);
        } catch (ex) {
          blocks.debug.expressionFail(expression, entireExpression.element);
        }
      } /* @endif */

      value = func(context);

      result = blocks.unwrap(value);
      result = result == null ? '' : result.toString();
      result = escapeValue(result);

      observables = Observer.stopObserving();

      //for (key in elementData.observables) {
        //  blocks.observable.cache[key]._expressions.push({
        //    length: elementData.length,
        //    element: currentElement,
        //    expression: elementData.expression,
        //    context: elementData.context
        //  });
        //}

      if (blocks.isObservable(value) || observables.length) {
        if (!attributeName) {
          elementData = ElementsData.createIfNotExists();
        }
        if (elementData) {
          elementData.haveData = true;

          expressionObj = {
            length: result.length,
            attr: attributeName,
            context: context,
            elementId: elementData.id,
            expression: expression,
            entire: entireExpression
          };

          blocks.each(observables, function (observable) {
            if (!observable._expressionKeys[elementData.id]) {
              observable._expressionKeys[elementData.id] = true;
              observable._expressions.push(expressionObj);
            }
          });
        }
        if (!attributeName) {
          result = '<!-- ' + elementData.id + ':blocks -->' + result;
        }
      }

      return {
        value: result,
        elementData: elementData
      };
    }
  };

  return Expression;
});
