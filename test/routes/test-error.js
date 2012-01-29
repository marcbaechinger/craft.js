/*global exports: false, require: false, console: false, nodeunit: false */
(function () {
	
	"use strict";
	var errorModule = require("../../routes/error.js"),
		nodeunit = require('nodeunit');

// sendErrorPage = function (req, res, err)
	exports["test 'sendErrorPage'"] = nodeunit.testCase({
		"test setting status code": function (test) {
			test.expect(1);
			var statusCode = 999, req = {},
				error = { statusCode: statusCode },
				responseMock = {
					render: function (view, data) {
						test.equal(statusCode, data.error.statusCode);
					}
				};

			errorModule.sendErrorPage(req, responseMock, error);
			test.done();
		},
		"test attached error": function (test) {
			test.expect(2);
			var req = {},
				error = { statusCode: 9999 },
				responseMock = {
					render: function (view, data) {
						test.deepEqual(data.error, JSON.parse(data.errorString));
						test.deepEqual(error, JSON.parse(data.errorString));
					}
				};

			errorModule.sendErrorPage(req, responseMock, error);
			test.done();
		},
		"test rendered view": function (test) {
			test.expect(1);
			var req = {},
				error = {},
				responseMock = {
					render: function (view) {
						test.equal("error", view);
					}
				};
			errorModule.sendErrorPage(req, responseMock, error);
			test.done();
		}
	});

}());

(function () {
	"use strict";

	var errorModule = require("../../routes/error.js"),
		nodeunit = require("nodeunit"),
		originalLog = console.log,
		errorMock = { type: "anerror", statusCode: 404 };
		
	exports["test 'logError'"] = nodeunit.testCase({
		tearDown: function (callback) {
			console.log = originalLog;
			callback();
		},
		"test arguments passed to console.log meet expectations": function (test) {
			test.expect(3);
			console.log = function (firstArg, secondArg) {
				test.equal("ERROR", firstArg);
				test.equal("string", typeof secondArg);
				test.deepEqual(errorMock, JSON.parse(secondArg));
			};
			errorModule.logError(errorMock);
			test.done();
		}
	});
}());