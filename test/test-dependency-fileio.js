/*global exports: false, require: false */
(function () {
	
	"use strict";
	var concat = require("../app/dependency.js");
	
	
	
	exports["concat.readDependencies"] = {
		"read require lines from file": function (test) {
			var path = "/Users/marcbaechinger/projects/node/craft-js/stuff/src/model/collection.js",
				dependencies = concat.readDependencies(path);

			test.equals(2, dependencies.length);
			test.equals("/Users/marcbaechinger/projects/node/craft-js/stuff/src/model/init-module.js",
				dependencies[0]);
			test.equals("/Users/marcbaechinger/projects/node/craft-js/stuff/src/model/observable.js",
				dependencies[1]);
			test.done();
		},
		"read require lines from file with transitive dependencies": function (test) {

			var path = "/Users/marcbaechinger/projects/node/craft-js/stuff/src/controller/model-aware-controller.js",
				dependencies = concat.readDependencies(path);

			test.equals(3, dependencies.length);
			test.equals("/Users/marcbaechinger/projects/node/craft-js/stuff/src/controller/init-module.js",
				dependencies[0]);
			test.equals("/Users/marcbaechinger/projects/node/craft-js/stuff/src/controller/controller.js",
				dependencies[1]);
			test.equals("/Users/marcbaechinger/projects/node/craft-js/stuff/src/model/collection.js",
				dependencies[2]);
			test.done();
		},
		"read bootsrap.js with overlapping dependencies": function (test) {

			var path = "/Users/marcbaechinger/projects/node/craft-js/stuff/src/deps/app/bootstrap.js",
				dependencies = concat.readDependencies(path);

			test.equals(1, dependencies.length);
			test.equals("/Users/marcbaechinger/projects/node/craft-js/stuff/src/deps/base/widget/list.js",
				dependencies[0]);
			test.done();
		}
	};
}());