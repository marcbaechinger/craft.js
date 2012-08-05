/*global jQuery: false, controller: false, localStorage: false, craftjs: false*/
//= require "../../../controller/model-aware-controller"
(function (exports, $) {
	var renderCheckBox = function (name) {
			return craftjs.render("<label><span class='label label-info'>{{name}}<input type='checkbox' name='{{name}}'/></span></label>", {name: name});
		},
		renderProjectItem = function (path) {
			return craftjs.renderById("project-file", {path: path});
		},
		JobPanelController = function JobPanelController(containerId, model) {
			return new controller.ModelAwareController({
				model: model,
				containerSelector: containerId,
				events: {
					"@build-project": function () {
						if (!this.isEmpty()) {
							console.log("this.getTransformFlags()", this.getTransformFlags());
							craftjs.services.release({
								name: localStorage.projectName,
								files: this.model.data,
								expand: true,
								transformation: this.getTransformFlags()
							});
						}
					},
					"@save-job": function () {
						if (!this.isEmpty()) {
							craftjs.services.storeJob({
								// TODO rename to jobName
								name: localStorage.projectName,
								files: this.model.data,
								expand: true,
								transformation: this.getTransformFlags()
							}, function(res) {
								document.location = "/" + craftjs.data.jobs + "/" + res.data.path;
							});
						}
					}
				},
				// TODO render by template
				render: function () {
					var buf = ["<div class='build-flags'>"];

					buf.push($.map(["mangle", "squeeze", "minimize", "beautify"], renderCheckBox).join(""));
					buf.push("<button class='btn btn-inverse btn-mini build' data-action='build-project'");
					if (this.isEmpty()) {
						buf.push(" disabled='disabled'");
					}
					buf.push(">build</button><button data-action='save-job' class='btn btn-inverse btn-mini build'>save</button></div><ul>");
					$.each(this.model.data, function (key) {
						buf.push(renderProjectItem(key));
					});
					buf.push("</ul>");

					this.container.html(buf.join(""));
				},
				isEmpty: function () {
					var path;
					for (path in this.model.data) {
						if (this.model.data.hasOwnProperty(path)) {
							return false;
						}
					}
					return true;
				},
				getTransformFlags: function () {
					var flags = {}, that = this;
					$.each(["mangle", "squeeze", "beautify", "minimize"], function () {
						console.log(this, that.container.find("[name='" + this + "']").attr("checked"));
						if (that.container.find("[name='" + this + "']").attr("checked")) {
							flags[this] = true;
						} else {
							flags[this] = false;
						}
					});
					return flags;
				}
			});
		};
	exports.craftjs.JobPanelController = JobPanelController;
}(this, jQuery));