//= require "init-module"
//= require "common-constants"
/*global common: true */
(function (module) {
	var toString = Object.prototype.toString, 
		arrStr = toString.call([]),
		objStr = toString.call({}),
		udf = "undefined",
		/**
		 * copies properties from sup to sub if not already available
		 * 
		 * @param {Object} target the sub objects which receives properties
		 * @param {Object} source
		 **/
		inherit = function inherit(sub) {
			var name, 
				ancestors = Array.prototype.slice.call(arguments, 1),
				i,
				j;
			
			for (i = 0; i < ancestors.length; i += 1) {
				// primitives and arrays not supported
				if (toString.call(ancestors[i]) !== objStr) {
					throw {
						msg: "source must be an object and its, not",
						type: toString.call(ancestors[i]),
						source: ancestors[i]
					};
				}    
				// 
				for (name in ancestors[i]) {
					if (ancestors[i].hasOwnProperty(name)) {
						if (typeof sub[name] === 'undefined') {
							if (toString.call(ancestors[i][name]) === objStr) {
								// objects are not referneced but copied
								sub[name] = inherit({}, ancestors[i][name]);
							} else if (toString.call(ancestors[i][name]) === arrStr) {
								// arrays
								sub[name] = arrCopy(ancestors[i][name]);
							} else {
								// simply reference all other types!!
								sub[name] = ancestors[i][name];
							}
						}
					}
				}
			}
			return sub;
		},
		/**
		 * copies an array and return a clone. Uses inherit 
		 * to clone object values in the array.
		 * 
		 * @param {Array} arr
		 **/
		arrCopy = function arrCopy(arr) {
			var target = [],
				i;
				
			for (i = 0; i < arr.length; i += 1) {
				if (toString.call(arr[i]) === objStr) {
					target[i] = inherit({}, arr[i]);
				} else if (toString.call(arr[i]) === arrStr) {
					target[i] = arrCopy(arr[i]);
				} else {
					target[i] = arr[i];
				}
			}
			return target;
		};
	// expose to module
	module.inherit = inherit;
}(common));
