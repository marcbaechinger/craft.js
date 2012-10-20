/*global require:false, exports: false */
(function () {
	"use strict";
	var fs = require("fs"),
		wrench = require("wrench"),
		validFilePostfixes = {
			js: "js",
			cjs: "cjs",
			qunit: "qunit",
			html: "html",
			css: "css",
			txt: "txt",
			json: "json",
			suite: "suite",
			png: "png",
			gif: "gif",
			jpg: "jpg",
			jpeg: "jpeg",
			webapp: "webapp"
		},
		createFileDescriptor = function (basePath, path, filename) {
			var postfix = filename.substring(filename.lastIndexOf(".") + 1),
				childPath = path + "/" + filename,
				childRealPath = basePath + "/" + childPath,
				childStat = fs.statSync(childRealPath),
				childNode = {
					path: childPath,
					realPath: childRealPath,
					name: filename,
					size: childStat.size,
					atime: childStat.atime,
					mtime: childStat.mtime,
					ctime: childStat.ctime
				};
			
			if (childPath.indexOf("/") === 0) {
				childNode.path = childPath.substring(1);
			}
			
			if (childStat.isDirectory()) {
				childNode.type = "directory";
				return childNode;
			} else if (validFilePostfixes[postfix]) {
				childNode.type = postfix;
				return childNode;
			}
			return undefined;
		},
		fileDescriptorComparator = function(a, b) {
			if (a.type === "directory" && b.type !== "directory") {
				return -1;
			} else 	if (a.type !== "directory" && b.type === "directory") {
				return 1;
			} 
			return a.name.localeCompare(b.name);
        },
		createSourceTree = function (basePath, path) {
			var fsNode = {
					path: path,
					realPath: basePath + "/" + path,
					name: path.substring(path.lastIndexOf("/") + 1),
					children: []
				},
				tree = fs.readdirSync(basePath + "/" + path);

			tree.forEach(function (filename) {
				var fileDescriptor = createFileDescriptor(basePath, path, filename);
				if (fileDescriptor) {
					fsNode.children.push(fileDescriptor);
				}
			});
			fsNode.children.sort(fileDescriptorComparator);
			return fsNode;
		},
		searchFiles = function (directory, pattern, callback) {
			var matches = []
			wrench.readdirRecursive(directory, function(err, files) {
				if (!err && !files) {
					callback(null, matches);
				} else if (files) {
					files.forEach(function (file) {
						if (file.match(pattern)) {
							matches.push(file);
						}
					});
				}
			});
		};
	exports.createSourceTree = createSourceTree;
	exports.searchFiles = searchFiles;
}());