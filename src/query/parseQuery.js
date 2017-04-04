define([
  '../var/trimRegExp'
], function (trimRegExp) {

  function parseQuery(query, callback, context) {
    var character = 0;
    var bracketsCount = 0;
    var curlyBracketsCount = 0;
    var squareBracketsCount = 0;
    var isInSingleQuotes = false;
    var isInDoubleQuotes = false;
    var startIndex = 0;
    var parameters = [];
    var currentParameter;
    var methodName;

    query = query || '';

    for (var i = 0; i < query.length; i++) {
      character = query.charAt(i);

      if (!isInSingleQuotes && !isInDoubleQuotes) {
        if (character == '[') {
          squareBracketsCount++;
        } else if (character == ']') {
          squareBracketsCount--;
        } else if (character == '{') {
          curlyBracketsCount++;
        } else if (character == '}') {
          curlyBracketsCount--;
        }
      }

      if (curlyBracketsCount !== 0 || squareBracketsCount !== 0) {
        continue;
      }

      if (character == '\'') {
        isInSingleQuotes = !isInSingleQuotes;
      } else if (character == '"') {
        isInDoubleQuotes = !isInDoubleQuotes;
      }

      if (isInSingleQuotes || isInDoubleQuotes) {
        continue;
      }

      if (character == '(') {
        if (bracketsCount === 0) {
          methodName = query.substring(startIndex, i).replace(trimRegExp, '');
          startIndex = i + 1;
        }
        bracketsCount++;
      } else if (character == ')') {
        bracketsCount--;
        if (bracketsCount === 0) {
          currentParameter = query.substring(startIndex, i).replace(trimRegExp, '');
          if (currentParameter.length) {
            parameters.push(currentParameter);
          }

          if (methodName) {
            methodName = methodName.replace(/^("|')+|("|')+$/g, ''); // trim single and double quotes
            if (context) {
              callback.call(context, methodName, parameters);
            } else {
              callback(methodName, parameters);
            }
          }
          parameters = [];
          methodName = undefined;
        }
      } else if (character == ',' && bracketsCount == 1) {
        currentParameter = query.substring(startIndex, i).replace(trimRegExp, '');
        if (currentParameter.length) {
          parameters.push(currentParameter);
        }
        startIndex = i + 1;
      } else if (character == '.' && bracketsCount === 0) {
        startIndex = i + 1;
      }
    }
  }

  return parseQuery;
});