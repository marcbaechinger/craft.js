/*jslint browser: false, node: true*/

var concat = require("./dependency.js"),
	uglify = require("./uglify.js"),
	flags,
	findFlags = function () {
		var flags = {};
		process.argv.forEach(function (val, index) {
			if (val.match("^-")) {
				flags[val] = index;
				flags[val].value = val;
			}
		});
		return flags;
	},
	expand = function (spec) {
		var concatenator = new concat.Concatenator({
				basePath: spec.repositoryPath
			}),
			dependencyStack = concatenator.resolve(spec.repositoryPath + "/" + spec.filePath),
			flags = spec.flags || {},
			generationOptions = {},
			code,
			ast;

		code = concatenator.concatenateFiles(dependencyStack);
		if (flags["-s"] ||
				flags["--squeeze"] ||
				flags["-m"] ||
				flags["--mangle"] ||
				flags["-b"] ||
				flags["--beautify"]) {

			ast = uglify.parseCode(code);

			if (flags["-m"] || flags["--mangle"]) {
				ast = uglify.mangle(ast, {});
			}
			if (flags["-s"] || flags["--squeeze"]) {
				ast = uglify.squeeze(ast, {});
			}
			if (flags["-b"] || flags["--beautify"]) {
				generationOptions.beautify = true;
			}
			code = uglify.generate(ast, generationOptions);
		}
		console.log(code);
	};


flags = findFlags();

expand({
	flags: flags,
	repositoryPath: process.argv[flags["-l"] + 1] || process.cwd(),
	filePath: process.argv[process.argv.length - 1]
});




