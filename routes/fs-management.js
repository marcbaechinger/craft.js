var fs = require("fs"),
	logger = require("winston"),
	util = require("../app/util.js"),
	jsFileMatcher = /\.js$/,
	lessFileMatcher = /\.(less|css)$/,
	createSourceTree = function(basePath, path) {
		var fsNode = {
				path: path,
				realPath: basePath + "/" + path,
				name: path.substring(path.lastIndexOf("/") + 1),
				children: []
			},
			tree = fs.readdirSync(basePath + "/" + path);
			
		tree.forEach(function(filename, idx) {
			var dirPath = path + "/" + filename,
				dirStat = fs.statSync(basePath + "/" + dirPath);
			if (dirStat.isDirectory()) {
				fsNode.children.push(createSourceTree(basePath, dirPath));
			} else if (filename.match(jsFileMatcher) /*|| this.match(lessFileMatcher)*/){
				fsNode.children.push({
					path: path + "/" + filename.toString(),
					name: filename.toString(),
					lintable: filename.match(jsFileMatcher),
					lessable: filename.match(lessFileMatcher)
				});
			}
		});
		return fsNode;
	};

exports.createSourceTree = createSourceTree;