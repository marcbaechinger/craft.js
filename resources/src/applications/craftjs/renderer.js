/*global global: false, Mustache: false */
//= require "lib/mustache"
(function (exports) {
	var templateCache = {};
	
	exports.craftjs.render = function (template, renderData) {
		return Mustache.render(template, renderData);
	};
	exports.craftjs.renderById = function (templateId, renderData) {
		if (!templateCache[templateId]) {
			templateCache[templateId] = $("#" + templateId).text();
		}		
		return Mustache.render(templateCache[templateId], renderData);
	};
	
}(typeof global === "undefined" ? this : global));