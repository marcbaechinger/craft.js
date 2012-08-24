/*global */
/*jslint node: true */
var logger = require("../logger").logger,
	spawn = require('child_process').spawn,
	pull = function (directory, callback, error) {
		var process, buf = [], errBuf = [];
	
		logger.debug("app/git/git-pull.js:pull(): running 'git pull' in '" + directory);
		process = spawn(__dirname + '/sh/git-pull.sh', [directory]);
	
		process.stdout.on('data', function (data) {
			logger.debug(data);
			buf.push(data);
		});
		process.stderr.on('data', function (data) {
			logger.debug(data);
			errBuf.push(data);
		});
		process.on('exit', function (code) {
			logger.debug("git pull exited with " + code);
			if (code) {
				error(errBuf.join(""));
			} else {
				callback(buf.join(""));
			}
		});
	};

exports.pull = pull;