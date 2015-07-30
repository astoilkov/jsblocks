define([
  '../core',
  './var/parameterQueryCache',
  './escapeValue',
  './ElementsData',
  './Observer'
], function (blocks, parameterQueryCache, escapeValue, ElementsData, Observer) {
  var Expression = {
    Html: 0,
    ValueOnly: 2,
    brackets: {},

    checkStartChar: function (character, text, index) {
      for (var i = 0; i < Expression.brackets.startBracket.length; i++) {
        if (text.charAt(index + i) != Expression.brackets.startBracket.charAt(i)){
          return false;
        }
      }
      return true;
    },

    checkLastChar: function (character, text, index) {
      for (var i = 0; i < Expression.brackets.endBracket.length; i++) {
        if (text.charAt(index + i) != Expression.brackets.endBracket.charAt(i)){
          return false;
        }
      }
      return true;
    },

    Create: function (text, attributeName, element) {
      var index = -1;
      var endIndex = 0;
      var result = [];
      var character;
      var startIndex;
      var match;

      blocks.brackets = blocks.brackets || '{{ }}';

      Expression.brackets.startBracket = blocks.brackets.split(' ')[0];
      Expression.brackets.endBracket = blocks.brackets.split(' ')[1];

      while (text.length > ++index) {
        character = text.charAt(index);

        if (Expression.checkStartChar(character, text, index)) {
          startIndex = index + Expression.brackets.startBracket.length;
        } else if (Expression.checkLastChar(character, text, index)) {
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

            character = text.substring(endIndex, startIndex - Expression.brackets.endBracket.length);
            if (character) {
              result.push(character);
            }

            result.push({
              expression: match,
              attributeName: attributeName
            });

            endIndex = index + Expression.brackets.endBracket.length;
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
      result.isExpression = true;
      return match ? result : null;
    },

    GetValue: function (context, elementData, expression, type) {
      var value = '';
      var length = expression.length;
      var index = -1;
      var chunk;

      if (!context) {
        return expression.text;
      }

      if (length == 1) {
        value = Expression.Execute(context, elementData, expression[0], expression, type);
      } else {
        while (++index < length) {
          chunk = expression[index];
          if (typeof chunk == 'string') {
            value += chunk;
          } else {
            value += Expression.Execute(context, elementData, chunk, expression, type);
          }
        }
      }

      expression.lastResult = value;

      return value;
    },

    Execute: function (context, elementData, expressionData, entireExpression, type) {
      var expression = expressionData.expression;
      var attributeName = expressionData.attributeName;
      var isObservable;
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

      isObservable = blocks.isObservable(value);
      result = isObservable ? value() : value;
      result = result == null ? '' : result.toString();
      result = escapeValue(result);

      observables = Observer.stopObserving();

      if (type != Expression.ValueOnly && (isObservable || observables.length)) {
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

      return result;
    }
  };

  return Expression;
});
