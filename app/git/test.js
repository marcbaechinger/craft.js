
gitLog(
	__dirname.substring(0, __dirname.lastIndexOf("/")),
	function (code, commits) {
		logger.info(code, JSON.stringify(commits, null, 4));
	},
	function (code, stderr) {
		logger.error(code, stderr);
	}
);