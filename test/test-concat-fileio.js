/*global exports: false, require: false */
(function () {
	
	"use strict";
	var concat = require("../app/concat.js");
	
	exports["concat.parseRequiredLine"] = {
	
		"parse require line: single dependency": function (test) {
			var deps = concat.parseRequireLine("/path/to/file.js", "//= require \" dep \"");
			test.equal(1, deps.length);
			test.equal("/path/to/dep.js", deps[0]);
			test.done();
		},
		"parse require line: absolute dependencies": function (test) {
			var deps = concat.parseRequireLine("/path/to/file.js", "//= require \"dep-1, /path/to/lib/dep.js\"");
			test.equal(2, deps.length);
			test.equal("/path/to/dep-1.js", deps[0]);
			test.equal("/path/to/lib/dep.js", deps[1]);
			test.done();
		},
		"parse require line: multiple dependencies in a single line expression": function (test) {
			var deps = concat.parseRequireLine("/path/to/file.js", "//= require \"dep, dep2     , dep3  \"");
			test.equal(3, deps.length);
			test.equal("/path/to/dep.js", deps[0]);
			test.equal("/path/to/dep2.js", deps[1]);
			test.equal("/path/to/dep3.js", deps[2]);
			test.done();
		},
		"parse require line: dependencies in parent directories": function (test) {
			var deps = concat.parseRequireLine("/path/to/file.js", "//= require \"dep, ../dep2, ../../dep3\"");
			test.equal(3, deps.length);
			test.equal("/path/to/dep.js", deps[0]);
			test.equal("/path/dep2.js", deps[1]);
			test.equal("/dep3.js", deps[2]);
			test.done();
		}
	};
	
	exports["concat.readDependencies"] = {
		"read require lines from file": function (test) {
			var path = "/Users/marcbaechinger/projects/node/quality-js/stuff/src/model/collection.js",
				dependencies = concat.readDependencies(path);

			test.equals(2, dependencies.length);
			test.equals("/Users/marcbaechinger/projects/node/quality-js/stuff/src/model/init-module.js",
				dependencies[0]);
			test.equals("/Users/marcbaechinger/projects/node/quality-js/stuff/src/model/observable.js",
				dependencies[1]);
			test.done();
		},
		"read require lines from file with transitive dependencies": function (test) {

			var path = "/Users/marcbaechinger/projects/node/quality-js/stuff/src/controller/model-aware-controller.js",
				dependencies = concat.readDependencies(path);

			test.equals(3, dependencies.length);
			test.equals("/Users/marcbaechinger/projects/node/quality-js/stuff/src/controller/init-module.js",
				dependencies[0]);
			test.equals("/Users/marcbaechinger/projects/node/quality-js/stuff/src/controller/controller.js",
				dependencies[1]);
			test.equals("/Users/marcbaechinger/projects/node/quality-js/stuff/src/model/collection.js",
				dependencies[2]);
			test.done();
		},
		"read bootsrap.js with overlapping dependencies": function (test) {

			var path = "/Users/marcbaechinger/projects/node/quality-js/stuff/src/deps/app/bootstrap.js",
				dependencies = concat.readDependencies(path);

			test.equals(1, dependencies.length);
			test.equals("/Users/marcbaechinger/projects/node/quality-js/stuff/src/deps/base/widget/list.js",
				dependencies[0]);
			test.done();
		}
	};
}());