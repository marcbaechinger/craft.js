/*global $: false, document: true, localStorage: false, model: false, controller: false,
	data: false, craftjs: false, Mustache: false */
//= require "renderer, ../../controller/model-aware-controller"
$(function () {
	var bag, projectModel, lintOptions, lintModel, pageController, buildModel, buildToolbarController, 
		projectPanelController, lintOptionPanelController,
		ALL_BUILD_FLAGS = ["plain", "mangle", "expand", "squeeze", "beautify", "minimize", "lint"],
		LINT_OPTIONS = {
			// Settings
			"passfail" : false, // Stop on first error.
			"maxerr" : 1000, // Maximum error before stopping.

			// Predefined globals whom JSHint will ignore.
			"browser" : true, // Standard browser globals e.g. `window`, `document`.

			"node" : false,
			"rhino" : false,
			"couch" : false,
			"wsh" : false, // Windows Scripting Host.

			"jquery" : true,
			"prototypejs" : false,
			"mootools" : false,
			"dojo" : false,

			// Development.
			"debug" : false, // Allow debugger statements e.g. browser breakpoints.
			"devel" : true, // Allow developments statements e.g. `console.log();`.

			// ECMAScript 5.
			"es5" : true, // Allow ECMAScript 5 syntax.
			"strict" : false, // Require `use strict` pragma in every file.
			"globalstrict" : false, // Allow global "use strict" (also enables 'strict').


			// The Good Parts.
			"asi" : false, // Tolerate Automatic Semicolon Insertion (no semicolons).
			"laxbreak" : true, // Tolerate unsafe line breaks e.g. `return [\n] x` without semicolons.
			"bitwise" : true, // Prohibit bitwise operators (&, |, ^, etc.).
			"boss" : false, // Tolerate assignments inside if, for & while. Usually conditions & loops are for comparison, not assignments.
			"curly" : true, // Require {} for every new block or scope.
			"eqeqeq" : true, // Require triple equals i.e. `===`.
			"eqnull" : false, // Tolerate use of `== null`.
			"evil" : false, // Tolerate use of `eval`.
			"expr" : false, // Tolerate `ExpressionStatement` as Programs.
			"forin" : false, // Tolerate `for in` loops without `hasOwnPrototype`.
			"immed" : true, // Require immediate invocations to be wrapped in parens e.g. `( function (){}() );`
			"latedef" : true, // Prohipit variable use before definition.
			"loopfunc" : false, // Allow functions to be defined within loops.
			"noarg" : true, // Prohibit use of `arguments.caller` and `arguments.callee`.
			"regexp" : true, // Prohibit `.` and `[^...]` in regular expressions.
			"regexdash" : false, // Tolerate unescaped last dash i.e. `[-...]`.
			"scripturl" : true, // Tolerate script-targeted URLs.
			"shadow" : false, // Allows re-define variables later in code e.g. `var x=1; x=2;`.
			"supernew" : false, // Tolerate `new function () { ... };` and `new Object;`.
			"undef" : true, // Require all non-global variables be declared before they are used.


			// Personal styling preferences.
			"newcap" : true, // Require capitalization of all constructor functions e.g. `new F()`.
			"noempty" : true, // Prohibit use of empty blocks.
			"nonew" : true, // Prohibit use of constructors for side-effects.
			"nomen" : true, // Prohibit use of initial or trailing underbars in names.
			"onevar" : false, // Allow only one `var` statement per function.
			"plusplus" : false, // Prohibit use of `++` & `--`.
			"sub" : false, // Tolerate all forms of subscript notation besides dot notation e.g. `dict['key']` instead of `dict.key`.
			"trailing" : true, // Prohibit trailing whitespaces.
			"white" : true, // Check against strict whitespace and indentation rules.
			"indent" : 4 // Specify indentation spacing
		},
		LINT_DESC = {
			// Settings
			"passfail" : "Stop on first error",
			"maxerr" : "Maximum error before stopping",


			"browser" : "Standard browser globals e.g. `window`, `document`",

			"node" : "Allow globals of node.js",
			"rhino" : "Allow globals of rhino",
			"couch" : "Allow globals of couch DB",
			"wsh" : "Allow globals of Windows Scripting Host",

			"jquery" : "allow jquery",
			"prototypejs" : "allow prototypejs",
			"mootools" : "allow mootools",
			"dojo" : "allow dojo",

			"predef" : "Custom globals",


			"debug" : "Allow debugger statements e.g. browser breakpoints",
			"devel" : "Allow developments statements e.g. `console.log();`",


			// ECMAScript 5.
			"es5" : "Allow ECMAScript 5 syntax",
			"strict" : "Require `use strict` pragma in every file",
			"globalstrict" : "Allow global 'use strict' (also enables 'strict')",


			// The Good Parts.
			"asi" : "Tolerate Automatic Semicolon Insertion (no semicolons)",
			"laxbreak" : "Tolerate unsafe line breaks e.g. `return [\n] x` without semicolons",
			"bitwise" : "Prohibit bitwise operators (&, |, ^, etc.)",
			"boss" : "Tolerate assignments inside if, for & while. Usually conditions & loops are for comparison, not assignments",
			"curly" : "Require {} for every new block or scope",
			"eqeqeq" : "Require triple equals i.e. `===`",
			"eqnull" : "Tolerate use of `== null`",
			"evil" : "Tolerate use of `eval`",
			"expr" : "Tolerate `ExpressionStatement` as Programs",
			"forin" : "Tolerate `for in` loops without `hasOwnPrototype`",
			"immed" : "Require immediate invocations to be wrapped in parens e.g. `( function (){}() );`",
			"latedef" : "Prohipit variable use before definition",
			"loopfunc" : "Allow functions to be defined within loops",
			"noarg" : "Prohibit use of `arguments.caller` and `arguments.callee`",
			"regexp" : "Prohibit `.` and `[^...]` in regular expressions",
			"regexdash" : "Tolerate unescaped last dash i.e. `[-...]`",
			"scripturl" : "Tolerate script-targeted URLs",
			"shadow" : "Allows re-define variables later in code e.g. `var x=1; x=2;`",
			"supernew" : "Tolerate `new function () { ... };` and `new Object;`",
			"undef" : "Require all non-global variables be declared before they are used",

			// Personal styling preferences.
			"newcap" : "Require capitalization of all constructor functions e.g. `new F()`",
			"noempty" : "Prohibit use of empty blocks",
			"nonew" : "Prohibit use of constructors for side-effects",
			"nomen" : "Prohibit use of initial or trailing underbars in names",
			"onevar" : "Allow only one `var` statement per function",
			"plusplus" : "Prohibit use of `++` & `--`",
			"sub" : "Tolerate all forms of subscript notation besides dot notation e.g. `dict['key']` instead of `dict.key`",
			"trailing" : "Prohibit trailing whitespaces",
			"white" : "Check against strict whitespace and indentation rules",
			"indent" : "Specify indentation spacing"
		},
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
		getLintOptions = function () {
			var storageValue;
			if (!lintOptions) {
				storageValue = localStorage.lintOptions;
				lintOptions = storageValue ? JSON.parse(storageValue) : LINT_OPTIONS;
			}
			return lintOptions;
		},
		saveLintOptions = function () {
			localStorage.lintOptions = JSON.stringify(lintModel.data);
		},
		// TODO move template into view
		renderCheckBox = function (name) {
			return craftjs.render("<label>{{name}}<input type='checkbox' name='{{name}}'/></label>", {name: name});
		},
		renderProjectItem = function (path) {
			return craftjs.renderById("project-file", {path: path});
		},
		renderPropertyEditor = function (key, val) {
			var buf = [],
				type = typeof val;
			if (type === "boolean") {
				buf.push("<label data-name='" + key + "' class='boolean-editor");
				if (val === true) {
					buf.push(" on");
				}
				if (LINT_DESC[key]) {
					buf.push("' title='" + LINT_DESC[key]);
				}
				buf.push("'>");
				buf.push(key);
				buf.push("</label>");
			}
			return buf.join("");
		},
		filterBooleanLintOptions = function (options) {
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
		getBuildFlags = function (flags, container) {
			var query = "?";
			$.each(flags, function () {
				if (container.find("[name='" + this + "']").attr("checked")) {
					query += this + "=true&";
				}
			});
			if (container.find("[name='lint']").attr("checked")) {
				query += lintOptionPanelController.toQueryString();	
			}
			return query;
		},
		buildProject = function (queryString, projectName, files) {
			$.ajax("/project/build" + queryString, {
				type: "POST",
				data: JSON.stringify({
					projectName: projectName,
					files: files
				}),
				dataType: "json",
				contentType: "application/json",
				success: function (jsonData) {
					document.location = "/" + data.dist + "/" + jsonData.path;
				}
			});
		},
		deleteRelease = function (path, callback) {
			$.ajax("/project/build" + path, {
				type: "DELETE",
				dataType: "json",
				contentType: "application/json",
				success: function (jsonData) {
					console.log("successfully deleted", jsonData);
					if (callback && jsonData.status === "OK") {
						callback();	
					}
				}
			});
		},
		buildSingleFile = function (path, buildFlags) {
			var files = {},
				projectName = prompt("Name of this release");
		
			if (projectName) {
				if (/[\s]/.test(projectName)) {
					alert("no spaces or tabs allowed");
					return;
				}
				files[path] = {};
				buildProject(buildFlags, projectName, files);
			}
		};

	if (!localStorage.projectName) {
		localStorage.projectName = "default";
	}

	projectModel = new model.Model({
		data: getBag()
	}).bind("change", saveBag)
		.bind("remove", saveBag);

	lintModel = new model.Model({
		data: getLintOptions()
	}).bind("change", saveLintOptions);
	
	buildModel = new model.Model({
		data: {
			expand: false,
			mangel: false,
			squeeze: false,
			minimize: false,
			beautify: false,
			lint: true,
			plain: false,
			release: false
		}
	});

	lintOptionPanelController = new controller.ModelAwareController({
		model: lintModel,
		containerSelector: "#lint-options",
		events: {
			"click label": function (e) {
				var target = $(e.target),
					name = target.data("name"),
					slice = {};

				slice[name] = !this.model.data[name];
				this.model.set(slice);
			},
			"@edit-maxerr": function (e) {
				var maxerr = prompt("max number of errors", this.model.get("maxerr"));
				if (maxerr) {
					this.model.set({maxerr: maxerr});
				}
			},
			"@edit-indent": function (e) {
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
	}).init();

	projectPanelController = new controller.ModelAwareController({
		model: projectModel,
		containerSelector: "#project-files",
		events: {
			"@build-project": function () {
				if (!this.isEmpty()) {
					buildProject(this.getBuildFlags(), localStorage.projectName, projectModel.data);
				}
			}
		},
		// TODO render by template
		render: function () {
			var buf = ["<div class='build-flags'>Build flags: "],
				path, 
				buildButtons;
			
			buf.push($.map(["mangle", "squeeze", "minimize", "beautify"], renderCheckBox).join(""));
			buf.push("<button class='build' data-action='build-project'");
			if (this.isEmpty()) {
				buf.push(" disabled='disabled'");
			}
			buf.push(">build</button></div><ul>");
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

	buildToolbarController = new controller.ModelAwareController({
		containerSelector: "#build-toolbar",
		scann: true,
		model: buildModel,
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
					query = getBuildFlags(ALL_BUILD_FLAGS, this.container);

				if (this.$elements.release.attr("checked")) {
					buildSingleFile(data.path, query);
				} else if (path) {		
					document.location = "/" + data.context + "/" + path  + query;
				}
			}
		}
	}).init();
		
	pageController = new controller.ModelAwareController({
		path: data.path,
		model: projectModel,
		elementSelectors: {
			buttons: ".bag-button",
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
			"@delete-release": function(e) {
				var target = $(e.target),
					path = target.data("path");
				console.log("delete", path);
				if (path) {
					deleteRelease(path, function() {
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
						txt = line.text();
					if (txt.match(markerPattern)) {
						line.toggleClass("marker");
						if (line.hasClass("marker")) {
							var convert = txt.replace(/\/\//, ""),
								fixme = convert.indexOf("FIXME") > -1;
							convert = convert.replace(/FIXME/, "");
							convert = convert.replace(/TODO/, "");
							buf.push("<li><a href='#" + line.attr("id") + "' class='" 
								+ (fixme ? "fixme" : "todo") + "'>" 
								+ (fixme ? "FIXME" : "TODO") + "</a> line " + convert + "</li>");
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
					query = getBuildFlags(ALL_BUILD_FLAGS, target.closest("li"));
					
				document.location = "/" + data.context + "/" + path  + query;
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
				} else {
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
	}).init();
});