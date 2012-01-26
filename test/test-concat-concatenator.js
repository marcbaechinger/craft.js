/*global exports: false, require: false, console: false */
(function () {
	
	"use strict";
	var concat = require("../app/concat.js"),
		nodeunit = require('nodeunit'),
		concatenator;


	exports["concat.Concatenator"] = nodeunit.testCase({
		
		setUp: function (callback) {
			concatenator = new concat.Concatenator({
				basePath: "/Users/marcbaechinger/projects/node/quality-js/stuff"
			});
			callback();
		},
		tearDown: function (callback) {
			concatenator = undefined;
			callback();
		},
		"test access restriction when resolving file not in the resource base path": function (test) {
			var path = "/collection.js";
				
			test.expect(3);
			try {
				concatenator.resolve(path);
			} catch (e) {
				test.equal("illegal-access", e.type);
				test.ok(e.msg);
				test.equal(path, e.path);
			}
			test.done();
		},
		
		"test resolving file": function (test) {
			var path = "/Users/marcbaechinger/projects/node/quality-js/stuff/src/model/collection.js",
				expectedDependencies = [
					"/Users/marcbaechinger/projects/node/quality-js/stuff/src/model/init-module.js",
					"/Users/marcbaechinger/projects/node/quality-js/stuff/src/model/observable.js",
					"/Users/marcbaechinger/projects/node/quality-js/stuff/src/model/collection.js"
				],
				dependencies = concatenator.resolve(path);
				
			test.expect(1);
			test.deepEqual(expectedDependencies, dependencies);
			test.done();
		},
		
		"test concatenating file and its dependencies": function (test) {
			var path = "/Users/marcbaechinger/projects/node/quality-js/stuff/src/model/collection.js",
				content = concatenator.expand(path);
			
			//console.log("content", content);
			test.expect(1);
			test.ok(content);
			test.done();
		}
	});
}());
