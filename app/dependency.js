/*global require: false, exports: false, console: false, __dirname: true */
(function (exports) {
	"use strict";

	var fs = require("fs"),
		ALLOW_ABSOULTE_DEPENDENCIES = false,
		ABSOLUTE_PATH_PATTERN = /^\//,
		DEFAULTS = {
			postFix: ".js",
			fileProvider: function (filename, basePath) {
				return {
					dependencies: exports.readDependencies(filename, basePath)
				};
			}
		},
		createPath = function (path, dep, basePath) {
			var baseDir;
			baseDir = path.substring(0, path.lastIndexOf("/"));
			dep = dep.replace(/^[ \t]+|[ \t]+$/g, "");
			if (dep.match(ABSOLUTE_PATH_PATTERN)) {
				if (ALLOW_ABSOULTE_DEPENDENCIES === true) {
					return basePath + dep + DEFAULTS.postFix;
				} else {
					throw { 
						type: "illegal-access",
						dep: dep
					};
				}
			}
			while (dep.indexOf("../") > -1) {
				dep = dep.substring(dep.indexOf("../") + 3);
				baseDir = baseDir.substring(0, baseDir.lastIndexOf("/"));
			}
			return baseDir + "/" + dep + DEFAULTS.postFix;
		},
		parseRequireLine = function (path, line, basePath) {
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
						return createPath(path, item, basePath);
					});
				} else {
					deps.push(createPath(path, line, basePath));
				}
			}
			return deps;
		},
		readDependencies = function (path, basePath) {	
			var content = fs.readFileSync(path).toString(),
				lines = content.split("\n"),
				dependencies = [],
				currentLine;
			lines.forEach(function (item) {
				if (item.indexOf("//= require") === 0) {
					currentLine = item;
					dependencies = dependencies.concat(parseRequireLine(path, item, basePath));
				}
			});
			return dependencies;
		},
		getFile = function (filename, basePath) {
			return exports.activeFileProvider(filename, basePath);
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
		resolve = function (filename, bag, filelist, basePath) {
			var i, pos = -1,
				file = getFile(filename, basePath);

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
					resolve(file.dependencies[i], bag, filelist, basePath);
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
	exports.allowAbsoluteDependencies = function (allow) {
		ALLOW_ABSOULTE_DEPENDENCIES = allow;
	};
	exports.Concatenator = function (spec) {
		var basePathProvider = spec.basePathProvider || function() { return __dirname; },
			checkAccess = function (path) {
				if (path.indexOf(basePathProvider()) !== 0) {
					console.error("error: access denied for ", path, "repo:", basePathProvider());
					console.error("error: access denied for ", path, "repo:", basePathProvider());
					throw {
						type: "illegal-access",
						msg: "access to " + path + " is restricted. No Access.",
						path: path
					};
				}
			};

		this.resolve = function (path) {
			checkAccess(path);
			
			return resolve(path, undefined, undefined, basePathProvider());
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