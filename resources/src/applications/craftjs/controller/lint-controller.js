/*global jQuery: false, controller: false, prompt: false, craftjs: false, LINT_DESC: false */
//= require "../../../controller/model-aware-controller"
//= require "../constants"
(function (exports, $) {
	var filterBooleanLintOptions = function (options) {
			return $.map(options, function (val, key) {
				var renderData;
				if (typeof val === "boolean") {
					renderData = {
						key: key,
						val: val,
						desc: LINT_DESC[key],
						on: val === true ? "on" : "off",
						type: typeof val
					};
				}
				return renderData;
			});
		},
		renderLintOptions = function (options, title) {
			return craftjs.renderById("lint-options-tmpl", {
				options: filterBooleanLintOptions(options),
				maxerr: options.maxerr,
				indent: options.indent,
				title: title
			});
		},
		LintController = function LintController(containerId, model) {
			return new controller.ModelAwareController({
				model: model,
				containerSelector: containerId,
				events: {
					"click label": function (e) {
						var target = $(e.target),
							name = target.data("name"),
							slice = {};

						slice[name] = !this.model.data[name];
						this.model.set(slice);
					},
					"@edit-maxerr": function () {
						var maxerr = prompt("max number of errors", this.model.get("maxerr"));
						if (maxerr) {
							this.model.set({maxerr: maxerr});
						}
					},
					"@edit-indent": function () {
						var indent = prompt("number of spaces", this.model.get("indent"));
						if (indent) {
							this.model.set({indent: indent});
						}

					}
				},
				render: function () {
					var buf = [];
					buf.push(renderLintOptions(this.model.data, "JSHint options"));
					this.container.html(buf.join(""));
				},
				toQueryString: function () {
					var buf = "";
					$.each(this.model.data, function (key, val) {
						buf += "lint-" + key + "=" + val + "&";
					});
					return buf;
				}
			});
		};
	exports.craftjs.LintController = LintController;
}(this, jQuery));