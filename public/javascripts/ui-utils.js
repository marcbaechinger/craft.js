/*global $: false, document: true, model: false, controller: false,
	localStorage: false, console: false, data: false, prompt: false */
$(function () {
	var bag, bagModel, pageController, projectPanelController,
		// FIXME test and fix usage from multiple tabs
		getBag = function () {
			var storageValue;
			if (!bag) {
				storageValue = localStorage.bag;
				bag = storageValue ? JSON.parse(storageValue) : {};
			}
			return bag;
		},
		saveBag = function () {
			localStorage.bag = JSON.stringify(bag);
		},
		// TODO replace by a template
		renderCheckBox = function (name) {
			var buf = [];
			buf.push("<label>");
			buf.push(name);
			buf.push("<input type='checkbox' name='");
			buf.push(name);
			buf.push("'");
			buf.push("/>");
			buf.push("</label>");
			return buf.join("");
		},
		// TODO replace by a template
		renderProjectItem = function (path) {
			var buf = ["<li>[<a href='#"];
			buf.push("' data-action='remove-from-project' data-path='");
			buf.push(path);
			buf.push("'>-</a>] <a href='/build/");
			buf.push(path);
			buf.push("'>");
			buf.push(path);
			buf.push("</a><br/>");
			buf.push("</li>");
			return buf.join("");
		};

	if (!localStorage.projectName) {
		localStorage.projectName = "default";
	}

	bagModel = new model.Model({
		data: getBag()
	}).bind("change", saveBag)
		.bind("remove", saveBag);

	projectPanelController = new controller.ModelAwareController({
		model: bagModel,
		containerSelector: "#project-files",
		events: {
			"@build-project": function () {
				$.ajax("/project/build" + this.getBuildFlags(), {
					type: "POST",
					data: JSON.stringify({
						projectName: localStorage.projectName,
						files: bagModel.data
					}),
					dataType: "json",
					contentType: "application/json",
					success: function (data) {
						document.location = "/dist/" + data.path;
					}
				});
			}
		},
		render: function () {
			var buf = ["<div class='build-flags'>Build flags: "];
			buf.push($.map(["mangle", "squeeze", "minimize", "beautify"], renderCheckBox).join(""));
			buf.push("<button class='build' data-action='build-project'>build</button></div><ul>");
			$.each(this.model.data, function (key) {
				buf.push(renderProjectItem(key));
			});
			buf.push("</ul>");
			this.container.html(buf.join(""));
		},
		getBuildFlags: function () {
			var q = "?", that = this;
			$.each(["mangle", "squeeze", "beautify", "minimize"], function () {
				if (that.container.find("[name='" + this + "']").attr("checked")) {
					q += this + "=true&";
				}
			});
			return q;
		}
	}).init();

	pageController = new controller.ModelAwareController({
		path: data.path,
		model: bagModel,
		elementSelectors: {
			buttons: ".bag-button",
			plain: "#plain",
			mangle: "#mangle",
			expand: "#expand",
			squeeze: "#squeeze",
			beautify: "#beautify",
			minimize: "#minimize",
			lint: "#lint",
			projectLabel: ".project-name"
		},
		events: {
			"@toggle-bag": function () {
				var slice = {};
				slice[data.path] = {};
				if (this.model.data[data.path]) {
					this.model.delete(slice);
				} else {
					this.model.set(slice);
				}
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
			"@build": function (e) {
				var target = $(e.target),
					path,
					query = this.getBuildFlags(target.parent());

				path = target.data("path");
				if (path) {
					path = "/" + data.displayMode + "/" + path;
				} else {
					path = document.location.pathname;
				}
				document.location = path + query;
			},
			"click .collapse": function (e) {
				var target = $(e.target),
					dependent = target.data("dependent");
				if (dependent) {
					$(dependent).toggle();
				} else {
					$(e.target).next().toggle();
				}
			}
		},
		render: function () {
			if (this.model.data[data.path]) {
				this.$elements.buttons.addClass("contained").text("remove from project");
			} else {
				this.$elements.buttons.removeClass("contained").text("add to project");
			}
			this.$elements.projectLabel.text(localStorage.projectName);
		},
		getBuildFlags: function (container) {
			var query = "?", that = this;
			$.each(["plain", "mangle", "expand", "squeeze", "beautify", "minimize", "lint"], function () {
				if (that.$elements[this].attr("checked") || container.find("." + this).attr("checked")) {
					query += this + "=true&";
				}
			});
			return query;
		}
	}).init();
});