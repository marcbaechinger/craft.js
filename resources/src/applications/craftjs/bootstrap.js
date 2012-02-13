/*jslint browser:true */
/*global $: false, craftjs: false, model: false, LINT_OPTIONS: false, LINT_DESC: false */
//= require "../../controller/model-aware-controller"
//= require "constants, services, renderer"
//= require "controller/page-controller, controller/toolbar-controller"
//= require "controller/lint-controller, controller/jobpanel-controller"
$(function () {
	var bag, projectModel, lintOptions, lintModel, pageController, buildToolbarController,
		projectPanelController, lintOptionPanelController,
		// FIXME test and fix usage from multiple tabs
		// TODO rename to readLocalJob 
		getBag = function () {
			var storageValue;
			if (!bag) {
				storageValue = localStorage.bag;
				bag = storageValue ? JSON.parse(storageValue) : {};
			}
			return bag;
		},
		// TODO rename to  writeLocalJob
		saveBag = function () {
			localStorage.bag = JSON.stringify(bag);
		},
		// TODO rename to readLocalLintOptions
		getLintOptions = function () {
			var storageValue;
			if (!lintOptions) {
				storageValue = localStorage.lintOptions;
				lintOptions = storageValue ? JSON.parse(storageValue) : LINT_OPTIONS;
			}
			return lintOptions;
		},
		// rename to writeLocalLintOptions
		saveLintOptions = function () {
			localStorage.lintOptions = JSON.stringify(lintModel.data);
		},
		getBuildFlags = function (flags, container) {
			var query = "?";
			$.each(flags, function () {
				if (container.find("[name='" + this + "']").attr("checked")) {
					query += this + "=true&";
				}
			});
			if (container.find("[name='lint']").attr("checked")) {
				// TODO use a model acceesor instead of a controller to access model data
				query += lintOptionPanelController.toQueryString();
			}
			return query;
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


	lintOptionPanelController = new craftjs.LintController("#lint-options", lintModel).init();
	buildToolbarController = new craftjs.ToolbarController("#build-toolbar", new model.Model({
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
	}), getBuildFlags).init();

	projectPanelController = new craftjs.JobPanelController("#project-files", projectModel).init();
	pageController = new craftjs.PageController(projectModel, getBuildFlags).init();
});