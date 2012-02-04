/*global $: false, document: true, model: false, controller: false,
	localStorage: false, console: false, data: false, prompt: false, Mustache: false */
//= require "renderer, ../../controller/model-aware-controller"
$(function () {
	var bag, bagModel, lintOptions, lintModel, pageController, projectPanelController, lintOptionPanelController,
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
			"immed" : true, // Require immediate invocations to be wrapped in parens e.g. `( function(){}() );`
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
			"immed" : "Require immediate invocations to be wrapped in parens e.g. `( function(){}() );`",
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
			"indent" : "Specify indentation spacing",
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
		// TODO move template into view
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
		renderLintOptions = function (options, title) {
			var buf = ["<div class='build-flags'>" + title + "</div><div class='value-list'>"];

			$.each(options, function (key, val) {
				buf.push(renderPropertyEditor(key, val));
			});

			buf.push("</div>");
			//return buf.join("");
			var opts = $.map(options, function(val, key) {
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
			return craftjs.renderById("lint-options-tmpl", {
				options: opts,
				maxerr: options.maxerr,
				indent: options.indent,
				title: title
			});
		};

	if (!localStorage.projectName) {
		localStorage.projectName = "default";
	}

	bagModel = new model.Model({
		data: getBag()
	}).bind("change", saveBag)
		.bind("remove", saveBag);

	lintModel = new model.Model({
		data: getLintOptions()
	}).bind("change", saveLintOptions);

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
			"@edit-maxerr": function(e) {
				var maxerr = prompt("max number of errors", this.model.get("maxerr"));
				if (maxerr) {
					this.model.set({maxerr: maxerr});
				}
			},
			"@edit-indent": function(e) {
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
		model: bagModel,
		containerSelector: "#project-files",
		events: {
			"@build-project": function () {
				console.log("===>", data);
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

				query += lintOptionPanelController.toQueryString();
				
				path = target.data("path");
				if (path) {
					path = "/" + data.context + "/" + path;
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