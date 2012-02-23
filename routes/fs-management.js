/*global require:false, exports: false */
(function () {
	"use strict";
	var fs = require("fs"),
		validFileMatcher = /\.(js|cjs|html)$/,
		htmlFileMatcher = /\.(html)$/,
		qunitFileMatcher = /\.(qunit)$/,
		createSourceTree = function (basePath, path) {
			var fsNode = {
					path: path,
					realPath: basePath + "/" + path,
					name: path.substring(path.lastIndexOf("/") + 1),
					children: []
				},
				tree = fs.readdirSync(basePath + "/" + path);

			tree.forEach(function (filename) {
				var childPath = path + "/" + filename,
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
					fsNode.children.push(childNode);
				} else if (filename.match(htmlFileMatcher)) {
					childNode.type = "html";
					fsNode.children.push(childNode);
				} else if (filename.match(qunitFileMatcher)) {
					childNode.type = "qunit";
					fsNode.children.push(childNode);
				} else if (filename.match(validFileMatcher)) {
					childNode.type = "js";
					fsNode.children.push(childNode);
				}
			});
			return fsNode;
		};
	exports.createSourceTree = createSourceTree;
}());