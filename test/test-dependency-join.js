/*global exports: false, require: false, console: false */
(function () {
	
	"use strict";
	var concat = require("../app/dependency.js"),
		nodeunit = require('nodeunit');


	exports["concat.joinDependencies"] = nodeunit.testCase({
		
		setUp: function (callback) {
			callback();
		},
		tearDown: function (callback) {
			callback();
		},
		"no common dependencies": function (test) {
				
			var deps1 = ["base-1", "use-base-1", "my-file-1"],
				deps2 = ["base-2", "use-base-2", "my-file-2"];
				
			test.expect(1);
			var deps = concat.joinDependencies(deps1, deps2);
			test.deepEqual(deps, ["base-1", "use-base-1", "my-file-1", "base-2", "use-base-2", "my-file-2"]);
			
			test.done();
		},
		"simple join of common dependencies": function (test) {
				
			var deps1 = ["base", "use-base", "my-file-1"],
				deps2 = ["base", "use-base", "my-file-2"];
				
			test.expect(1);
			var deps = concat.joinDependencies(deps1, deps2);
			test.deepEqual(deps, ["base", "use-base", "my-file-1", "my-file-2"]);
			
			test.done();
		},
		"simple join with 3 dep chains": function (test) {
				
			var deps1 = ["base", "use-base", "my-file-1"],
				deps2 = ["intermediate", "my-file-2"],
				deps3 = ["base", "use-base", "intermediate", "my-file-3"];
				
			test.expect(1);
			var deps = concat.joinDependencies(deps1, deps2, deps3);
			test.deepEqual(deps, ["base", "use-base", "my-file-1", "intermediate", "my-file-2", "my-file-3"]);
			test.done();
		}
	});
}());
