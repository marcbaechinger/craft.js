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
			
		util.each(tree, function(idx) {
			var dirPath = path + "/" + this,
				dirStat = fs.statSync(basePath + "/" + dirPath);
			if (dirStat.isDirectory()) {
				fsNode.children.push(createSourceTree(basePath, dirPath));
			} else if (this.match(jsFileMatcher) /*|| this.match(lessFileMatcher)*/){
				fsNode.children.push({
					path: path + "/" + this.toString(),
					name: this.toString(),
					lintable: this.match(jsFileMatcher),
					lessable: this.match(lessFileMatcher)
				});
			}
		});
		return fsNode;
	};

exports.createSourceTree = createSourceTree;