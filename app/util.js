/*global exports: false */
(function () {	
	"use strict";
	exports.each = function (array, func) {
		var i, name;
		if (array.isArray) {
			for (i = 0; i < array.length; i += 1) {
				if (func.apply(array[i], [i, array[i]]) === false) {
					break;
				}
			}	
		} else {
			for (name in array) {
				if (array.hasOwnProperty(name)) {
					if (func.apply(array[name], [name, array[name]]) === false) {
						break;
					}
				}
			}
		}
	};
	exports.inherit = function(sub, sup) {
		exports.each(sup, function(key) {
			if (typeof sub[key] === "undefined") {
				sub[key] = this;
			}
		});
		return sub;
	};
}());

