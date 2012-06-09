/*jslint browser: false, node: true*/

var concat = require("./dependency.js"),
	uglify = require("./uglify.js"),
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
	flags = findFlags(),
	libraryCLIArgument = flags["-l"],
	workingDirectory = process.cwd(),
	repositoryPath = process.argv[libraryCLIArgument + 1] || workingDirectory,
	filePath = process.argv[process.argv.length - 1],
	concatenator = new concat.Concatenator({
		basePath: repositoryPath
	}),
	code;	


var dependencyStack = concatenator.resolve(repositoryPath + "/" + filePath);

code = concatenator.concatenateFiles(dependencyStack);
if (flags["-s"] || flags["--squeeze"] || 
	flags["-m"] || flags["--mangle"] || 
	flags["-b"] || flags["--beautify"]) {
		
	var ast = uglify.parseCode(code),
		generationOptions = {};
		
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



