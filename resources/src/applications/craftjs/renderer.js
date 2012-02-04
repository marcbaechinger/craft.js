/*global global: false, Mustache: false */
//= require "mustache"
(function (global) {
	var templateCache = {};
	
	global.craftjs = global.craftjs || {};
	global.craftjs.render = function (template, renderData) {
		return Mustache.render(template, renderData);
	};
	global.craftjs.renderById = function (templateId, renderData) {
		if (!templateCache[templateId]) {
			templateCache[templateId] = $("#" + templateId).text();
		}		
		console.log("render", templateId, templateCache[templateId]);
		return Mustache.render(templateCache[templateId], renderData);
	};
	
}(typeof global === "undefined" ? this : global));