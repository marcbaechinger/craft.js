/*global require: false, exports: false, console: false, __dirname: true */
(function (exports) {
	"use strict";

	var fs = require("fs"),
		ABSOLUTE_PATH_PATTERN = /^\//,
		DEFAULTS = {
			postFix: ".js",
			fileProvider: function (filename) {
				return {
					dependencies: exports.readDependencies(filename)
				};
			}
		},
		createPath = function (path, dep) {
			var baseDir;
			baseDir = path.substring(0, path.lastIndexOf("/"));
			dep = dep.replace(/^[ \t]+|[ \t]+$/g, "");
			if (dep.match(ABSOLUTE_PATH_PATTERN)) {
				return dep;
			}
			while (dep.indexOf("../") > -1) {
				dep = dep.substring(dep.indexOf("../") + 3);
				baseDir = baseDir.substring(0, baseDir.lastIndexOf("/"));
			}
			return baseDir + "/" + dep + DEFAULTS.postFix;
		},
		parseRequireLine = function (path, line) {
			// format to parse: //= require "dep1, dep2"
			var offset = line.indexOf("\""),
				deps = [],
				lastPos;
			if (offset > -1) {
				lastPos = line.lastIndexOf("\"");
				if (lastPos <= offset) { // missing closing quote
					lastPos = line.length - 1;
				}
				line = line.substring(offset + 1, lastPos);
				if (line.indexOf(",") > -1) {
					deps = line.split(",").map(function (item) {
						return createPath(path, item);
					});
				} else {
					deps.push(createPath(path, line));
				}
			}
			return deps;
		},
		readDependencies = function (path) {
			var content = fs.readFileSync(path).toString(),
				lines = content.split("\n"),
				dependencies = [];
			lines.forEach(function (item) {
				if (item.indexOf("//= require") === 0) {
					dependencies = dependencies.concat(parseRequireLine(path, item));
				}
			});
			return dependencies;
		},
		getFile = function (filename) {
			return exports.activeFileProvider(filename);
		},
		getPosition = function (filelist, filename) {
			var i;
			for (i = 0; i < filelist.length; i += 1) {
				if (filelist[i] === filename) {
					return i;
				}
			}
			return -1;
		},
		resolve = function (filename, bag, filelist) {
			var i, pos = -1,
				file = getFile(filename);

			bag = bag || {};
			filelist = filelist || [];

			pos = getPosition(filelist, filename);

			if (pos > -1) {
				return filelist;
			} else if (bag[filename]) {
				throw {
					type: "recursive-dependency",
					msg: "recursive dependency detected for file " + filename
				};
			}

			bag[filename] = filename;

			if (file.dependencies) {
				for (i = 0; i < file.dependencies.length; i += 1) {
					resolve(file.dependencies[i], bag, filelist);
				}
			}
			// add after last dependency
			filelist.push(filename);
			return filelist;
		},
		contains = function (dep, deps) {
			var i;
			for (i = 0; i < deps.length; i += 1) {
				if (deps[i] === dep) {
					return true;
				}
			}
			return false;
		},
		joinDependencies = function () {
			var args = Array.prototype.slice.call(arguments),
				deps = args.shift(),
				i,
				j,
				dep;

			for (i = 0; i < args.length; i += 1) {
				for (j = 0; j < args[i].length; j += 1) {
					dep = args[i][j];
					if (!contains(dep, deps)) {
						deps.push(dep);
					}
				}
			}
			return deps;
		};

	exports.readDependencies = readDependencies;
	exports.joinDependencies = joinDependencies;
	exports.activeFileProvider = DEFAULTS.fileProvider;
	exports.resolve = resolve;
	exports.parseRequireLine = parseRequireLine;
	exports.Concatenator = function (spec) {
		var basePath = spec.basePath || __dirname,
			checkAccess = function (path) {
				if (path.indexOf(basePath) !== 0) {
					console.error("error: access denied for ", path);
					console.error("error: access denied for ", path);
					throw {
						type: "illegal-access",
						msg: "access to " + path + " is restricted. No Access.",
						path: path
					};
				}
			};

		this.resolve = function (path) {
			checkAccess(path);
			return resolve(path);
		};
		this.expand = function (path) {
			return this.concatenateFiles(this.resolve(path));
		};
		this.concatenateFiles = function (paths) {
			var buf = "";
			paths.forEach(function (filepath) {
				var fileContent = "\n// " + filepath + "\n";
				try {
					fileContent += fs.readFileSync(filepath).toString();
					buf += fileContent;
				} catch (e) {
					console.error("error", e);
				}
			});
			return buf;
		};
		return this;
	};
}(exports));