define([],
function () {
    var htmlEntityMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        '\'': '&#x27;',
        '/': '&#x2F;'
    };

    var htmlEscapeRegEx = (function () {
        var entities = [];
        for (var entity in htmlEntityMap) {
            entities.push(entity);
        }
        return new RegExp('(' + entities.join('|') + ')', 'g');
    })();

    function internalHTMLEscapeReplacer(entity) {
        return htmlEntityMap[entity];
    }

    var Escape = {
        // moved from modules/escapeRegEx
        forRegEx: function escapeRegEx(string) {
            return string.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
        },
        forHTML: function (value) {
            if (blocks.isString(value)) {
                return value.replace(htmlEscapeRegEx, internalHTMLEscapeReplacer);
            }
            return value;
        },
        // This is only valid because jsblocks forces (inserts itself) double quotes for attributes
        // don't use this in other cases
        forHTMLAttributes: function (value) {
            if (blocks.isString(value)) {
                return value.replace(/"/g, '&quot;');
            }
            return value;
        }
    };
    return Escape;
});
