/*global require:false, exports: false */
(function () {
	"use strict";
	var fs = require("fs"),
		jsFileMatcher = /\.(js|cjs)$/,
		lessFileMatcher = /\.(less|css)$/,
		createSourceTree = function (basePath, path) {
			var fsNode = {
					path: path,
					realPath: basePath + "/" + path,
					name: path.substring(path.lastIndexOf("/") + 1),
					children: []
				},
				tree = fs.readdirSync(basePath + "/" + path);

			tree.forEach(function (filename) {
				var dirPath = path + "/" + filename,
					dirStat = fs.statSync(basePath + "/" + dirPath);
				
				if (dirPath.indexOf("/") === 0) {
					dirPath = dirPath.substring(1);
				}
				
				if (dirStat.isDirectory()) {
					//fsNode.children.push(createSourceTree(basePath, dirPath));
					fsNode.children.push({
							path: dirPath,
							realPath: basePath + "/" + dirPath,
							name: dirPath.substring(dirPath.lastIndexOf("/") + 1),
							type: "directory",
							children: []
						});
				} else if (filename.match(jsFileMatcher)) {
					fsNode.children.push({
						path: path + "/" + filename.toString(),
						name: filename.toString(),
						type: "js",
						lintable: filename.match(jsFileMatcher),
						lessable: filename.match(lessFileMatcher)
					});
				}
			});
			return fsNode;
		};
	exports.createSourceTree = createSourceTree;
}());