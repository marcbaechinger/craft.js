/*global exports: false, require: false, console: false */
(function () {
	"use strict";
	
	var concat = require("../app/concat.js");

	exports["concat.activeFileProvider - fs impl"] = {
		
		"resolve collection.js": function (test) {
			var path = "/Users/marcbaechinger/projects/node/quality-js/stuff/src/model/collection.js",
				dependencies = concat.resolve(path),
				expectedDependencies = [
					"/Users/marcbaechinger/projects/node/quality-js/stuff/src/model/init-module.js",
					"/Users/marcbaechinger/projects/node/quality-js/stuff/src/model/observable.js",
					"/Users/marcbaechinger/projects/node/quality-js/stuff/src/model/collection.js"
				];
				
			test.expect(1);
			test.deepEqual(expectedDependencies, dependencies);
			test.done();
		},
		"resolve bootstrap": function (test) {

			var path = "/Users/marcbaechinger/projects/node/quality-js/stuff/src/deps/app/bootstrap.js",
				dependencies = concat.resolve(path),
				expectedDependencies = [
					"/Users/marcbaechinger/projects/node/quality-js/stuff/src/deps/common/util.js",
					"/Users/marcbaechinger/projects/node/quality-js/stuff/src/deps/base/widget.js",
					"/Users/marcbaechinger/projects/node/quality-js/stuff/src/deps/base/widget/list.js",
					"/Users/marcbaechinger/projects/node/quality-js/stuff/src/deps/app/bootstrap.js"
				];
				
			test.expect(1);
			test.deepEqual(expectedDependencies, dependencies);
			test.done();
		}
	};
}());