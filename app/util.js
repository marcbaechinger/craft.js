/*global exports: false, require: false, console: false */
(function () {
	"use strict";
	
	var fs = require("fs");
	
	exports.mkdir = function (path, mode) {
		var slashIdx,
			parent;
	    try {
			fs.mkdirSync(path, mode);
			console.log("created directory", path);
	    } catch (e) {
	        if (e.code === "EEXIST") {
	            return;
	        } else if (e.code === "ENOENT") {
	            slashIdx = path.lastIndexOf("/");
	            if (slashIdx > 0) {
	                parent = path.substring(0, slashIdx);
	                exports.mkdir(parent, mode);
	                exports.mkdir(path, mode);
	            } else {
	                throw e;
	            }
	        } else {
				throw e;
			}
	    }
	};
	exports.inherit = function (sub, sup) {
		exports.each(sup, function (key) {
			if (typeof sub[key] === "undefined") {
				sub[key] = this;
			}
		});
		return sub;
	};
}());

