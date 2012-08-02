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
									buf.push("<li><a href='#" + line.data("id") + "' class='" +
										(fixme ? "fixme" : "todo") + "'>" +
										(fixme ? "FIXME" : "TODO") + "</a> line " + convert + "</li>");
								}
							}
						});
						if (buf.length < 1) {
							$(".marker-button").text("no TODOs/FIXMEs found");
						} else {	
							$(".marker-button").remove();
						}
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
					"@send-configuration": function (e) {
						var resourcePathInput = $("#resource-path"),
							path = resourcePathInput.val();
							
						if (path.trim().length < 1) {
							$("#configuration .feedback").text("enter a path to the directory where your javascripts are").show();
						} else {
							craftjs.services.sendConfiguration({ path: path }, function() {
								resourcePathInput.attr("disabled", "true");
								$("#configuration .feedback").text("resource directory points now to '" + path + "'").show();
							});
						}
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
					"click .collapser": function (e) {
						var target = $(e.target),
							referenceElement,
							dependent = target.data("dependent"),
							slide = target.data("slide");
						
						if (dependent) {	
							referenceElement = $(dependent);
						} else if (target.hasClass("collapser")) {
							referenceElement = target.next();
						}
						if (referenceElement && slide) {
							referenceElement.slideToggle();
						} else if (referenceElement) {
							referenceElement.toggle();
						}
					}
				},
				render: function () {
					if (this.model.data[this.path]) {
						this.$elements.buttons.addClass("contained").text("remove from Favorites");
					} else {
						this.$elements.buttons.removeClass("contained").text("add to Favorites");
					}
					this.$elements.projectLabel.text(localStorage.projectName);
				}
			});
		};
	exports.craftjs.PageController = PageController;
}(this, jQuery));