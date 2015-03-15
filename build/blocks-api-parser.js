
  function APIContext(API) {
    this._API = API;
    this._context = {
      isRoot: true,
      namespaces: []
    };
  }

  APIContext.Generate = function (API) {
    return new APIContext(API).generate();
  };

  APIContext.TranslateComment = function (comment) {
    var memberof = APIContext.TranslateTag(comment.tag('memberof'));
    var obj = {
      fullName: comment.fullName().replace(/\./g, '-'),
      name: comment.name(),
      description: comment.tag('description').value(),
      params: APIContext.TranslateTags(comment.tags('param')),
      returns: APIContext.TranslateTag(comment.tag('returns')),
      examples: APIContext.TranslateTags(comment.tags('example'))
    };
    if (memberof) {
      obj.memberof = memberof.value;
    }
    return obj;
  };

  APIContext.TranslateTags = function (tags) {
    var tagsContext = [];
    tags.forEach(function (tag) {
      tagsContext.push(APIContext.TranslateTag(tag));
    });
    return tagsContext;
  };

  APIContext.TranslateTag = function (tag) {
    if (!tag) {
      return;
    }
    var propertyNames = tag.propertyNames();
    var tagContext = {};
    var value;
    var key;
    propertyNames.forEach(function (propertyName) {
      tagContext[propertyName] = tag[propertyName]();
    });
    return tagContext;
  };

  APIContext.prototype = {
    generate: function () {
      this._API.each(API.Type.Namespaces, function (namespace) {
        this._context.namespaces.push(this._fillNamespace(namespace));
      }, this);

      var namespacesPriority = {
        'blocks': 1,
        'blocks.queries': 2,
        'blocks.observable': 3,
        'Application': 4,
        'View': 5,
        'Model': 6,
        'Collection': 7
      };

      this._context.namespaces.sort(function (namespaceA, namespaceB) {
        return namespacesPriority[namespaceA.name] - namespacesPriority[namespaceB.name];
      });

      var namespaceNames = {
        'blocks': 'blocks',
        'blocks.queries': 'data-query="..."',
        'blocks.observable': 'blocks.observable()',
        'Application': 'Application',
        'View': 'View',
        'Model': 'Model',
        'Collection': 'Collection'
      };

      this._context.namespaces.forEach(function (namespace) {
        var name = namespaceNames[namespace.name];
        if (name) {
          namespace.name = name;
        }
      });

      return this._context;
    },

    _fillNamespace: function (namespace) {
      var namespaceContext = {
        type: 'namespace',
        name: namespace.name(),
        namespaces: [],
        classes: [],
        methods: []
      };
      namespace.children().forEach(function (comment) {
        if (comment.type() == Comment.Type.Member) {
          namespaceContext.methods.push(APIContext.TranslateComment(comment));
        } else if (comment.type() == Comment.Type.Namespace) {
          namespaceContext.namespaces.push(this._fillNamespace(comment));
        } else if (comment.type() == Comment.Type.Class) {
          namespaceContext.classes.push(this._fillClasses(comment));
        }
      }, this);

      return namespaceContext;
    },

    _fillClasses: function (classComment) {
      var classContext = {
        type: 'class',
        name: classComment.name(),
        methods: []
      };
      classComment.children().forEach(function (comment) {
        if (comment.type() == Comment.Type.Member) {
          classContext.methods.push(APIContext.TranslateComment(comment));
        }
      }, this);
      return classContext;
    }
  };


  function DefaultLinkManager() {

  }

  DefaultLinkManager.prototype = {
    getUrl: function (comment) {
      return comment.fullName();
    },

    render: function (title, commentOrUrl) {
      if (typeof commentOrUrl != 'string') {
        commentOrUrl = this.getUrl(commentOrUrl);
      }
      return title.link(commentOrUrl);
      //return '<a href='#' + commentOrUrl + ''>' + title + '</a>';
    }
  };

  function Tag(params, options) {
    this._value = '';
    this._tagName = options.name;
  }

  Tag.Extend = function (options) {
    var ExtendedTag = Tag.CreateClass(options);
    var properties = options.properties();
    var key;

    for (key in properties) {
      ExtendedTag.prototype[key] = Tag.CreatePropertyFunction(key);
    }
    return ExtendedTag;
  };

  Tag.CreateClass = function (options) {
    function ExtendedTag(params) {
      var properties = options.properties();
      var key;

      this.constructor.apply(this, Array.prototype.slice.call(arguments).concat([options]));

      for (key in properties) {
        ExtendedTag.prototype['_' + key] = properties[key];
      }
      ExtendedTag.prototype._propertyNames = Object.keys(properties).concat(['value']);
      properties = options.properties();
      options.init(params, properties);
      for (key in properties) {
        this['_' + key] = properties[key];
      }
    }
    ExtendedTag.prototype = new Tag({}, {});
    ExtendedTag.prototype.constructor = Tag;
    return ExtendedTag;
  };

  Tag.CreatePropertyFunction = function (name) {
    return function () {
      return this['_' + name];
    };
  };

  Tag.prototype = {
    tagName: function () {
      return this._tagName;
    },

    value: function () {
      return this._value;
    },

    propertyNames: function () {
      return this._propertyNames;
    }
  };


  function ParamIterator(value) {
    this._value = value;
    this._mode = 'default';
  }

  ParamIterator.prototype = {
    singleValue: function () {
      return this._value;
    },

    mode: function (mode) {
      if (mode !== undefined) {
        this._mode = mode;
        return this;
      }
      return this._mode;
    },

    each: function (callback) {
      if (this._mode == 'multiline') {
        this._eachMultiLine(this._value, callback);
      } else {
        this._eachSingleLine(this._value, callback);
      }
    },

    _eachSingleLine: function (value, callback) {
      var values = value.split(' ');
      var index = 0;
      while (values[index] && !this._handleValue(values, index, callback)) {
        index++;
      }
    },

    _eachMultiLine: function (value, callback) {
      var values = this._value.split('\n');
      var lines = this._normalizeLines(values.slice(1)).join('\n');
      this._eachSingleLine(values[0], callback);
      var context = {
        rawValue: function () {
          return lines;
        },
        isExpression: function () {
          return false;
        },
        optional: function () {
          return false;
        },
        defaultValue: function () {
          return false;
        },
        types: function () {
          return undefined;
        },
        isMultiline: function () {
          return true;
        },
        end: function () {
          return lines;
        }
      };
      callback.call(context, lines, lines);
    },

    _normalizeLines: function (lines) {
      if (lines.length) {
        var matches = /\s+/.exec(lines[0]);
        if (matches) {
          var extraSpace = matches[0].length;
          for (var i = 0; i < lines.length; i++) {
            lines[i] = lines[i].substring(extraSpace);
          }
        }
      }
      return lines;
    },

    _handleValue: function (values, index, callback) {
      var rawValue = values[index];
      var isExpression = rawValue[0] == '{' && rawValue[rawValue.length - 1] == '}';
      var isArguments = false;
      var optional = rawValue[0] == '[' && rawValue[rawValue.length - 1] == ']';
      var value = isExpression || optional ? rawValue.substring(1, rawValue.length - 1) : rawValue;
      var ended = false;
      var defaultValue;

      if (!isExpression && value.indexOf('=') != -1) {
        defaultValue = value.split('=')[1];
        value = value.split('=')[0];
      }
      if (isExpression) {
        value.split('|').forEach(function (type) {
          if (type.indexOf('...') === 0) {
            isArguments = true;
          }
        });
      }
      var context = {
        rawValue: function () {
          return rawValue;
        },
        isExpression: function () {
          return isExpression;
        },
        isMultiline: function () {
          return false;
        },
        optional: function () {
          return optional;
        },
        defaultValue: function () {
          return defaultValue;
        },
        types: function () {
          if (isExpression) {
            return value.replace(/^\(/, '').replace(/\)$/, '').replace(/\s+/g, '').split('|');
          }
        },
        isArguments: function () {
          return isArguments;
        },
        end: function () {
          ended = true;
          return values.slice(index).join(' ');
        }
      };
      callback.call(context, rawValue, value);
      return ended;
    }
  };

  var Tags = {
    Types: {},

    ParamType: {
      Expression: 0,
      Conditional: 1,
      Basic: 2,
      Last: 3
    },

    CreateTagType: function (options) {
      options.properties = options.properties || function () { return {}; };
      options.init = options.init || function () { };
      Tags.Types[options.name] = Tag.Extend(options);
      Tags[options.name[0].toUpperCase() + options.name.substring(1).toLowerCase()] = options.name;
    },

    CreateTag: function (name, value) {
      var Tag = Tags.Types[name.replace(/^@/g, '')];
      if (Tag) {
        return new Tag(new ParamIterator(value));
      } else {
        throw new Error('The tag with ' + name + ' name does not exist');
      }
    }
  };

  Tags.CreateTagType({
    name: 'description',

    properties: function () {
      return {
        description: ''
      };
    },

    init: function (iterator, properties) {
      properties.description = properties.value = iterator.singleValue();
    }
  });

  Tags.CreateTagType({
    name: 'namespace',

    properties: function () {
      return {
        name: ''
      };
    },

    init: function (iterator, properties) {
      properties.name = properties.value = iterator.singleValue();
    }
  });

  Tags.CreateTagType({
    name: 'module',

    properties: function () {
      return {
        name: ''
      };
    },

    init: function (iterator, properties) {
      properties.name = properties.value = iterator.singleValue();
    }
  });

  Tags.CreateTagType({
    name: 'class',

    properties: function () {
      return {
        name: '',
        description: ''
      }
    },

    init: function (iterator, properties) {
      properties.name = properties.value = iterator.singleValue();
    }
  });

  Tags.CreateTagType({
    name: 'memberof',

    properties: function () {
      return {
        name: ''
      };
    },

    init: function (iterator, properties) {
      properties.name = properties.value = iterator.singleValue();
    }
  });

  Tags.CreateTagType({
    name: 'name',

    properties: function () {
      return {
        name: ''
      };
    },

    init: function (iterator, properties) {
      properties.name = properties.value = iterator.singleValue();
    }
  });

  Tags.CreateTagType({
    name: 'public'
  });

  Tags.CreateTagType({
    name: 'global'
  });

  Tags.CreateTagType({
    name: 'type',

    properties: function () {
      return {
        types: [],
        description: ''
      };
    },

    init: function (iterator, properties) {

    }
  });

  Tags.CreateTagType({
    name: 'this',

    properties: function () {
      return {
        types: [],
        description: ''
      };
    },

    init: function (iterator, properties) {

    }
  });

  Tags.CreateTagType({
    name: 'returns',

    properties: function () {
      return {
        types: [],
        description: ''
      };
    },

    init: function (iterator, properties) {
      iterator.each(function () {
        if (this.isExpression()) {
          properties.types = this.types();
        } else if (this.rawValue() != '-') {
          properties.description = this.end();
        }
      });
    }
  });

  Tags.CreateTagType({
    name: 'callback',

    properties: function () {
      return {
        description: ''
      };
    },

    init: function (iterator, properties) {
      iterator.each(function () {
        if (this.isExpression()) {
          properties.types = this.types();
        }
      });
    }
  });

  Tags.CreateTagType({
    name: 'param',

    properties: function () {
      return {
        name: '',
        rawName: '',
        types: [],
        optional: false,
        isArguments: false,
        description: '',
        defaultValue: ''
      };
    },

    init: function (iterator, properties) {
      iterator.each(function (rawValue, value) {
        if (this.isExpression()) {
          properties.types = this.types();
        } else if (this.optional()) {
          properties.optional = true;
        }

        if (this.isArguments()) {
          properties.isArguments = true;
        }

        if (!this.isExpression() && this.rawValue() != '-') {
          if (properties.name) {
            properties.description = this.end();
          } else {
            properties.name = value;
            properties.rawName = rawValue;
            if (this.defaultValue()) {
              properties.defaultValue = this.defaultValue();
            }
          }
        }
      });
    }
  });

  Tags.CreateTagType({
    name: 'link'
  });

  Tags.CreateTagType({
    name: 'example',

    properties: function () {
      return {
        language: '',
        code: ''
      }
    },

    init: function (iterator, properties) {
      iterator.mode('multiline').each(function (rawValue, value) {
        if (this.isExpression()) {
          properties.language = value;
        } else if (this.isMultiline()) {
          properties.code = value;
        }
      });
    }
  });

  Tags.CreateTagType({
    name: 'module',

    properties: function () {
      return {
        name: ''
      };
    },

    init: function (iterator, properties) {
      properties.name = properties.value = iterator.singleValue();
    }
  });


  var escodegen = require('escodegen');

  function Comment(comment, node) {
    this._commentText = comment;
    this._comment = comment;
    this._node = node;

    this._name = '';
    this._code = '';
    this._tokens = [];
    this._tags = [];
    this._children = [];
    this._isGlobal = false;
    this._isPrivate = false;
    this._isPublic = false;

    this._process();
  }

  Comment.TrimStartRegEx = /^[^a-zA-Z0-9@]+/;
  Comment.NewLinesRegEx = /(\r\n|\n|\r)\s+?\*+/gm;
  Comment.ExtraSpacesRegEx = /\s+/g;
  Comment.TrimRegEx = /^\s+|\s+$/g;
  Comment.Type = {
    Namespace: 0,
    Module: 1,
    Class: 2,
    Constructor: 3,
    Property: 4,
    Member: 5,
    MemberOf: 6,
    Enum: 7,
    Function: 8,
    Constant: 9,
    Instance: 10
  };

  Comment.Create = function (node) {
    var comments = [];
    if (node.leadingComments) {
      node.leadingComments.forEach(function (comment, index) {
        if (comment.value[0] == '*' && comment.type == 'Block') {
          comments.push(new Comment(comment.value, index == node.leadingComments.length - 1 ? node : undefined));
        }
      });
    }
    return comments;
  };

  Comment.prototype = {
    fullName: function () {
      var fullName = this.name() || '';
      var current = this;
      while (current.parent()) {
        current = current.parent();
        if (current.name()) {
          fullName = current.name() + '-' + fullName;
        }
      }
      return fullName;
    },

    name: function (value) {
      return this._name;
    },

    type: function () {
      return this._type;
    },

    tags: function (tagName) {
      if (tagName) {
        return this._tags.filter(function (tag) {
          return tag.tagName() === tagName;
        });
      }
      return this._tags;
    },

    tag: function (tagName) {
      return this.tags(tagName)[0];
    },

    parent: function () {
      return this._parent;
    },

    children: function () {
      return this._children;
    },

    commentText: function () {
      return this._commentText;
    },

    code: function () {
      return this._code;
    },

    node: function () {
      return this._node;
    },

    toString: function () {
      return this._commentText + '\n' + this._code;
    },

    _process: function () {
      this._normalize();
      this._tokenize();
      this._createTags();
      this._determineName();
      this._determineType();
      this._determineAdditionalProperties();
    },

    _normalize: function () {
      this._comment = this._comment
        .replace(Comment.NewLinesRegEx, '\n')
        .replace(Comment.TrimStartRegEx, '');
    },

    _tokenize: function () {
      var comment = this._comment;
      var length = comment.length;
      var i = 0;
      var lastIndex = 0;
      var inExpression = 0;
      var char;

      for (; i < length; i++) {
        char = comment[i];
        if (char == '{') {
          inExpression++;
        } else if (char == '}') {
          inExpression--;
        } else if (char == '@' && !inExpression || i == length - 1) {
          this._tokens.push(comment.substring(lastIndex, i).replace(Comment.TrimRegEx, ''));
          lastIndex = i;
        }
      }
    },

    _createTags: function () {
      var tokens = this._tokens;
      var tags = this._tags;
      var tagName;
      var tagValue;

      tokens.forEach(function (token, index) {
        tagName = token.split(' ')[0];
        tagValue = token.split(' ').slice(1).join(' ');
        // first token by default is description if not specified otherwise
        if (index == 0 && tagName[0] != '@') {
          tagValue = tagName + ' ' + tagValue;
          tagName = 'description';
        }
        tags.push(Tags.CreateTag(tagName.toLowerCase(), tagValue));
      });
    },

    _determineName: function () {
      var tag = this.tag(Tags.Name) || this.tag(Tags.Namespace) || this.tag(Tags.Class);
      if (tag) {
        this._name = tag.name();
      } else if (this._node) {
        this._determineNameFromParseTree(this._node);
      }
    },

    _determineNameFromParseTree: function (node) {
      if (node.type == 'Property' && node.key) {
        this._name = node.key.name || node.key.value;
      } else if (node.type == 'ExpressionStatement' && node.expression.left) {
        this._name = node.expression.left.property.name;
      }
    },

    _determineType: function () {
      this._tags.forEach(function (tag) {
        switch (tag.tagName()) {
          case 'namespace':
            this._type = Comment.Type.Namespace;
            break;
          case 'class':
            this._type = Comment.Type.Class;
            break;
          case 'member':
          case 'memberof':
            this._type = Comment.Type.Member;
            break;
        }
      }, this);
      if (!this._type && this._node) {
        this._determineTypeFromParseTree(this._node);
      }
    },

    _determineTypeFromParseTree: function (node) {

    },

    _determineAdditionalProperties: function () {
      if (this._node) {
        this._code = escodegen.generate(this._node);
      }
      this._tags.forEach(function (tag) {
        switch (tag.tagName()) {
          case 'global':
            this._isGlobal = true;
            break;
          case 'public':
            this._isPublic = true;
            break;
          case 'private':
            this._isPrivate = true;
            break;
        }
      }, this);
    }
  };


  function ParsedAPI(options) {
    this._createProperties(options);
  }

  ParsedAPI.Type = {
    All: 'all',
    Namespaces: 'namespaces'
  };

  ParsedAPI.prototype = {
    each: function (type, callback, thisArg) {
      var data;
      if (typeof type == 'string') {
        data = this[type]();
      } else {
        data = this.all();
        thisArg = callback;
        callback = type;
      }
      data.forEach(callback, thisArg);
    },

    _createProperties: function (options) {
      for (var key in options) {
        this['_' + key] = options[key];
        this[key] = this._createPropertyFunction(key);
      }
    },

    _createPropertyFunction: function (name) {
      return function () {
        return this['_' + name];
      }
    }
  };

  var esprima = require('esprima');
  var estraverse = require('estraverse');

  function APIParser(code, options) {
    this._options = options || {};
    this._tree = esprima.parse(code, {
      tokens: true,
      comment: true,
      range: true
    });
    this._linkManager = this._options.linkManager || new DefaultLinkManager();
    this._comments = [];
    this._commentsByFullName = {};
  }

  APIParser.Generate = function (code, linkManager) {
    return new APIParser(code, linkManager).generate();
  };

  APIParser.prototype = {
    generate: function () {
      this._createComments();
      this._createRelations();
      this._processTags();

      return new ParsedAPI({
        all: this._comments,
        namespaces: this._comments.filter(function (comment) {
          return comment.type() == Comment.Type.Namespace;
        }),
        classes: this._comments.filter(function (comment) {
          return comment.type() == Comment.Type.Class;
        })
      });
    },

    parseTree: function () {
      return this._tree;
    },

    _createComments: function () {
      var tree = this._tree;
      estraverse.attachComments(tree, tree.comments, tree.tokens);
      estraverse.traverse(tree, {
        enter: this._createComment.bind(this)
      });
    },

    _createComment: function (node) {
      var comments = Comment.Create(node, this._linkManager);
      this._comments.push.apply(this._comments, comments);
      if (this._options.onparse) {
        this._options.onparse(comments);
      }
    },

    _createRelations: function () {
      var namespaces = {};
      var classes = {};
      var fullName;

      this._comments.forEach(function (comment) {
        fullName = comment.fullName();
        if (fullName) {
          this._commentsByFullName[fullName] = comment;
        }
        if (comment.type() == Comment.Type.Namespace) {
          namespaces[comment.tag(Tags.Namespace).name()] = comment;
        } else if (comment.type() == Comment.Type.Class) {
          classes[comment.name()] = comment;
        }
      }, this);
      this._comments.forEach(function (comment) {
        var memberof = comment.tag(Tags.Memberof);
        var namespace;
        var classComment;
        if (memberof) {
          if (namespace = namespaces[memberof.name()]) {
            namespace.children().push(comment);
            comment._parent = namespace;
          } else if (classComment = classes[memberof.name()]) {
            classComment.children().push(comment);
            comment._parent = classComment;
          }
        }
      });
    },

    _processTags: function () {
      this._comments.forEach(function (comment) {
        comment.tags().forEach(function (tag) {
          this._processTag(tag);
        }, this);
      }, this);
    },

    _processTag: function (tag) {
      tag.propertyNames().forEach(function (propertyName) {
        tag['_' + propertyName] = this._processValue(tag[propertyName]());
      }, this);
    },

    _processValue: function (value) {
      if (typeof value == 'string') {
        return value.replace(/(\[[^]+])?{@\w+\s[^}]+}/g, this._replaceValue.bind(this));
      }
      return value;
    },

    _replaceValue: function (value) {
      var commentsByFullName = this._commentsByFullName;
      var title = value.match(/(\[[^]+])/)[0] || value.split(' ').slice(2).join(' ');
      var param = value.match(/{@\w+\s[^}]+/)[0].match(/\s[^\s]+/)[0].trim();
      var linkValue = param;
      if (commentsByFullName[param]) {
        linkValue = commentsByFullName[param];
      }
      title = title.substring(1, title.length - 1);

      return this._linkManager.render(title, linkValue);
    }
  };


  function API() {
    if (!API.prototype.isPrototypeOf(this)) {
      return new API();
    }
  }

  API.prototype = {
    parse: function (code, options) {
      var onParseCallback = options.onparse;
      var parser = new APIParser(code, {
        onparse: function (comments) {
          comments.forEach(function (comment) {
            onParseCallback(APIContext.TranslateComment(comment), comment.node());
          });
        }
      });
      var parsedApi = parser.generate();

      return {
        parseTree: function () {
          return parser.parseTree();
        },

        tree: function () {
          return APIContext.Generate(parsedApi);
        },

        flat: function () {
          return parsedApi.all().map(function (comment) {
            return APIContext.TranslateComment(comment);
          })
        }
      }
    }
  };

  module.exports = API;
