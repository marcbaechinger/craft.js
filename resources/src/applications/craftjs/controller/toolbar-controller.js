/*global controller: false, document: false, ALL_BUILD_FLAGS: false, craftjs: false,
	jQuery: false, alert: false, prompt: false*/
//= require "../../../controller/model-aware-controller"
//= require "../constants"
(function (exports, $) {
	var buildSingleFile = function (path, transformationFlags) {
			var files = {},
				projectName = prompt("Name of this release");

			if (projectName) {
				if (/[\s]/.test(projectName)) {
					alert("no spaces or tabs allowed");
					return;
				}
				files[path] = {};
				craftjs.services.release({
					name: projectName,
					expand: true,
					files: files,
					transformation: transformationFlags
				});
			}
		},
		ToolbarController = function ToolbarController(containerId, model, buildFlagsProvider) {
			var transformationFlags = [
				"mangle",
				"expand",
				"squeeze",
				"minimize",
				"beautify"
			];
			return new controller.ModelAwareController({
				containerSelector: containerId,
				scann: true,
				model: model,
				elementSelectors: {
					plain: "#plain",
					mangle: "#mangle",
					expand: "#expand",
					squeeze: "#squeeze",
					beautify: "#beautify",
					minimize: "#minimize",
					lint: "#lint",
					release: "#release"
				},
				events: {
					"@build": function (e) {
						var target = $(e.target),
							path = target.data("path"),
							query = buildFlagsProvider(ALL_BUILD_FLAGS, this.container);

						if (this.$elements.release.attr("checked")) {
							buildSingleFile(craftjs.data.path, this.getTransformationFlags());
						} else if (path) {
							document.location = "/" + craftjs.data.context + "/" + path  + query;
						}
					}
				},
				getTransformationFlags: function () {
					var flags = {}, that = this;
					$.each(transformationFlags, function() {
						if (that.$elements[this] && that.$elements[this].attr("checked")) {
							flags[this] = true;
						} else {
							flags[this] = false;
						}
					});
					return flags;
				}
			});
		};

	exports.craftjs.ToolbarController = ToolbarController;
}(this, jQuery));