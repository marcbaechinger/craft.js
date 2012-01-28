/*gloabl exports: true */
(function () {
	var fs = require("fs");
	
	exports.server = {
		port: 3000
	};
	exports.path = {
		src: __dirname + "/stuff",
		dist: __dirname + "/stuffdist",
		views: __dirname + "/views",
		docroot: __dirname + '/public'
	};
	
	exports.mkdir = function (path, mode) {
		var self = this, 
			slashIdx,
			parent;
	    try {
			fs.mkdirSync(path, mode);
			console.log("created directory", path);
	    } catch(e) {
	        if(e.code == "EEXIST") {
	            return;
	        } else if(e.code == "ENOENT") {
	            slashIdx = path.lastIndexOf("/");
	            if(slashIdx > 0) {
	                parent = path.substring(0, slashIdx);
	                exports.mkdir(parent, mode);
	                exports.mkdir(path, mode);
	            } else {
	                throw e;
	            }
	        } else { throw e; }
	    }
	};
}());