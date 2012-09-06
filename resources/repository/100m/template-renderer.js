/*global namespace: false, $: false, Mustache: false */
/*jslint browser: true */
//= require "/src/namespace, libs/mustache"
(function () {
	var CACHE = {},
		TemplateRenderer = function TemplateRenderer() {};

	TemplateRenderer.prototype.render = function (templateId, data) {
		var template = this.getTemplate(templateId);
		return Mustache.render(template, data);
	};

	TemplateRenderer.prototype.getTemplate = function (templateId) {
		if (typeof CACHE[templateId] === "undefined") {
			CACHE[templateId] = $("#" + templateId).text();
		}
		return CACHE[templateId];
	};

	TemplateRenderer.prototype.transformObject = function (obj) {
		var prop,
			data = [];
		for (prop in obj) {
			if (obj.hasOwnProperty(prop)) {
				data.push({
					'key' : prop,
					'value' : obj[prop]
				});
			}
		}
		return data;
	};

	namespace("hundert", {
		TemplateRenderer: TemplateRenderer
	});
}());