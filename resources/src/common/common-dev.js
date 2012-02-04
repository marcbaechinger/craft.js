//= require "init-module"
/*global common:true */ 
/**
 * add some functions useful while development to 
 * the <code>common</code> madule namespace.
 * 
 * @author marcbaechinger
 **/
(function (module) {
	/**
	 * logs the arguments if console is available in current environment
	 **/
	var log = function () {
		if (typeof console !== "undefined") {
			console.log(arguments);
		}
	};
	// expose to module
	module.log = log;
}(common));