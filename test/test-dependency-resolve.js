/*global require:false, exports:false, console: false */
(function () {
	"use strict";
	var dependency = require("../app/dependency.js"),
		files = {
			"base": {dependencies: []},
			"base-2": {dependencies: []},
			"base-3": {dependencies: []},
			"dependency-on-base": {
				dependencies: [
					"base"
				]
			},
			"dependency-on-base-2": {
				dependencies: [
					"base-2"
				]
			},
			"dependency-on-base-3": {
				dependencies: [
					"base-3"
				]
			},
			"another-dependency-on-base": {
				dependencies: [
					"base"
				]
			},
			"redundant-dependency-on-base": {
				dependencies: [
					"another-dependency-on-base"
				]
			}
		};
	
	// set a mock for the file provider
	dependency.activeFileProvider = function (filename) {
		var file = files[filename];
		if (!file) {
			throw {
				type: "file-not-found",
				filename: filename,
				msg: "File '" + filename + "' not found!"
			};
		}
		return file;
	};

	exports["dependency.resolve"] = {
		"resolve direct dependency": function (test) {
			var resolvedList = [];

			resolvedList = dependency.resolve("dependency-on-base");

			test.equal(2, resolvedList.length);
			test.equal("base", resolvedList[0]);
			test.equal("dependency-on-base", resolvedList[1]);
			test.done();
		},

		"resolve transitive dependency": function (test) {
			var resolvedList = [];

			files["transitive-dependency-on-base"] = {
				dependencies: [
					"dependency-on-base"
				]
			};
			dependency.resolve("transitive-dependency-on-base", {}, resolvedList);
			delete files["transitive-dependency-on-base"];

			test.equal(3, resolvedList.length);
			test.equal("base", resolvedList[0]);
			test.equal("dependency-on-base", resolvedList[1]);
			test.equal("transitive-dependency-on-base", resolvedList[2]);
			test.done();
		},
		"resolve multiple direct dependencies": function (test) {
			var resolvedList = [];

			files["multiple-direct-dependencies"] =  {
				dependencies: [
					"base", "base-2", "base-3"
				]
			};
			dependency.resolve("multiple-direct-dependencies", {}, resolvedList);
			delete files["multiple-direct-dependencies"];

			test.equal(4, resolvedList.length);
			test.equal("base", resolvedList[0]);
			test.equal("base-2", resolvedList[1]);
			test.equal("base-3", resolvedList[2]);
			test.equal("multiple-direct-dependencies", resolvedList[3]);
			test.done();
		},
		"resolve multiple transitive dependencies": function (test) {
			var resolvedList = [],
				pos = 0,
				expectedSortedDependncies = [
					"base",
					"dependency-on-base",
					"base-2",
					"dependency-on-base-2",
					"base-3",
					"dependency-on-base-3",
					"multiple-transitive-dependencies"
				];

			files["multiple-transitive-dependencies"] = {
				dependencies: [
					"dependency-on-base", "dependency-on-base-2", "dependency-on-base-3"
				]
			};
			dependency.resolve("multiple-transitive-dependencies", {}, resolvedList);
			delete files["multiple-transitive-dependencies"];

			test.expect(1);
			test.deepEqual(expectedSortedDependncies, resolvedList);
			test.done();

		},
		"joined dependencies": function (test) {
			var resolvedList = [],
				pos = 0,
				expectedSortedDependncies = [
					"base",
					"another-dependency-on-base",
					"redundant-dependency-on-base",
					"dependency-on-base",
					"joined-dependencies"
				];

			files["joined-dependencies"] = {
				dependencies: [
					"redundant-dependency-on-base", "another-dependency-on-base", "dependency-on-base"
				]
			};
			dependency.resolve("joined-dependencies", {}, resolvedList);
			delete files["joined-dependencies"];

			test.expect(1, resolvedList.length);
			test.deepEqual(expectedSortedDependncies, resolvedList);
			test.done();

		},
		"resolve multiple transitive, redundant dependencies": function (test) {
			var resolvedList = [],
				pos = 0,
				expectedSortedDependncies = [
					"base",
					"another-dependency-on-base",
					"redundant-dependency-on-base",
					"dependency-on-base",
					"base-3",
					"dependency-on-base-3",
					"multiple-transitive-redundant-dependency"
				];

			files["multiple-transitive-redundant-dependency"] = {
				dependencies: [
					"redundant-dependency-on-base", "dependency-on-base", "dependency-on-base-3"
				]
			};
			dependency.resolve("multiple-transitive-redundant-dependency", {}, resolvedList);
			delete files["multiple-transitive-redundant-dependency"];

			test.expect(1);
			test.deepEqual(expectedSortedDependncies, resolvedList);
			
			test.done();

		},
		"dependency on intermediate base of previous sibling": function (test) {
			var resolvedList = [],
				pos = 0,
				expectedSortedDependncies = [
					"base",
					"another-dependency-on-base",
					"redundant-dependency-on-base",
					"base-2",
					"dependency-on-base-2",
					"dependency-on-intermediate-base"
				];

			files["dependency-on-intermediate-base"] = {
				dependencies: [
					"redundant-dependency-on-base",
					"dependency-on-base-2",
					"another-dependency-on-base"
				]
			};
			dependency.resolve("dependency-on-intermediate-base", {}, resolvedList);
			delete files["dependency-on-intermediate-base"];

			test.expect(1);
			test.deepEqual(expectedSortedDependncies, resolvedList);
			test.done();

		},
		"detect recursive dependency": function (test) {
			var resolvedList = [];

			files = {
				"recursive-dependency": {
					dependencies: [
						"recursive-base"
					]
				},
				"recursive-base": {
					dependencies: [
						"recursive-dependency"
					]
				}
			};
			test.expect(1);
			try {
				dependency.resolve("recursive-dependency", {}, resolvedList);
				console.log("error", e.type, e.msg, e);
			} catch (e) {
				test.equals("recursive-dependency", e.type);
			}
			test.done();
		},
		"file not found exception": function (test) {
			var resolvedList = [],
				filename = "file-not-available";
				
			test.expect(2);
			try {
				dependency.resolve(filename, {}, resolvedList);
			} catch (e) {
				test.equals("file-not-found", e.type);
				test.equals(filename, e.filename);
			}
			test.done();
		}
	};
	
	exports["dependency.parseRequireLine"] = {
		"single dependency": function (test) {
			var path = "/repo/base.js",
				line = "//= require \"dep1\"",
				deps = dependency.parseRequireLine(path, line);
			
			test.expect(1);
			test.deepEqual(["/repo/dep1.js"], deps);
			test.done();
		},
		"multiple dependencies": function (test) {
			var path = "/repo/base.js",
				line = "//= require \"dep1 , dep2\"",
				deps = dependency.parseRequireLine(path, line);
			
			test.expect(1);
			test.deepEqual(["/repo/dep1.js", "/repo/dep2.js"], deps);
			test.done();
		},
		"leading and trailing blanks within quotes": function (test) {
			var path = "/repo/base.js",
				line = "//= require \"      dep1           ,       dep2        \"",
				deps = dependency.parseRequireLine(path, line);
			
			test.expect(1);
			test.deepEqual(["/repo/dep1.js", "/repo/dep2.js"], deps);
			test.done();
		},
		"leading and trailing tabs within quotes": function (test) {
			var path = "/repo/base.js",
				line = "//= require \"		dep1		,		dep2		\"",
				deps = dependency.parseRequireLine(path, line);
			
			test.expect(1);
			test.deepEqual(["/repo/dep1.js", "/repo/dep2.js"], deps);
			test.done();
		},
		"trailing blanks after closing quote": function (test) {
			var path = "/repo/base.js",
				line = "//= require \"      dep1           ,       dep2        \"         ",
				deps = dependency.parseRequireLine(path, line);
			
			test.expect(1);
			test.deepEqual(["/repo/dep1.js", "/repo/dep2.js"], deps);
			test.done();
		},
		"trailing tabs after closing quote": function (test) {
			var path = "/repo/base.js",
				line = "//= require \"		dep1		,		dep2		\"			",
				deps = dependency.parseRequireLine(path, line);
			
			test.expect(1);
			test.deepEqual(["/repo/dep1.js", "/repo/dep2.js"], deps);
			test.done();
		},
		"missing closing quote": function (test) {
			var path = "/repo/base.js",
				line = "//= require \"	dep1, dep2	",
				deps = dependency.parseRequireLine(path, line);
			
			test.expect(1);
			test.deepEqual(["/repo/dep1.js", "/repo/dep2.js"], deps);
			test.done();
		},
		"reference to parent directory with ..": function (test) {
			var path = "/repo/base.js",
				line = "//= require \"	dep1, ../dep2	",
				deps = dependency.parseRequireLine(path, line);
			
			test.expect(1);
			test.deepEqual(["/repo/dep1.js", "/dep2.js"], deps);
			test.done();
		},
		"reference to parent of parent directory with ../..": function (test) {
			var path = "/repo/src/",
				line = "//= require \"	../../dep1, ../dep2	",
				deps = dependency.parseRequireLine(path, line);
			
			test.expect(1);
			test.deepEqual(["/dep1.js", "/repo/dep2.js"], deps);
			test.done();
		},
		"parse require line: single dependency": function (test) {
			var deps = dependency.parseRequireLine("/path/to/file.js", "//= require \" dep \"");
			test.equal(1, deps.length);
			test.equal("/path/to/dep.js", deps[0]);
			test.done();
		},
		"parse require line: absolute dependencies": function (test) {
			var deps;
			dependency.allowAbsoluteDependencies(true);
			deps = dependency.parseRequireLine("/path/to/file.js", "//= require \"dep-1, /path/to/lib/dep.js\"");
			test.equal(2, deps.length);
			test.equal("/path/to/dep-1.js", deps[0]);
			test.equal("/path/to/lib/dep.js", deps[1]);
			dependency.allowAbsoluteDependencies(false);
			test.done();
		},
		"illegal access for absolute dependencies": function (test) {
			var deps;
			test.expect(2);
			try {
				deps = dependency.parseRequireLine("/path/to/file.js", "//= require \"dep-1, /path/to/lib/dep.js\"");
			} catch (e) {
				test.equal("illegal-access", e.type);
				test.equal("/path/to/lib/dep.js", e.dep);
			}
			test.done();
		},
		"parse require line: multiple dependencies in a single line expression": function (test) {
			var deps = dependency.parseRequireLine("/path/to/file.js", "//= require \"dep, dep2     , dep3  \"");
			test.equal(3, deps.length);
			test.equal("/path/to/dep.js", deps[0]);
			test.equal("/path/to/dep2.js", deps[1]);
			test.equal("/path/to/dep3.js", deps[2]);
			test.done();
		},
		"parse require line: dependencies in parent directories": function (test) {
			var deps = dependency.parseRequireLine("/path/to/file.js", "//= require \"dep, ../dep2, ../../dep3\"");
			test.equal(3, deps.length);
			test.equal("/path/to/dep.js", deps[0]);
			test.equal("/path/dep2.js", deps[1]);
			test.equal("/dep3.js", deps[2]);
			test.done();
		}
	};
}());