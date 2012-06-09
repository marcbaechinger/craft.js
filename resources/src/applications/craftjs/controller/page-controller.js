/*global controller: false, craftjs: false, jQuery: false, ALL_BUILD_FLAGS: false, document: false, console: true, prompt: false, localStorage */
//= require "../../../controller/model-aware-controller"
//= require "../constants"
(function (exports, $) {
	var PageController = function PageController(model, buildFlagProvider) {
			return new controller.ModelAwareController({
				path: craftjs.data.path,
				model: model,
				elementSelectors: {
					buttons: ".bag-button",
					projectLabel: ".project-name"
				},
				events: {
					"@nav": function (e) {
						var target = $(e.target),
							path = target.data("path");

						if (path) {
							document.location = path;
						}
					},
					"@toggle-file-to-job": function () {
						var slice = {};
						slice[craftjs.data.path] = {};
						if (this.model.data[craftjs.data.path]) {
							this.model.delete(slice);
						} else {
							this.model.set(slice);
						}
					},
					"@delete-file": function (e) {
						var target = $(e.target),
							path = target.data("path");
						if (path) {
							craftjs.services.deleteFile(path, function () {
								target.closest("li").remove();
							});
						}
					},
					// TODO [sprint-1] to complex => refactor
					"@toggle-source-markers": function () {
						var markerPattern = /^[ \d]*:.*\/\/.*(FIXME|TODO)/,
							buf = [],
							markerList = $("#markers");
						markerList.empty();
						$(".source pre").each(function () {
							var line = $(this),
								txt = line.text(),
								convert,
								fixme;
							if (txt.match(markerPattern)) {
								line.toggleClass("marker");
								if (line.hasClass("marker")) {
									convert = txt.replace(/\/\//, "");
									fixme = convert.indexOf("FIXME") > -1;

									convert = convert.replace(/FIXME/, "");
									convert = convert.replace(/TODO/, "");
									buf.push("<li><a href='#" + line.attr("id") + "' class='" +
										(fixme ? "fixme" : "todo") + "'>" +
										(fixme ? "FIXME" : "TODO") + "</a> line " + convert + "</li>");
								}
							}
						});
						if (buf.length < 1) {
							buf.push("<li><a>no markers found</a></li>");
						}
						$(".marker-button").remove();
						markerList.html(buf.join(""));
					},
					"@build": function (e) {
						var target = $(e.target),
							path = target.data("path"),
							query = buildFlagProvider(ALL_BUILD_FLAGS, target.closest("li"));

						document.location = "/" + craftjs.data.context + "/" + path  + query;
					},
					"@build-job": function (e) {
						var target = $(e.target),
							path = target.data("path"),
							query = buildFlagProvider(ALL_BUILD_FLAGS, target.closest("li"));

						craftjs.services.release({
							jobfile: path
						}, function(res, err) {
							if (err) {
								alert("error" + JSON.stringify(err));
							} else {
								document.location = "/" + craftjs.data.dist + "/" + res.path;
							}
						});
					},
					"@show-html": function (e) {
						alert("action page-controller@show-html not implemented yet");
					},
					"@create-test": function(e) {
						
					},
					"@remove-from-project": function (e) {
						var target = $(e.target),
							path = target.data("path"),
							slice = {};

						slice[path] = {};
						this.model.delete(slice);
					},
					"@edit-project-name": function (e) {
						var name = prompt("Project name", localStorage.projectName);
						if (name) {
							localStorage.projectName = name;
							this.render();
						}
						e.stopPropagation();
					},
					"click .collapse": function (e) {
						var target = $(e.target),
							dependent = target.data("dependent");

						if (dependent) {
							$(dependent).toggle();
						} else if (target.hasClass("collapse")) {
							target.next().toggle();
						}
					}
				},
				render: function () {
					if (this.model.data[this.path]) {
						this.$elements.buttons.addClass("contained").text("remove from project");
					} else {
						this.$elements.buttons.removeClass("contained").text("add to project");
					}
					this.$elements.projectLabel.text(localStorage.projectName);
				}
			});
		};
	exports.craftjs.PageController = PageController;
}(this, jQuery));