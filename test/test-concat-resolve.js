/*global require:false, exports:false, console: false */
(function () {
	"use strict";
	var concat = require("../app/concat.js"),
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
	concat.activeFileProvider = function (filename) {
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

	exports["concat.resolve"] = {
		"resolve direct dependency": function (test) {
			var resolvedList = [];

			resolvedList = concat.resolve("dependency-on-base");

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
			concat.resolve("transitive-dependency-on-base", {}, resolvedList);
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
			concat.resolve("multiple-direct-dependencies", {}, resolvedList);
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
			concat.resolve("multiple-transitive-dependencies", {}, resolvedList);
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
			concat.resolve("joined-dependencies", {}, resolvedList);
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
			concat.resolve("multiple-transitive-redundant-dependency", {}, resolvedList);
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
			concat.resolve("dependency-on-intermediate-base", {}, resolvedList);
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
				concat.resolve("recursive-dependency", {}, resolvedList);
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
				concat.resolve(filename, {}, resolvedList);
			} catch (e) {
				test.equals("file-not-found", e.type);
				test.equals(filename, e.filename);
			}
			test.done();
		}
	};
}());