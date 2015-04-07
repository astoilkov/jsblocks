module.exports = function (grunt) {
  grunt.registerTask('build-tests-definitions', function () {
    var tests = {};
    var contents;
    var key;

    grunt.file.recurse('test/spec', function (abspath) {
      placeInObject(tests, abspath.replace('test/', ''), abspath.replace('test/spec/', ''));
    });

    for (key in tests) {
      tests['blocks.' + key] = tests[key];
      delete tests[key];
    }

    contents = JSON.stringify(tests);

    grunt.file.write('test/tests.json', contents);
  });

  function placeInObject(current, fullPath, currentPath) {
    var parts = currentPath.split('/');
    var firstPart = parts[0];
    var obj;

    if (parts.length == 2) {
      (current[firstPart] = current[firstPart] || []).push(fullPath);
    } else {
      obj = current[firstPart] = current[firstPart] || {};
      if (obj instanceof Array) {
        obj.push({});
        obj = obj[obj.length - 1];
      }
      placeInObject(obj, fullPath, parts.slice(1).join('/'));
    }
  }
};