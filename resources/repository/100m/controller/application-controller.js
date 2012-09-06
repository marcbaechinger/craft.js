/*global hundert: false, $: false, namespace: false */
/*jslint browser: true */
//= require "chart-controller, filter-controller"
//= require "../data-provider, ../template-renderer, /src/namespace"
(function () {

	var ApplicationController = function () {
		var that = this;

		this.renderer = new hundert.TemplateRenderer();
		this.dataProvider = new hundert.DataProvider("100m.txt");

		this.dataProvider.loadData(function (records, athletes, countries) {
			that.countryIndex = countries;
			that.aggregateAthleteData(athletes);
			that.aggregateCountryData(countries);
			that.renderRunners();
			that.renderCountries();
			that.chartController = new hundert.ChartController({
				containerId: 'chart',
				data: records,
				runners: athletes,
				countries: countries,
				aggregatedCountries: that.aggregatedCountries,
				aggregatedRunners: that.aggregatedAthletes
			});
			that.chartController.bind("mouseover", that.createShowPopupCallback(that));
		});

		this.filterController = new hundert.FilterController({});
		this.filterController.bind("change", function (filter) {
			that.chartController.filterData(filter);
		});

		$("body").on("click", function (e) {
			var target = $(e.target).closest("[data-action]"),
				action = target.data("action");
			
			if (that.actions[action]) {
				that.actions[action].call(that, e);
			}
		});
	};
	
	ApplicationController.prototype.actions = {
		"hide-popup": function (e) {
			$(e.target).closest(".popup").hide();
		}
	};
	
	ApplicationController.prototype.createShowPopupCallback = function (controller) {
		return function (record) {
			var elementId = record.name.replace(/ /, ""),
				recordItem;
			if (controller.popup) {
				controller.popup.hide();
			}
			controller.popup = $("#" + elementId);
			controller.popup.find("li").css({
				"font-weight": "300",
				"background-color": "transparent",
				"color": "#000"
			});
			
			controller.popup.find("." + record.id).each(function () {
				var recordItem = $(this),
					parent = recordItem.parent();
					
				recordItem.css("font-weight", "700");
				controller.popup.show();
				parent[0].scrollTop = recordItem[0].offsetTop - 25;
				recordItem.css({
					"background-color": "#333",
					"color": "#fff"
				})
			});
		};
	};
	
	ApplicationController.prototype.aggregateAthleteData = function (athletes) {
		var that = this,
			idx = 0;
		
		this.athleteList = [];
		this.aggregatedAthletes = {};
		
		$.each(athletes, function (name) {
			var runner = {
				id: name.replace(/ /, ""),
				name: name,
				birthday: this[0].birthday,
				country: this[0].country,
				records: this,
				numberOfRecords: this.length,
				color: hundert.COLORS[idx % hundert.COLORS.length]
			};
			that.athleteList.push(runner);
			that.aggregatedAthletes[name] = runner;
			idx++;
		});
	};
	
	
	ApplicationController.prototype.aggregateCountryData = function (countries) {
		var that = this,
			idx = 0;
		
		this.countryList = [];
		this.aggregatedCountries = {};
		
		$.each(countries, function (name) {
			var country = {
				id: name,
				name: name,
				records: this,
				numberOfRecords: this.length,
				color: hundert.COLORS[idx % hundert.COLORS.length]
			};
			that.countryList.push(country);
			that.aggregatedCountries[name] = country;
			idx++;
		});
	};
	ApplicationController.prototype.renderCountries = function () {
		var countryList = [];
		$.each(this.countryIndex, function (name) {
			countryList.push({
				country: name,
				color: hundert.COLORS[countryList.length % hundert.COLORS.length],
				records: this
			});
		});
		$("#country-list").html(this.renderer.render("country-template", {
			countries: countryList,
			countryLabel: function () {
				return this.country + " (" + this.records.length + ")";
			}
		}));
	};
	ApplicationController.prototype.renderRunners = function () {
		$("#runners").html(this.renderer.render("runner-popup", { runners: this.athleteList }));
		$("#athlet-list").html(this.renderer.render("runner-filter-item", {
			runners: this.athleteList,
			nameLabel: function () {
				return this.name + " (" + this.records.length + ")";
			}
		}));
	};
	
	namespace("hundert", {
		ApplicationController: ApplicationController
	});
}());