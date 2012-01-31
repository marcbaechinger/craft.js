/*global require: false, exports: false, Buffer: true */
(function () {
	"use strict";
	
	var uglify = require("uglify-js"),
		fs = require("fs"),
		util = require("util"),
		jsp = uglify.parser,
		pro = uglify.uglify,
		writeTo = function (path, text) {
			var buf = new Buffer(text), fd;
			try {
				fd = fs.openSync(path, "w");
				fs.writeSync(fd, buf, 0, buf.length, 0);
			} finally {
				if (fd) {
					fs.closeSync(fd);
				}
			}
		};
	
	exports.parseCode = function (sourceCode, strictSemicolons) {
		return jsp.parse(sourceCode, strictSemicolons || false);
	};
	exports.parseFile = function (path, strictSemicolons) {		
		var sourceCode = fs.readFileSync(path).toString();
		return exports.parseCode(sourceCode, strictSemicolons);
	};
	exports.mangle = function (ast, options) {
		return pro.ast_mangle(ast, options);
	};
	exports.squeeze = function (ast, options) {
		return pro.ast_squeeze(ast, options);
	};
	exports.generate = function (ast, options) {
		return pro.gen_code(ast, options);
	};
	
	exports.transform = function (ast, specs) {
		var task, i;
		for (i = 0; i < specs.length; i += 1) {
			task = specs[i].task;
			switch (task) {
			case "mangle":
				ast = exports.mangle(ast, specs[i].options);
				break;
			case "squeeze":
				ast = pro.ast_squeeze(ast, specs[i].options);
				break;
			default:
				break;
			}
		}
		return ast;
	};

	exports.process = function (spec) {
		var ast, i, targetCode, dest;
		console.log("### process spec ------------------------------------------------");
		console.log(util.inspect(spec, false, null));
		console.log("### process spec ------------------------------------------------");
		ast = exports.parseFile(spec.src, spec.strictSemicolon || false);

		if (spec.transform) {
			ast = exports.transform(ast, spec.transform);
		}
		
		if (spec.generate) {
			for (i = 0; i < spec.generate.length; i += 1) {
				targetCode = exports.generate(ast, spec.generate[i].options);
				dest = spec.src.replace(/\.js/, "." + spec.generate[i].name + ".js"); 
				
				console.log("generate -", "options: " + JSON.stringify(spec.generate[i]), dest);
				writeTo(dest, targetCode);
			}
		}
	};
	
}());