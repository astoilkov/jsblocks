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
    NodeWise: 4,
    
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
              result.push({
                value: character,
                nodePositions: []
              });
            }

            result.push({
              expression: match,
              attributeName: attributeName,
              nodePositions: []
            });

            endIndex = index + 2;
          }
          startIndex = 0;
        }
      }

      character = text.substring(endIndex);
      if (character) {
        result.push({ 
          value: character,
          nodePositions: []
        });
      }

      result.text = text;
      result.attributeName = attributeName;
      result.element = element;
      result.isExpression = true;
      result.nodeLength = 0;
      return match ? result : null;
    },

    GetValue: function (context, elementData, expression, type) {
      var nodeWise = type == Expression.NodeWise;
      var value = nodeWise ? [] : '';
      var length = expression.length;
      var index = -1;
      var chunk;
      var nodeIndex;
      type = type||Expression.Html;

      if (!context) {
        return expression.text;
      }

      if (type == Expression.Html) {
        expression.nodeLength = 0;
      }

      if (length == 1) {
        if (nodeWise) {
          value[0] = Expression.Execute(context, elementData, expression[0], expression, nodeWise ? Expression.ValueOnly : type);
        } else {
          value = Expression.Execute(context, elementData, expression[0], expression, nodeWise ? Expression.ValueOnly : type);
        }
      } else {
        while (++index < length) {
          chunk = expression[index];
          if (chunk.value) {
            if (nodeWise) {
              // static text can only have one node
              nodeIndex = chunk.nodePositions[0];
              value[nodeIndex] = (value[nodeIndex]||'') + chunk.value;
            } else {
              value += chunk.value;
            }

            if (type == Expression.Html) {
              chunk.nodePositions = []; // resetting nodeIndecies. Seeing currently no other way for resettings for the edge case descriped in https://github.com/astoilkov/jsblocks/issues/104#issuecomment-150715660
              chunk.nodePositions.push(expression.nodeLength === 0 ? expression.nodeLength++ : expression.nodeLength - 1);
            }
          } else {
            if (nodeWise)  {
              // If more then one node (observable) update value node
              nodeIndex = chunk.nodePositions[chunk.nodePositions.length - 1];
              if (chunk.nodePositions.length == 2) {
                value[nodeIndex - 1] = null; // the comment node should be skipped
              }
              value[nodeIndex] = (value[nodeIndex]||'') + Expression.Execute(context, elementData, chunk, expression, Expression.ValueOnly);
            } else {
              value += Expression.Execute(context, elementData, chunk, expression, type);
            }
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

            elementData.observables[observable.__id__ + (attributeName || 'expression') + '[' + expression + ']'] = observable;
          });
        }
        if (!attributeName) {
          if (type == Expression.Html) {
            expressionData.nodePositions = []; //resetting nodeIndecies. Seeing currently no other way for resettings for the edge case descriped in https://github.com/astoilkov/jsblocks/issues/104#issuecomment-150715660
            expressionData.nodePositions.push(entireExpression.nodeLength++, entireExpression.nodeLength++); // two new nodes
          }
          result = '<!-- ' + elementData.id + ':blocks -->' + result;
        }
      } else if (!attributeName && type == Expression.Html) {
        expressionData.nodePositions = [];
        expressionData.nodePositions.push(entireExpression.nodeLength === 0 ? entireExpression.nodeLength++ : entireExpression.nodeLength - 1);
      }

      return result;
    }
  };

  return Expression;
});
