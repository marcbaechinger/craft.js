/*global */
/*jslint node: true */
var logger = require("../logger").logger,
	spawn = require('child_process').spawn
	clone = function (directory, gitUrl, name, callback, error) {
		var process, buf = [], errBuf = [], that = this;
	
		logger.debug("app/git/git-clone.js:clone(): running 'git clone " + gitUrl + " " + name + "' in " + __dirname + "/sh/git-clone.sh");
		process = spawn(__dirname + '/sh/git-clone.sh', [directory, gitUrl, name]);
	
		process.stdout.on('data', function (data) {
			logger.debug(data);
			buf.push(data);
		});
		process.stderr.on('data', function (data) {
			logger.debug(data);
			errBuf.push(data);
		});
		process.on('exit', function (code) {
			if (code) {
				error(errBuf.join(""));
			} else {
				callback(buf.join(""));
			}
		});
	};

exports.clone = clone;