(function() {
	var phantom = require("../app/qunit-phantom.js");
	exports.runPhantomWithQuint = function (req, res, next) {
		
		(new phantom.QUnitPhantomJS({
			url: "http://localhost:" + req.data.config.server.port + "/" + req.data.context + "/" + req.data.path,
			callback: function(code, report) {
				report.exitCode = code;
				
				res.statusCode = 200;
				res.header("Content-Type", "application/json");
				res.send(JSON.stringify(report, null, 2));
			},
			error: function (err) {
				res.statusCode = 200;
				res.header("Content-Type", "application/json");
				res.send(JSON.stringify({
					exitCode: code,
					err: err
				}));	
			}
		})).run();
	};
}());