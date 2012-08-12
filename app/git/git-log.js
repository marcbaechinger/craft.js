/*global */
/*jslint node: true */

/*global require: false, exports: false */
var util  = require('util'),
	logger = require("../logger.js").logger,
	spawn = require('child_process').spawn,
	parseLogOutput = function (log) {
		var lines = log.split("\n"),
			commits = {},
			currentCommit,
			commitMessage = [];
			
		lines.forEach(function (line) {
			var tokens;
			if (line.match(/^commit/)) {
				tokens = line.split(" ");
				if (currentCommit) {
					currentCommit.message = commitMessage.join("");
					commits[currentCommit.id] = currentCommit;
				}
				commitMessage = [];
				currentCommit = { id: tokens[1] };
			} else if (line.match(/^Date:/)) {
				tokens = line.split(" ");
				currentCommit.date = line.substring(tokens[0].length).trim();
			} else if (line.match(/^Author:/)) {
				tokens = line.split(" ");
				currentCommit.author = line.substring(tokens[0].length).trim();
			} else {
				commitMessage.push(line.trim());
			}
		});

		if (currentCommit) {
			currentCommit.message = commitMessage.join("");
			commits[currentCommit.id] = currentCommit;
		}
		
		return commits;
	},
	log = function (directory, callback, error) {
		var process, buf = [], errBuf = [];
		
		logger.debug("running git log", __dirname + '/sh/git-log.sh');
		process = spawn(__dirname + '/sh/git-log.sh', [directory, 25]);
		
		process.stdout.on('data', function (data) {
			buf.push(data);
		});
		process.stderr.on('data', function (data) {
			errBuf.push(data);
		});
		process.on('exit', function (code) {
			if (code) {
				error(code, errBuf.join(""));
			} else {
				callback(parseLogOutput(buf.join("")));
			}
		});
	};

exports.log = log;
