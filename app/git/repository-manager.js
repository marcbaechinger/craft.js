/*jslint node: true */
var clone = require("./git-clone.js").clone,
	fs = require("fs"),
	log = require("./git-log.js").log,
	logger = require("../logger.js").logger,
	invalidDirectoryNamePatterns = [
		/\//,
		/\s/,
		/^\./
	],
	isValidDirectoryName = function (directoryName) {
		var isValid = true;
		directoryName = directoryName.trim();
		invalidDirectoryNamePatterns.forEach(function(invalidPattern) {
			if (directoryName.match(invalidPattern)) {
				logger.info("git-clone:isValidDirectoryName(): detected invalid directory path" 
					+ invalidPattern + " - " + directoryName);
				isValid = false;
			}
		});
		return isValid;
	},
	outputLogger = function (output) {
		logger.info(output);
	},
	errorLogger = function (errout) {
		logger.error(errout);
	},
	RepositoryManager = function (basePathProvider) {
		this.clone = function (url, repositoryName, callback, error) {
			if (!isValidDirectoryName(repositoryName)) {
				logger.error("app/git/git-clone.js:clone(): invalid directory name: '" + repositoryName + "'");
				error({
					code: 99,
					message: "invalid directory name: '" + repositoryName + "'"
				});
				return;
			}
			clone(basePathProvider(), url, repositoryName, callback || outputLogger, error || errorLogger);
		};
		this.log = function (repositoryName, callback, error) {
			log(basePathProvider() + "/" + repositoryName, callback || outputLogger, error || errorLogger);
		};
		this.exists = function (repositoryName, callback) {
			if (!isValidDirectoryName(repositoryName)) {
				callback(false);
			} else {
				fs.stat(basePathProvider() + "/" + repositoryName, function(err, stat) {
					callback(typeof stat !== "undefined");
				});
			}
		};
	};
	
exports.RepositoryManager = RepositoryManager;
